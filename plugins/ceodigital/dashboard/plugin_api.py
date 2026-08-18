"""CEODigital dashboard plugin — backend API routes (the "plugin door").

Mounted at ``/api/plugins/ceodigital/*`` by the dashboard plugin system
(``hermes_cli.web_server._mount_plugin_api_routes``), mirroring the kanban
plugin's ``plugins/kanban/dashboard/plugin_api.py``.

This layer is deliberately thin and read-only (W3): it proxies work items
from the CEODigital platform over its MCP endpoint (Direction A, march of
the fork ownership map §3.1/§3.2). The Hermes renderer never sees the MCP
credentials — tenant slug and MCP token live in the host config, server
side, and are never rendered into a response.

Security note
-------------
* Config (``ceodigital.app_url`` / ``ceodigital.tenant_slug`` /
  ``ceodigital.mcp_token``) is read from ``HERMES_HOME/config.yaml`` layered
  with ``HERMES_HOME/ceodigital_overrides.yaml`` and ``CEODIGITAL_*`` env
  vars. Never hardcoded (ownership map §10.3.2/§10.3.7).
* The MCP bearer token is never written to logs or error bodies.
* HTTP responses always use the ``{ok, ...}`` envelope, so the desktop
  REST caller can branch on ``data.ok`` regardless of the error branch.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

import httpx

from fastapi import APIRouter, Body, Query
from fastapi.responses import JSONResponse

from hermes_constants import get_hermes_home

log = logging.getLogger(__name__)

router = APIRouter()

# CEODigital platform MCP mount. The scheme/host are NEVER hardcoded — they
# come from config (``ceodigital.app_url``). The ``{slug}`` is the tenant's
# own slug from config (``ceodigital.tenant_slug``), never a production slug.
_MCP_PATH = "/api/public/mcp"

# Config keys (all optional per se; a missing value yields a typed error).
CFG_SECTION = "ceodigital"
CFG_KEYS = ("app_url", "tenant_slug", "mcp_token")
ENV_KEYS = {
    "app_url": "CEODIGITAL_APP_URL",
    "tenant_slug": "CEODIGITAL_TENANT_SLUG",
    "mcp_token": "CEODIGITAL_MCP_TOKEN",
}

# Typed error codes (the contract in the design doc §5).
ERR_NOT_CONFIGURED = "mcp_not_configured"
ERR_UNREACHABLE = "mcp_unreachable"
ERR_TENANT_NOT_FOUND = "tenant_not_found"


class _TypedError(Exception):
    """Carries one of the typed envelope error codes (never a secret)."""

    def __init__(self, code: str, *args: Any) -> None:
        super().__init__(code, *args)
        self.code = code


def _as_error(code: str) -> JSONResponse:
    """Typed error envelope with a matching HTTP status.

    The desktop renderer branches on ``data.ok`` (design doc §5); the
    HTTP status is a courtesy for logs/proxies — the envelope body is the
    contract and never carries the MCP token or a concrete URL/slug.
    """
    status = {
        ERR_NOT_CONFIGURED: 503,
        ERR_UNREACHABLE: 502,
        ERR_TENANT_NOT_FOUND: 404,
        "not_found": 404,
    }.get(code, 500)
    return JSONResponse(content={"ok": False, "error": code}, status_code=status)


# ---------------------------------------------------------------------------
# Config (never hard-coded, per ownership map §10.3.2 / §10.3.7)
# ---------------------------------------------------------------------------


def _load_config() -> Dict[str, Any]:
    """Read the ``ceodigital`` config with layered precedence.

    1. ``HERMES_HOME/config.yaml``  — ``ceodigital:`` section
    2. ``HERMES_HOME/ceodigital_overrides.yaml`` — dev/provisioning overlay
    3. ``CEODIGITAL_*`` environment variables — highest precedence

    None of these contain a production URL/slug in this repo's source.
    """
    cfg: Dict[str, Any] = {}

    # 1. config.yaml via the project config loader (profile-aware).
    try:
        from hermes_cli.config import cfg_get, load_config_readonly

        full = load_config_readonly() or {}
        section = cfg_get(full, CFG_SECTION)
        if isinstance(section, dict):
            cfg.update({k: v for k, v in section.items() if v is not None})
    except Exception as exc:  # pragma: no cover - host config optional
        log.warning("ceodigital: config.yaml unavailable: %s", exc)

    # 2. overrides file (provisioning / dev overlay).
    try:
        import yaml  # type: ignore

        overrides_path = get_hermes_home() / "ceodigital_overrides.yaml"
        if overrides_path.exists():
            raw = yaml.safe_load(overrides_path.read_text(encoding="utf-8")) or {}
            if isinstance(raw, dict):
                for k, v in raw.items():
                    if v is not None:
                        cfg[k] = v
    except Exception as exc:  # pragma: no cover - optional overlay
        log.warning("config: could not read ceodigital_overrides.yaml: %s", exc)

    # 3. environment overrides win over every file layer.
    for key, env_name in ENV_KEYS.items():
        if os.environ.get(env_name):
            cfg[key] = os.environ[env_name]

    return {k: cfg.get(k) for k in CFG_KEYS}


def _build_mcp_url(cfg: Dict[str, Any]) -> Optional[str]:
    """Compose the CEODigital MCP endpoint URL, or ``None`` when config
    is incomplete (that maps to ``mcp_not_configured``)."""
    app_url = (cfg.get("app_url") or "").strip().rstrip("/")
    slug = (cfg.get("tenant_slug") or "").strip()
    if not app_url or not slug:
        return None
    return f"{app_url}{_MCP_PATH}/{slug}"


# ---------------------------------------------------------------------------
# MCP transport (httpx — already a project dependency)
# ---------------------------------------------------------------------------


def _mcp_fetch(cfg: Dict[str, Any], tool_name: str, arguments: Dict[str, Any]) -> Any:
    """Call a CEODigital MCP tool and return its (unwrapped) payload.

    Raises :class:`_TypedError` with a typed code so handlers can build the
    envelope without ever exposing the token or a literal URL/slug.
    """
    token = (cfg.get("mcp_token") or "").strip()
    url = _build_mcp_url(cfg)
    if not url or not token:
        raise _TypedError(ERR_NOT_CONFIGURED)

    body = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }

    try:
        resp = httpx.post(
            url,
            json=body,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )
    except (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout, httpx.HTTPError) as exc:
        # Never echo the endpoint/headers/token. The code is the contract.
        log.warning("ceodigital MCP unreachable for tool %s: %s", tool_name, type(exc).__name__)
        raise _TypedError(ERR_UNREACHABLE)

    if resp.status_code == 404:
        raise _TypedError(ERR_TENANT_NOT_FOUND)
    if resp.status_code == 401 or resp.status_code == 403:
        raise _TypedError(ERR_NOT_CONFIGURED)
    if resp.status_code >= 400:
        raise _TypedError(ERR_UNREACHABLE)

    try:
        payload = resp.json()
    except ValueError:
        raise _TypedError(ERR_UNREACHABLE)

    return _unwrap_mcp_result(payload)


def _unwrap_mcp_result(payload: Any) -> Any:
    """Tolerate both a raw CEODigital payload and a JSON-RPC envelope.

    The MCP server may answer with either:
      * a plain JSON object carrying the data (``{workitems: [...]}``), or
      * a JSON-RPC result (``{result: {content: [{type: "text", text}]}}``)
        where the tool output text itself is JSON.
    """
    if not isinstance(payload, dict):
        return payload
    if "result" in payload:
        result = payload["result"]
        if isinstance(result, dict):
            content = result.get("content")
            if isinstance(content, list):
                texts = [
                    item.get("text")
                    for item in content
                    if isinstance(item, dict) and item.get("type") == "text"
                    and isinstance(item.get("text"), str) and item.get("text")
                ]
                if texts:
                    joined = "\n".join(texts)
                    try:
                        return json.loads(joined)
                    except ValueError:
                        return {"text": joined}
            return result
    return payload


# ---------------------------------------------------------------------------
# Shared output helpers
# ---------------------------------------------------------------------------


def _normalize_workitem(row: Any) -> Dict[str, Any]:
    """Map a CEODigital work-item row onto the W3 ``WorkItemRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or row.get("workitem_id") or ""),
        "title": row.get("title") or row.get("name") or "",
        "status": row.get("status") or row.get("state") or "",
        "assignee": row.get("assignee"),
        "summary": row.get("summary") or row.get("description"),
        "updated_at": row.get("updated_at") or row.get("updatedAt"),
    }


def _rows_from(payload: Any) -> List[Dict[str, Any]]:
    """Extract a list of item rows from an MCP payload of any tolerated shape."""
    rows: List[Any]
    if isinstance(payload, list):
        rows = payload
    elif isinstance(payload, dict):
        data = payload.get("workitems") or payload.get("items") or payload.get("projects") or payload.get("data")
        rows = data if isinstance(data, list) else []
    else:
        rows = []
    return [_normalize_workitem(r) for r in rows if isinstance(r, dict)]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def _maybe_error(code: str) -> JSONResponse:
    return _as_error(code)


def _normalize_from_payload(payload: Any) -> List[Dict[str, Any]]:
    return _rows_from(payload)


def _rows_from_crm(payload: Any) -> List[Dict[str, Any]]:
    """Extract CRM rows (leads/deals) from an MCP payload of any tolerated shape.

    CRM tools (`crm_leads_list` / `crm_deals_list`) may answer with:
      * ``{"leads": [...]}`` / ``{"deals": [...]}`` (or ``data``/``items``), or
      * a JSON-RPC envelope ``{result: {content: [...]}}`` unwrapped to the
        same shapes. We never validate CRM-specific field shapes here — the
        desktop normalizes. This only guarantees a list of dicts.
    """
    if isinstance(payload, list):
        # Already a list of rows.
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        for key in ("leads", "deals", "items", "data", "rows"):
            rows = payload.get(key)
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
        return []
    return []


def _normalize_crm_row(row: Any) -> Dict[str, Any]:
    """Map a CEODigital CRM row (lead/deal) onto the W4 contract shape.

    Both leads and deals share the minimal fields the desktop renders; extra
    fields are passed through untouched so the UI can grow without a backend
    change.
    """
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    out.setdefault("status", row.get("status") or row.get("state") or "")
    return out


def _normalize_crm_person(row: Any) -> Dict[str, Any]:
    """Map one CRM person row (W1). A display title is synthesized from the
    first/last name when the row has no ``title``/``name`` field, mirroring the
    passthrough contract of :func:`_normalize_crm_row`."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    if not (row.get("title") or row.get("name")):
        names = [p for p in (row.get("first_name") or "", row.get("last_name") or "") if p]
        out.setdefault("title", " ".join(names) or row.get("email") or "")
    else:
        out.setdefault("title", row.get("title") or row.get("name") or "")
    return out


def _normalize_crm_organization(row: Any) -> Dict[str, Any]:
    """Map one CRM organization row (W1). Pass-through plus id/title defaults."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    return out


def _normalize_crm_pipeline(row: Any) -> Dict[str, Any]:
    """Map one CRM pipeline row (W1). Stages array passes through untouched."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    return out


def _normalize_crm_stage(row: Any) -> Dict[str, Any]:
    """Map one CRM pipeline stage row (W1)."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    return out


def _normalize_crm_activity(row: Any) -> Dict[str, Any]:
    """Map one CRM activity row (W1). The screen title derives from the free-text
    ``body`` (falling back to the activity ``kind``) when no title exists."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("body") or row.get("kind") or "")
    return out


def _normalize_crm_category(row: Any) -> Dict[str, Any]:
    """Map one CRM taxonomy category row (W1)."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("label") or row.get("name") or "")
    return out


@router.get("/leads")
def list_leads() -> JSONResponse:
    """List the caller's CEODigital CRM leads (read-only, MCP ``crm_leads_list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm_leads_list", {})
        rows = _rows_from_crm(payload)
        return JSONResponse(content={"ok": True, "leads": [_normalize_crm_row(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: leads list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/deals")
def list_deals() -> JSONResponse:
    """List the caller's CEODigital CRM deals (read-only, MCP ``crm_deals_list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm_deals_list", {})
        rows = _rows_from_crm(payload)
        return JSONResponse(content={"ok": True, "deals": [_normalize_crm_row(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: deals list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/persons")
def list_persons() -> JSONResponse:
    """List the caller's CEODigital CRM persons (read-only, MCP
    ``crm.persons.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.persons.list", {})
        rows = _rows_from_key(payload, "persons")
        return JSONResponse(content={"ok": True, "persons": [_normalize_crm_person(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: persons list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/persons/{person_id}")
def get_person(person_id: str) -> JSONResponse:
    """Return a single CRM person by id (MCP ``crm.persons.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.persons.get", {"id": person_id})
        person = payload.get("person") if isinstance(payload, dict) else None
        if not isinstance(person, dict):
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "person": _normalize_crm_person(person)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital persons get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/organizations")
def list_organizations() -> JSONResponse:
    """List the caller's CEODigital CRM organizations (read-only, MCP
    ``crm.organizations.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.organizations.list", {})
        rows = _rows_from_key(payload, "organizations")
        return JSONResponse(content={"ok": True, "organizations": [_normalize_crm_organization(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: organizations list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/organizations/{organization_id}")
def get_organization(organization_id: str) -> JSONResponse:
    """Return a single CRM organization by id (MCP ``crm.organizations.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.organizations.get", {"id": organization_id})
        org = payload.get("organization") if isinstance(payload, dict) else None
        if not isinstance(org, dict):
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "organization": _normalize_crm_organization(org)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital organizations get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/pipelines")
def list_pipelines(subjectType: Optional[str] = None) -> JSONResponse:
    """List the caller's CEODigital CRM pipelines (read-only, MCP
    ``crm.pipelines.list``). Optional ``subjectType`` (``deal`` | ``lead``)."""
    try:
        args: Dict[str, Any] = {}
        if subjectType:
            args["subjectType"] = subjectType
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.pipelines.list", args)
        rows = _rows_from_key(payload, "pipelines")
        return JSONResponse(content={"ok": True, "pipelines": [_normalize_crm_pipeline(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: pipelines list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/stages")
def list_stages(pipelineId: Optional[str] = None) -> JSONResponse:
    """List CRM stages for a pipeline (read-only, MCP ``crm.stages.list``).
    The MCP tool requires a pipeline; when none is supplied we return an empty
    list rather than fail (the desktop filters by pipeline)."""
    try:
        if not pipelineId:
            return JSONResponse(content={"ok": True, "stages": []})
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.stages.list", {"pipelineId": pipelineId})
        rows = _rows_from_key(payload, "stages")
        return JSONResponse(content={"ok": True, "stages": [_normalize_crm_stage(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: stages list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/activities")
def list_activities(related_type: Optional[str] = None, related_id: Optional[str] = None) -> JSONResponse:
    """List CRM activities (read-only, MCP ``crm.activities.list``).

    The MCP tool scopes activities to a subject (lead|deal|person), so the
    route filters optionally via ``related_type`` + ``related_id``; without a
    full subject we return an empty list rather than fail.
    """
    try:
        if not related_type or not related_id:
            return JSONResponse(content={"ok": True, "activities": []})
        args: Dict[str, Any] = {"subjectType": related_type, "subjectId": related_id}
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.activities.list", args)
        rows = _rows_from_key(payload, "activities")
        return JSONResponse(content={"ok": True, "activities": [_normalize_crm_activity(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: activities list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/categories")
def list_categories(taxonomyKey: Optional[str] = None, activeOnly: Optional[bool] = None) -> JSONResponse:
    """List CRM taxonomy categories (read-only, MCP ``crm.categories.list``).
    Optional ``taxonomyKey`` (e.g. ``lead_source``) and ``activeOnly``."""
    try:
        args: Dict[str, Any] = {}
        if taxonomyKey:
            args["taxonomyKey"] = taxonomyKey
        if activeOnly is not None:
            args["activeOnly"] = bool(activeOnly)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "crm.categories.list", args)
        rows = _rows_from_key(payload, "categories")
        return JSONResponse(content={"ok": True, "categories": [_normalize_crm_category(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: categories list failed")
        return _maybe_error(ERR_UNREACHABLE)


def _rows_from_key(payload: Any, key: str) -> List[Dict[str, Any]]:
    """Extract rows from an MCP payload whose success key is ``key`` (e.g.
    ``agents`` or ``workflows``). Accepts a bare list, a ``{key: [...]}``
    object, or an already-unwrapped structure. Mirrors ``_rows_from_crm``."""
    if isinstance(payload, list):
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        for candidate in (key, "items", "data", "rows", "results"):
            rows = payload.get(candidate)
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
        return []
    return []


@router.get("/agents")
def list_agents() -> JSONResponse:
    """List the tenant's CEO agents catalog (read-only, MCP ``agents.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agents.list", {"is_active": True})
        rows = _rows_from_key(payload, "agents")
        return JSONResponse(content={"ok": True, "agents": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: agents list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/agentflows")
def list_agentflows() -> JSONResponse:
    """List the tenant's NativeFlow workflows (read-only, MCP
    ``agentflow.workflows.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.workflows.list", {})
        rows = _rows_from_key(payload, "workflows")
        return JSONResponse(content={"ok": True, "workflows": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: agentflows list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/workitems")
def list_workitems() -> JSONResponse:
    """List the caller's CEODigital work items (read-only, MCP ``workitems_list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workitems_list", {})
        return JSONResponse(content={"ok": True, "workitems": _normalize_from_payload(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: workitems list failed")
        return _maybe_error(ERR_UNREACHABLE)


# Literal work-items sub-routes (status / suggest) are declared BEFORE the
# parametrized ``/workitems/{workitem_id}`` below so ``/workitems/status`` isn't
# captured as a work-item id.


@router.get("/workitems/status")
def workitems_status(filter: Optional[str] = None) -> JSONResponse:
    """List the caller's work items grouped by a status lens (read-only, MCP
    ``workitems.status``). Optional ``filter`` (``mine`` | ``due_soon`` |
    ``awaiting_approval``)."""
    try:
        args: Dict[str, Any] = {}
        if filter:
            args["filter"] = filter
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workitems.status", args)
        return JSONResponse(content={"ok": True, "workitems": _normalize_from_payload(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: workitems status failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/workitems/suggest")
def suggest_workitems(intent: Optional[str] = None, limit: Optional[int] = None) -> JSONResponse:
    """Suggest matching SOPs/work items for an intent (read-only, MCP
    ``workitems.suggest``)."""
    if not intent or not str(intent).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "intent_required"})

    try:
        args: Dict[str, Any] = {"intent": str(intent)}
        if limit:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workitems.suggest", args)
        suggestions = payload.get("suggestions") if isinstance(payload, dict) else payload
        if not isinstance(suggestions, list):
            suggestions = []
        return JSONResponse(content={"ok": True, "suggestions": suggestions})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: workitems suggest failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workitems")
def create_workitem(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a work item (MCP ``workitems.create``, needsApproval). Body maps
    1:1 to the MCP tool input; ``title`` and ``subject_type`` are required."""
    if not isinstance(payload, dict):
        payload = {}
    title = payload.get("title")
    subject_type = payload.get("subject_type")
    if not title or not str(title).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "title_required"})
    if not subject_type or not str(subject_type).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "subject_type_required"})

    args: Dict[str, Any] = {"title": str(title), "subject_type": str(subject_type)}
    for key in (
        "description", "catalog_code", "subject_id", "due_at", "inputs",
        "resource_kind", "flow_id", "auto_run",
    ):
        if payload.get(key) is not None:
            args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workitems.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workitems create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workitems/{workitem_id}/run")
def run_workitem(workitem_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Run a work item's flow (MCP ``workitems.run``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workitems.run", {"work_item_id": workitem_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workitems run failed: %s", workitem_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workitems/{workitem_id}/assign")
def assign_workitem(workitem_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Assign/unassign users on a work item (MCP ``workitems.assign``,
    needsApproval). Body: ``{add?: string[], remove?: string[], role?: string}``
    with ``role`` defaulting to ``owner``."""
    args: Dict[str, Any] = {"work_item_id": workitem_id, "role": "owner"}
    if isinstance(payload, dict):
        if payload.get("add") is not None:
            args["add"] = payload["add"]
        if payload.get("remove") is not None:
            args["remove"] = payload["remove"]
        if payload.get("role") is not None:
            args["role"] = payload["role"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workitems.assign", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workitems assign failed: %s", workitem_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workitems/{workitem_id}/submit")
def submit_workitem_output(workitem_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Submit a run's output for a work item (MCP ``workitems.submit_output``,
    needsApproval). Body: ``{run_id, output, notes?}``."""
    if not isinstance(payload, dict):
        payload = {}
    run_id = payload.get("run_id")
    output = payload.get("output")
    if not run_id:
        return JSONResponse(status_code=422, content={"ok": False, "error": "run_id_required"})
    if output is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "output_required"})

    args: Dict[str, Any] = {
        "work_item_id": workitem_id,
        "run_id": str(run_id),
        "output": output,
    }
    if payload.get("notes") is not None:
        args["notes"] = payload["notes"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workitems.submit_output", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workitems submit failed: %s", workitem_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workitems/{workitem_id}/checklist")
def toggle_checklist_item(workitem_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Toggle a checklist item's done flag (MCP ``workitems.checklist.toggle``,
    needsApproval). Body: ``{checklist_item_id, done}``."""
    if not isinstance(payload, dict):
        payload = {}
    checklist_item_id = payload.get("checklist_item_id")
    done = payload.get("done")
    if not checklist_item_id:
        return JSONResponse(status_code=422, content={"ok": False, "error": "checklist_item_id_required"})
    if not isinstance(done, bool):
        return JSONResponse(status_code=422, content={"ok": False, "error": "done_required"})

    args: Dict[str, Any] = {
        "work_item_id": workitem_id,
        "checklist_item_id": str(checklist_item_id),
        "done": done,
    }

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workitems.checklist.toggle", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workitems checklist toggle failed: %s", workitem_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/workitems/{workitem_id}")
def get_workitem(workitem_id: str) -> JSONResponse:
    """Return a single work item by id (MCP ``workitems_get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workitems_get", {"id": workitem_id})
        rows = _normalize_from_payload(payload)
        if not rows:
            return _maybe_error("not_found")
        # For detail we keep the row whose id matched, or the first row from
        # a single-item MCP payload.
        item = rows[0] if len(rows) > 1 or rows[0]["id"] == workitem_id else rows[0]
        return JSONResponse(content={"ok": True, "workitem": item})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception as exc:
        log.exception("ceodigital workitems get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W5+ · Agents — run + debrief (MCP agent.runs.* / agent.<slug>.ask)
# ---------------------------------------------------------------------------


@router.post("/agents/{slug}/ask")
def ask_agent(slug: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Run one turn of a CEO agent (MCP ``agent.<slug>.ask``, sync). The prompt
    comes in the JSON body ``{"prompt": "..."}``. Returns the run_debrief shape
    (run_id, status, response_text, pending_approvals)."""
    prompt = payload.get("prompt") if isinstance(payload, dict) else None
    if not prompt or not str(prompt).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "prompt_required"})

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, f"agent.{slug}.ask", {"prompt": str(prompt)})
        return JSONResponse(content={"ok": True, "run": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent ask failed: slug=%s", slug)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/agents/runs")
def list_agent_runs(agentId: Optional[str] = None, status: Optional[str] = None, limit: int = 20) -> JSONResponse:
    """List recent CEO agent runs (MCP ``agent.runs.list``)."""
    try:
        args: Dict[str, Any] = {"limit": limit}
        if agentId:
            args["agentId"] = agentId
        if status:
            args["status"] = status
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agent.runs.list", args)
        rows = _rows_from_key(payload, "runs")
        return JSONResponse(content={"ok": True, "runs": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent.runs list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/agents/runs/{run_id}")
def get_agent_run(run_id: str) -> JSONResponse:
    """Fetch one CEO agent run detail incl. steps (MCP ``agent.runs.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agent.runs.get", {"runId": run_id})
        if isinstance(payload, dict) and payload.get("run"):
            return JSONResponse(content={"ok": True, "run": payload["run"]})
        return _maybe_error("not_found")
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent.runs get failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/agents/schedules")
def list_agent_schedules(agentId: Optional[str] = None, activeOnly: bool = False) -> JSONResponse:
    """List autonomous CEO agent schedules (MCP ``agent.schedules.list``, read-only)."""
    try:
        args: Dict[str, Any] = {"activeOnly": bool(activeOnly)}
        if agentId:
            args["agentId"] = agentId
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agent.schedules.list", args)
        rows = _rows_from_key(payload, "schedules")
        return JSONResponse(content={"ok": True, "schedules": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent.schedules list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/agents/pending")
def list_pending_approvals(runId: Optional[str] = None) -> JSONResponse:
    """List HITL tool calls awaiting decision (MCP ``agent.runs.pending_calls.list``).

    Read-only: approval/denial is intentionally NOT exposed through the MCP —
    it stays in the tenant UI (per ceodigital design), so this just surfaces
    pending work + the tenant approval URL for the desktop user.
    """
    try:
        args: Dict[str, Any] = {}
        if runId:
            args["runId"] = runId
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agent.runs.pending_calls.list", args)
        rows = _rows_from_key(payload, "pending_calls")

        # Approval URL for the tenant UI (path-only, server-side built from the
        # configured app_url + tenant_slug). Never exposes the MCP token.
        app_url = (cfg.get("app_url") or "").strip().rstrip("/")
        slug = (cfg.get("tenant_slug") or "").strip()
        approval_url = ""
        if app_url and slug:
            approval_url = f"{app_url}/t/{slug}/agent/approvals"

        return JSONResponse(content={"ok": True, "pending": rows, "approval_url": approval_url})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent.runs.pending_calls list failed")
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W3 · Services & Proposals (catalog / offerings / categories / lifecycle)
# ---------------------------------------------------------------------------


def _normalize_catalog_item(row: Any) -> Dict[str, Any]:
    """Map one services catalog item row onto the desktop ``CatalogRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    return out


def _normalize_service_offering(row: Any) -> Dict[str, Any]:
    """Map one services offering row onto the desktop ``OfferingRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    return out


def _normalize_service_category(row: Any) -> Dict[str, Any]:
    """Map one services category row onto the desktop ``CategoryRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("label") or row.get("name") or "")
    return out


def _normalize_proposal_item(row: Any) -> Dict[str, Any]:
    """Map one proposal line-item row onto the desktop ``ProposalItem``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("description", row.get("description") or row.get("title") or "")
    if out.get("unit_price") is None and row.get("unitPrice") is not None:
        out["unit_price"] = row["unitPrice"]
    return out


def _normalize_proposal_tranche(row: Any) -> Dict[str, Any]:
    """Map one proposal payment-tranche row onto the desktop ``ProposalTranche``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("label", row.get("label") or row.get("title") or "")
    if out.get("due_date") is None and row.get("dueDate") is not None:
        out["due_date"] = row["dueDate"]
    return out


def _normalize_proposal(row: Any) -> Dict[str, Any]:
    """Map one proposal row onto the desktop ``ProposalRow`` contract.

    ``value``/``currency`` are pinned so the renderer has stable columns, and
    nested line items/tranches are collected under the stable ``items`` and
    ``tranches`` keys whatever the MCP payload names them.
    """
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    out.setdefault("status", row.get("status") or row.get("state") or "")

    value = row.get("value")
    if value is None:
        value = row.get("totalValue") or row.get("total_value") or row.get("total_amount")
    if value is not None:
        out.setdefault("value", value)
    currency = row.get("currency") or row.get("currency_code")
    if currency is not None:
        out.setdefault("currency", currency)

    items = row.get("items") or row.get("proposal_items") or row.get("line_items")
    if isinstance(items, list):
        out["items"] = [_normalize_proposal_item(i) for i in items if isinstance(i, dict)]
    tranches = row.get("tranches") or row.get("payment_tranches")
    if isinstance(tranches, list):
        out["tranches"] = [_normalize_proposal_tranche(t) for t in tranches if isinstance(t, dict)]
    return out


def _rows_from_services(payload: Any, *keys: str) -> List[Dict[str, Any]]:
    """Extract rows from a services MCP payload under any of ``keys`` (e.g.
    ``"catalog"``/``"offerings"``), tolerating the JSON-RPC-unwrapped shapes."""
    if isinstance(payload, list):
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        for candidate in (*keys, "items", "data", "rows", "results"):
            rows = payload.get(candidate)
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
        return []
    return []


def _single_service(payload: Any, *keys: str) -> Optional[Dict[str, Any]]:
    """Pick the single object out of a services detail payload, or ``None``."""
    if isinstance(payload, dict):
        for key in keys:
            value = payload.get(key)
            if isinstance(value, dict):
                return value
        rows = _rows_from_services(payload, *keys)
        if rows:
            return rows[0]
    return None


def _values_from(body: Any) -> Optional[Dict[str, Any]]:
    """Pull the ``values`` dict out of a line-item/tranche mutation body."""
    if not isinstance(body, dict):
        return None
    values = body.get("values")
    return values if isinstance(values, dict) else None


def _proposal_action(proposal_id: str, tool: str) -> JSONResponse:
    """Shared envelope for the id-only proposal lifecycle tools."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, tool, {"id": proposal_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital %s failed: %s", tool, proposal_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/catalog")
def list_catalog(
    active: Optional[bool] = None,
    search: Optional[str] = None,
    produces: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's services catalog items (read-only, MCP
    ``services.catalog.list``)."""
    try:
        args: Dict[str, Any] = {}
        if active is not None:
            args["active"] = bool(active)
        if search:
            args["search"] = str(search)
        if produces:
            args["produces"] = str(produces)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.catalog.list", args)
        rows = _rows_from_services(payload, "catalog")
        return JSONResponse(content={"ok": True, "catalog": [_normalize_catalog_item(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: services catalog list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/catalog/{catalog_id}")
def get_catalog_item(catalog_id: str) -> JSONResponse:
    """Return one services catalog item by id (MCP ``services.catalog.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.catalog.get", {"id": catalog_id})
        item = _single_service(payload, "item", "catalog")
        if item is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "item": _normalize_catalog_item(item)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services catalog get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/offerings")
def list_offerings(
    serviceCatalogId: Optional[str] = None,
    pricingModel: Optional[str] = None,
    isActive: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List service offerings (read-only, MCP ``services.offerings.list``)."""
    try:
        args: Dict[str, Any] = {}
        if serviceCatalogId:
            args["serviceCatalogId"] = serviceCatalogId
        if pricingModel:
            args["pricingModel"] = pricingModel
        if isActive is not None:
            args["isActive"] = bool(isActive)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.offerings.list", args)
        rows = _rows_from_services(payload, "offerings")
        return JSONResponse(content={"ok": True, "offerings": [_normalize_service_offering(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: services offerings list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/offerings/{offering_id}")
def get_service_offering(offering_id: str) -> JSONResponse:
    """Return one service offering by id (MCP ``services.offerings.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.offerings.get", {"id": offering_id})
        offering = _single_service(payload, "offering")
        if offering is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "offering": _normalize_service_offering(offering)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services offerings get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/categories")
def list_service_categories(
    parentId: Optional[str] = None,
    isActive: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List services categories (read-only, MCP ``services.categories.list``)."""
    try:
        args: Dict[str, Any] = {}
        if parentId not in (None, ""):
            args["parentId"] = parentId
        if isActive is not None:
            args["isActive"] = bool(isActive)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.categories.list", args)
        rows = _rows_from_services(payload, "categories")
        return JSONResponse(content={"ok": True, "categories": [_normalize_service_category(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: services categories list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/proposals")
def list_proposals(
    status: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's proposals (read-only, MCP ``services.proposals.list``)."""
    try:
        args: Dict[str, Any] = {}
        if status:
            args["status"] = status
        if search:
            args["search"] = search
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.proposals.list", args)
        rows = _rows_from_services(payload, "proposals")
        return JSONResponse(content={"ok": True, "proposals": [_normalize_proposal(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: services proposals list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/services/proposals/{proposal_id}")
def get_proposal(proposal_id: str) -> JSONResponse:
    """Return one proposal incl. items/tranches (MCP ``services.proposals.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "services.proposals.get", {"id": proposal_id})
        proposal = _single_service(payload, "proposal")
        if proposal is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "proposal": _normalize_proposal(proposal)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals")
def create_proposal(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a proposal (MCP ``services.proposals.create``, needsApproval).
    Body fields map 1:1 to the tool input; ``title`` is required."""
    if not isinstance(payload, dict):
        payload = {}
    title = payload.get("title")
    if not title or not str(title).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "title_required"})

    args: Dict[str, Any] = {"title": str(title)}
    for key in (
        "leadId", "description", "currency", "totalValue", "paymentModel",
        "depositPercentage", "validUntil", "terms",
    ):
        if payload.get(key) is not None:
            args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/send")
def send_proposal(proposal_id: str) -> JSONResponse:
    """Send a proposal (MCP ``services.proposals.send``, needsApproval)."""
    return _proposal_action(proposal_id, "services.proposals.send")


@router.post("/services/proposals/{proposal_id}/accept")
def accept_proposal(proposal_id: str) -> JSONResponse:
    """Accept a proposal (MCP ``services.proposals.accept``, needsApproval)."""
    return _proposal_action(proposal_id, "services.proposals.accept")


@router.post("/services/proposals/{proposal_id}/reject")
def reject_proposal(proposal_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Reject a proposal (MCP ``services.proposals.reject``, needsApproval).
    Body: ``{reason?}``."""
    args: Dict[str, Any] = {"id": proposal_id}
    if isinstance(payload, dict) and payload.get("reason") is not None:
        args["reason"] = payload["reason"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.reject", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals reject failed: %s", proposal_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/cancel")
def cancel_proposal(proposal_id: str) -> JSONResponse:
    """Cancel a proposal (MCP ``services.proposals.cancel``, needsApproval)."""
    return _proposal_action(proposal_id, "services.proposals.cancel")


@router.post("/services/proposals/{proposal_id}/update")
def update_proposal(proposal_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Update proposal fields (MCP ``services.proposals.update``,
    needsApproval). Body: optional ``title``/``description``/``currency``/
    ``terms`` — ``description``/``terms`` may be null to clear them."""
    args: Dict[str, Any] = {"id": proposal_id}
    if isinstance(payload, dict):
        for key in ("title", "description", "currency", "terms"):
            if key in payload:
                args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.update", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals update failed: %s", proposal_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/duplicate")
def duplicate_proposal(proposal_id: str) -> JSONResponse:
    """Duplicate a proposal (MCP ``services.proposals.duplicate``, needsApproval)."""
    return _proposal_action(proposal_id, "services.proposals.duplicate")


@router.post("/services/proposals/{proposal_id}/expire")
def expire_proposal(proposal_id: str) -> JSONResponse:
    """Expire a proposal (MCP ``services.proposals.expire``, needsApproval)."""
    return _proposal_action(proposal_id, "services.proposals.expire")


@router.post("/services/proposals/{proposal_id}/items")
def add_proposal_item(proposal_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Add a line item (MCP ``services.proposals.items.add``, needsApproval).
    Body: ``{values: {serviceCatalogId, unitPrice, ...}}``."""
    values = _values_from(payload)
    if values is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "values_required"})
    if not values.get("serviceCatalogId"):
        return JSONResponse(status_code=422, content={"ok": False, "error": "service_catalog_id_required"})
    if values.get("unitPrice") is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "unit_price_required"})

    args: Dict[str, Any] = {"proposalId": proposal_id, "values": values}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.items.add", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals items add failed: %s", proposal_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/items/{item_id}")
def update_proposal_item(proposal_id: str, item_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Update a line item (MCP ``services.proposals.items.update``,
    needsApproval). Body: ``{values: {...}}``."""
    values = _values_from(payload)
    if values is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "values_required"})

    args: Dict[str, Any] = {"id": item_id, "values": values}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.items.update", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals items update failed: %s", item_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/items/{item_id}/remove")
def remove_proposal_item(proposal_id: str, item_id: str) -> JSONResponse:
    """Remove a line item (MCP ``services.proposals.items.remove``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.items.remove", {"id": item_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals items remove failed: %s", item_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/tranches")
def add_proposal_tranche(proposal_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Add a payment tranche (MCP ``services.proposals.tranches.add``,
    needsApproval). Body: ``{values: {label, amount, ...}}``."""
    values = _values_from(payload)
    if values is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "values_required"})
    if not values.get("label"):
        return JSONResponse(status_code=422, content={"ok": False, "error": "label_required"})
    if values.get("amount") is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "amount_required"})

    args: Dict[str, Any] = {"proposalId": proposal_id, "values": values}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.tranches.add", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals tranches add failed: %s", proposal_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/tranches/{tranche_id}")
def update_proposal_tranche(proposal_id: str, tranche_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Update a payment tranche (MCP ``services.proposals.tranches.update``,
    needsApproval). Body: ``{values: {...}}``."""
    values = _values_from(payload)
    if values is None:
        return JSONResponse(status_code=422, content={"ok": False, "error": "values_required"})

    args: Dict[str, Any] = {"id": tranche_id, "values": values}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.tranches.update", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals tranches update failed: %s", tranche_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/services/proposals/{proposal_id}/tranches/{tranche_id}/remove")
def remove_proposal_tranche(proposal_id: str, tranche_id: str) -> JSONResponse:
    """Remove a payment tranche (MCP ``services.proposals.tranches.remove``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "services.proposals.tranches.remove", {"id": tranche_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital services proposals tranches remove failed: %s", tranche_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W4 · Automation — conversations (conversations.*)
# ---------------------------------------------------------------------------


def _normalize_conversation(row: Any) -> Dict[str, Any]:
    """Map one conversation row onto the desktop `ConversationRow`. Pass-through
    plus stable ``id``/``title`` defaults; extra fields stay untouched."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    out.setdefault("is_archived", row.get("is_archived") or row.get("isArchived") or False)
    return out


# Literal ``/automation/conversations/{id}`` single-segment routes need the
# collection list declared first; there is no literal conflict here, but the
# parametrized ``{id}`` GET must not swallow a future literal sibling.

@router.get("/automation/conversations")
def list_conversations(
    isArchived: Optional[bool] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's automation conversations (read-only, MCP
    ``conversations.list``)."""
    try:
        args: Dict[str, Any] = {}
        if isArchived is not None:
            args["isArchived"] = bool(isArchived)
        if search:
            args["search"] = str(search)[:200]
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "conversations.list", args)
        rows = _rows_from_key(payload, "conversations")
        return JSONResponse(content={"ok": True, "conversations": [_normalize_conversation(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: conversations list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/conversations/{conversation_id}")
def get_conversation(conversation_id: str) -> JSONResponse:
    """Return one conversation by id (MCP ``conversations.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "conversations.get", {"id": conversation_id})
        conv = _single_service(payload, "conversation")
        if conv is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "conversation": _normalize_conversation(conv)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital conversations get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/conversations")
def create_conversation(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a conversation (MCP ``conversations.create``, needsApproval).
    All fields optional; body maps 1:1 to the tool input."""
    if not isinstance(payload, dict):
        payload = {}
    args: Dict[str, Any] = {}
    if payload.get("title") is not None:
        args["title"] = str(payload["title"])[:240]
    if payload.get("systemPrompt") is not None:
        args["systemPrompt"] = str(payload["systemPrompt"])[:4000]
    if payload.get("model") is not None:
        args["model"] = str(payload["model"])[:64]
    if payload.get("tags") is not None:
        args["tags"] = payload["tags"]
    if payload.get("workspaceId") is not None:
        args["workspaceId"] = payload["workspaceId"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "conversations.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital conversations create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/conversations/{conversation_id}/archive")
def archive_conversation(conversation_id: str) -> JSONResponse:
    """Archive a conversation (MCP ``conversations.archive``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "conversations.archive", {"id": conversation_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital conversations archive failed: %s", conversation_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/conversations/{conversation_id}/share")
def share_conversation(conversation_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Share/unshare a conversation (MCP ``conversations.share``,
    needsApproval). Body: ``{enabled: bool}``."""
    enabled = payload.get("enabled") if isinstance(payload, dict) else None
    if not isinstance(enabled, bool):
        return JSONResponse(status_code=422, content={"ok": False, "error": "enabled_required"})

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "conversations.share", {"id": conversation_id, "enabled": enabled})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital conversations share failed: %s", conversation_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W4 · Automation — playbooks (playbooks.* / playbook.runs.*)
# ---------------------------------------------------------------------------


def _normalize_playbook(row: Any) -> Dict[str, Any]:
    """Map one playbook row onto the desktop `PlaybookRow`. Pass-through plus
    stable ``id``/``title`` (falling back to ``name``/``code``)."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or row.get("code") or "")
    out.setdefault("is_active", row.get("is_active") or row.get("isActive") or False)
    return out


def _normalize_playbook_run(row: Any) -> Dict[str, Any]:
    """Map one playbook run row onto the desktop `PlaybookRunRow`."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("status", row.get("status") or row.get("state") or "")
    return out


# The literal ``/automation/playbooks/runs`` MUST be declared before the
# parametrized ``/automation/playbooks/{playbook_id}`` below so ``runs`` isn't
# captured as a playbook id (same three-segment shape, mirroring the workitems
# ``/workitems/status`` precedent).

@router.get("/automation/playbooks/runs")
def list_playbook_runs(
    playbookId: Optional[str] = None,
    status: Optional[str] = None,
    subjectType: Optional[str] = None,
    subjectId: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List playbook runs (read-only, MCP ``playbook.runs.list``)."""
    try:
        args: Dict[str, Any] = {}
        if playbookId:
            args["playbookId"] = playbookId
        if status:
            args["status"] = status
        if subjectType:
            args["subjectType"] = str(subjectType)[:64]
        if subjectId:
            args["subjectId"] = subjectId
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "playbook.runs.list", args)
        rows = _rows_from_key(payload, "runs")
        return JSONResponse(content={"ok": True, "runs": [_normalize_playbook_run(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: playbook runs list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/playbooks")
def list_playbooks(
    subjectType: Optional[str] = None,
    isActive: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's playbooks (read-only, MCP ``playbooks.list``)."""
    try:
        args: Dict[str, Any] = {}
        if subjectType:
            args["subjectType"] = str(subjectType)[:64]
        if isActive is not None:
            args["isActive"] = bool(isActive)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "playbooks.list", args)
        rows = _rows_from_key(payload, "playbooks")
        return JSONResponse(content={"ok": True, "playbooks": [_normalize_playbook(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: playbooks list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/playbooks/{playbook_id}")
def get_playbook(playbook_id: str, code: Optional[str] = None) -> JSONResponse:
    """Return one playbook (MCP ``playbooks.get``). The path ``{id}`` maps to
    ``id``; an optional ``?code=`` query is passed through for a code lookup
    (id-or-code — at least one must be supplied by the caller)."""
    args: Dict[str, Any] = {}
    if playbook_id:
        args["id"] = playbook_id
    if code:
        args["code"] = code
    if not args:
        return JSONResponse(status_code=422, content={"ok": False, "error": "id_or_code_required"})

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "playbooks.get", args)
        pb = _single_service(payload, "playbook")
        if pb is None:
            rows = _rows_from_key(payload, "playbooks")
            pb = rows[0] if rows else None
        if pb is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "playbook": _normalize_playbook(pb)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital playbooks get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/playbooks/{playbook_id}/run")
def run_playbook(playbook_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Run a playbook (MCP ``playbooks.run``, needsApproval). Body:
    ``{subjectType: str, subjectId?: str}`` — ``subjectType`` is required."""
    if not isinstance(payload, dict):
        payload = {}
    subject_type = payload.get("subjectType")
    if not subject_type or not str(subject_type).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "subject_type_required"})

    args: Dict[str, Any] = {"playbookId": playbook_id, "subjectType": str(subject_type)[:64]}
    if payload.get("subjectId") is not None:
        args["subjectId"] = payload["subjectId"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "playbooks.run", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital playbooks run failed: %s", playbook_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W4 · Automation — NativeFlow (agentflow.*)
# ---------------------------------------------------------------------------


def _normalize_workflow_run(row: Any) -> Dict[str, Any]:
    """Map one NativeFlow run row onto the desktop `WorkflowRunRow`."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("status", row.get("status") or row.get("state") or "")
    return out


def _normalize_webhook(row: Any) -> Dict[str, Any]:
    """Map one NativeFlow webhook row onto the desktop `WebhookRow`."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("url", row.get("url") or "")
    out.setdefault("is_active", row.get("is_active") or row.get("isActive") or False)
    return out


def _normalize_schedule(row: Any) -> Dict[str, Any]:
    """Map one NativeFlow schedule row onto the desktop `ScheduleRow`."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("is_active", row.get("is_active") or row.get("isActive") or False)
    return out


@router.get("/automation/workflows")
def list_workflows(
    status: Optional[str] = None,
    triggerType: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's NativeFlow workflows (read-only, MCP
    ``agentflow.workflows.list``)."""
    try:
        args: Dict[str, Any] = {}
        if status:
            args["status"] = status
        if triggerType:
            args["triggerType"] = triggerType
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.workflows.list", args)
        rows = _rows_from_key(payload, "workflows")
        return JSONResponse(content={"ok": True, "workflows": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: workflows list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/workflows/{workflow_id}")
def get_workflow(workflow_id: str) -> JSONResponse:
    """Return one NativeFlow workflow by id (MCP ``agentflow.workflows.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.workflows.get", {"id": workflow_id})
        wf = _single_service(payload, "workflow")
        if wf is None:
            rows = _rows_from_key(payload, "workflows")
            wf = rows[0] if rows else None
        if wf is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "workflow": wf})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workflows get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/workflows/{workflow_id}/publish")
def publish_workflow(workflow_id: str) -> JSONResponse:
    """Publish a NativeFlow workflow (MCP ``agentflow.workflows.publish``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "agentflow.workflows.publish", {"id": workflow_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workflows publish failed: %s", workflow_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/workflows/{workflow_id}/run")
def run_workflow(workflow_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Run a NativeFlow workflow (MCP ``agentflow.run``, needsApproval). The
    ``{workflow_id}`` path maps to ``flowId``; an optional ``input`` record is
    passed through."""
    args: Dict[str, Any] = {"flowId": workflow_id}
    if isinstance(payload, dict) and payload.get("input") is not None:
        args["input"] = payload["input"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "agentflow.run", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow run failed: %s", workflow_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/workflows/{workflow_id}/runs")
def list_workflow_runs(workflow_id: str, limit: Optional[int] = None) -> JSONResponse:
    """List NativeFlow runs for a workflow (read-only, MCP
    ``agentflow.runs.list``)."""
    try:
        args: Dict[str, Any] = {"workflowId": workflow_id}
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.runs.list", args)
        rows = _rows_from_key(payload, "runs")
        return JSONResponse(content={"ok": True, "runs": [_normalize_workflow_run(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow runs list failed: %s", workflow_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/workflows/{workflow_id}/webhooks")
def list_workflow_webhooks(
    workflow_id: str,
    active: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List NativeFlow webhooks for a workflow (read-only, MCP
    ``agentflow.webhooks.list``)."""
    try:
        args: Dict[str, Any] = {"workflowId": workflow_id}
        if active is not None:
            args["active"] = bool(active)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.webhooks.list", args)
        rows = _rows_from_key(payload, "webhooks")
        return JSONResponse(content={"ok": True, "webhooks": [_normalize_webhook(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow webhooks list failed: %s", workflow_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/webhooks/{webhook_id}/rotate")
def rotate_webhook(webhook_id: str) -> JSONResponse:
    """Rotate a NativeFlow webhook secret (MCP ``agentflow.webhooks.rotate``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "agentflow.webhooks.rotate", {"id": webhook_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow webhooks rotate failed: %s", webhook_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/automation/workflows/{workflow_id}/schedules")
def list_workflow_schedules(
    workflow_id: str,
    active: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List NativeFlow schedules for a workflow (read-only, MCP
    ``agentflow.schedules.list``)."""
    try:
        args: Dict[str, Any] = {"workflowId": workflow_id}
        if active is not None:
            args["active"] = bool(active)
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "agentflow.schedules.list", args)
        rows = _rows_from_key(payload, "schedules")
        return JSONResponse(content={"ok": True, "schedules": [_normalize_schedule(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow schedules list failed: %s", workflow_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/automation/schedules/{schedule_id}/pause")
def pause_schedule(schedule_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Pause/resume a NativeFlow schedule (MCP ``agentflow.schedules.pause``,
    needsApproval). Body: ``{paused: bool}``."""
    paused = payload.get("paused") if isinstance(payload, dict) else None
    if not isinstance(paused, bool):
        return JSONResponse(status_code=422, content={"ok": False, "error": "paused_required"})

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "agentflow.schedules.pause", {"id": schedule_id, "paused": paused})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agentflow schedules pause failed: %s", schedule_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W5 · Documents & RAG (documents.* / documents.rag.*)
# ---------------------------------------------------------------------------


def _rows_from_documents(payload: Any, *keys: str) -> List[Dict[str, Any]]:
    """Extract rows from a documents MCP payload under any of ``keys`` (e.g.
    ``"files"``/``"collections"``/``"bindings"``/``"results"``), tolerating the
    JSON-RPC-unwrapped shapes. Mirrors ``_rows_from_services``."""
    if isinstance(payload, list):
        return [r for r in payload if isinstance(r, dict)]
    if isinstance(payload, dict):
        for candidate in (*keys, "items", "data", "rows", "results"):
            rows = payload.get(candidate)
            if isinstance(rows, list):
                return [r for r in rows if isinstance(r, dict)]
        return []
    return []


def _normalize_document_file(row: Any) -> Dict[str, Any]:
    """Map one document file row onto the desktop ``FileRow`` contract.
    Pass-through plus stable ``id``/``title``; the snake_case twins
    ``mime_type``/``collection_id`` are filled from camelCase when present."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or row.get("filename") or "")
    if out.get("mime_type") is None and row.get("mimeType") is not None:
        out["mime_type"] = row["mimeType"]
    if out.get("collection_id") is None and row.get("collectionId") is not None:
        out["collection_id"] = row["collectionId"]
    return out


def _normalize_collection(row: Any) -> Dict[str, Any]:
    """Map one document collection row onto the desktop ``CollectionRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    if out.get("parent_id") is None and row.get("parentId") is not None:
        out["parent_id"] = row["parentId"]
    return out


def _normalize_binding(row: Any) -> Dict[str, Any]:
    """Map one entity document-binding row onto the desktop ``BindingRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    return out


def _normalize_search_result(row: Any) -> Dict[str, Any]:
    """Map one RAG search result row onto the desktop ``SearchResultRow``.
    The id prefers the document reference so the renderer can deep-link."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault(
        "id",
        str(
            row.get("id")
            or row.get("_id")
            or row.get("document_id")
            or row.get("documentId")
            or ""
        ),
    )
    out.setdefault(
        "title",
        row.get("title") or row.get("name") or row.get("filename") or row.get("snippet") or "",
    )
    return out


# The literal ``/documents/files/upload`` POST is declared before the
# parametrized ``/documents/files/{file_id}``-family routes so ``upload`` never
# reads as a file id (same guard as the workitems/playbooks literal sub-routes).


@router.post("/documents/files/upload")
def upload_document_file(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Upload a document file (MCP ``documents.files.upload``, needsApproval).
    Body: ``{name, contentBase64, mimeType?, namespace?, collectionId?}``."""
    if not isinstance(payload, dict):
        payload = {}
    name = payload.get("name")
    content = payload.get("contentBase64")
    if not name or not str(name).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "name_required"})
    if not content or not str(content).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "content_base64_required"})

    args: Dict[str, Any] = {"name": str(name)[:240], "contentBase64": str(content)}
    for key in ("mimeType", "namespace", "collectionId"):
        if payload.get(key) is not None:
            args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.files.upload", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents files upload failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/documents/search")
def search_documents(
    q: Optional[str] = None,
    query: Optional[str] = None,
    namespaces: Optional[str] = None,
    maxResults: Optional[int] = None,
) -> JSONResponse:
    """Semantic search across the tenant's document library (MCP
    ``searchDocuments``). ``?query=`` (alias ``q=``) is required; ``namespaces``
    is a comma-separated list (e.g. ``tenant/docs,tenant/shared``, ≤10 entries);
    ``maxResults`` clamps to 1..20."""
    text = (query or q or "").strip()
    if not text:
        return JSONResponse(status_code=422, content={"ok": False, "error": "query_required"})

    args: Dict[str, Any] = {"query": text[:1000]}
    ns: List[str] = []
    for part in (namespaces or "").split(","):
        part = part.strip()
        if part and part not in ns:
            ns.append(part)
    if ns:
        args["namespaces"] = ns[:10]
    if maxResults is not None:
        args["maxResults"] = max(1, min(20, int(maxResults)))

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "searchDocuments", args)
        rows = _rows_from_documents(payload, "results", "documents", "hits")
        return JSONResponse(content={"ok": True, "results": [_normalize_search_result(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents search failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/documents/files")
def list_document_files(
    search: Optional[str] = None,
    collectionId: Optional[str] = None,
    namespace: Optional[str] = None,
    visibility: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's document files (read-only, MCP ``documents.files.list``)."""
    try:
        args: Dict[str, Any] = {}
        if search:
            args["search"] = str(search)[:200]
        if collectionId:
            args["collectionId"] = collectionId
        if namespace:
            args["namespace"] = str(namespace)[:120]
        if visibility:
            args["visibility"] = visibility
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "documents.files.list", args)
        rows = _rows_from_documents(payload, "files", "documents")
        return JSONResponse(content={"ok": True, "files": [_normalize_document_file(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: documents files list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/documents/files/{file_id}")
def get_document_file(file_id: str) -> JSONResponse:
    """Return one document file by id (MCP ``documents.files.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "documents.files.get", {"id": file_id})
        f = _single_service(payload, "file")
        if f is None:
            rows = _rows_from_documents(payload, "files")
            f = rows[0] if rows else None
        if f is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "file": _normalize_document_file(f)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents files get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/files/{file_id}/delete")
def delete_document_file(file_id: str) -> JSONResponse:
    """Delete a document file (MCP ``documents.files.delete``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.files.delete", {"id": file_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents files delete failed: %s", file_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/files/{file_id}/move")
def move_document_file(file_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Move a document file between namespaces/collections (MCP
    ``documents.files.move``, needsApproval). Body:
    ``{targetNamespace?, targetCollectionId?}`` — a null ``targetCollectionId``
    moves the file out of any collection."""
    args: Dict[str, Any] = {"fileId": file_id}
    if isinstance(payload, dict):
        if payload.get("targetNamespace") is not None:
            args["targetNamespace"] = str(payload["targetNamespace"])[:120]
        if "targetCollectionId" in payload:
            args["targetCollectionId"] = payload["targetCollectionId"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.files.move", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents files move failed: %s", file_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/documents/collections")
def list_document_collections() -> JSONResponse:
    """List the tenant's document collections (read-only, MCP
    ``documents.collections.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "documents.collections.list", {})
        rows = _rows_from_documents(payload, "collections")
        return JSONResponse(content={"ok": True, "collections": [_normalize_collection(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: documents collections list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/collections")
def create_document_collection(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a document collection (MCP ``documents.collections.create``,
    needsApproval). Body: ``{name, description?, color?, icon?, parentId?}``."""
    if not isinstance(payload, dict):
        payload = {}
    name = payload.get("name")
    if not name or not str(name).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "name_required"})

    args: Dict[str, Any] = {"name": str(name)[:120]}
    for key in ("description", "color", "icon", "parentId"):
        if payload.get(key) is not None:
            args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.collections.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents collections create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/collections/{collection_id}/add_file")
def add_file_to_collection(collection_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Add a file to a collection (MCP ``documents.collections.add_file``,
    needsApproval). Body: ``{fileId}``."""
    file_id = payload.get("fileId") if isinstance(payload, dict) else None
    if not file_id or not str(file_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "file_id_required"})

    try:
        cfg = _load_config()
        result = _mcp_fetch(
            cfg, "documents.collections.add_file", {"collectionId": collection_id, "fileId": str(file_id)}
        )
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents collections add_file failed: %s", collection_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/collections/{collection_id}/remove_file")
def remove_file_from_collection(collection_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Remove a file from a collection (MCP ``documents.collections.remove_file``,
    needsApproval). Body: ``{fileId}``."""
    file_id = payload.get("fileId") if isinstance(payload, dict) else None
    if not file_id or not str(file_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "file_id_required"})

    try:
        cfg = _load_config()
        result = _mcp_fetch(
            cfg, "documents.collections.remove_file", {"collectionId": collection_id, "fileId": str(file_id)}
        )
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents collections remove_file failed: %s", collection_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/documents/bindings")
def list_document_bindings(
    entityType: Optional[str] = None,
    entityId: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List document bindings for an entity (read-only, MCP
    ``documents.bindings.list``). ``entityType`` + ``entityId`` are required."""
    if not entityType or not str(entityType).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "entity_type_required"})
    if not entityId or not str(entityId).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "entity_id_required"})

    args: Dict[str, Any] = {"entityType": str(entityType), "entityId": str(entityId)}
    if direction:
        args["direction"] = direction
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "documents.bindings.list", args)
        rows = _rows_from_documents(payload, "bindings")
        return JSONResponse(content={"ok": True, "bindings": [_normalize_binding(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: documents bindings list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/bindings")
def attach_document_binding(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Attach a document binding to an entity (MCP ``documents.bindings.attach``,
    needsApproval). Body maps 1:1 to the tool input; ``entityType``/``entityId``/
    ``direction``/``bindingId`` are required."""
    if not isinstance(payload, dict):
        payload = {}
    for key in ("entityType", "entityId", "direction", "bindingId"):
        if not payload.get(key) or not str(payload.get(key) or "").strip():
            return JSONResponse(status_code=422, content={"ok": False, "error": f"{key}_required"})

    args: Dict[str, Any] = {
        "entityType": str(payload["entityType"]),
        "entityId": str(payload["entityId"]),
        "direction": str(payload["direction"]),
        "bindingId": str(payload["bindingId"]),
    }
    for key in ("targetRef", "syncMode", "publishMode", "ragIndex", "outputFormat", "nameTemplate"):
        if payload.get(key) is not None:
            args[key] = payload[key]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.bindings.attach", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents bindings attach failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/bindings/{binding_row_id}/detach")
def detach_document_binding(binding_row_id: str) -> JSONResponse:
    """Detach a document binding by its row id (MCP ``documents.bindings.detach``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.bindings.detach", {"bindingRowId": binding_row_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents bindings detach failed: %s", binding_row_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/documents/reindex")
def reindex_documents(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Trigger a RAG reindex of a document namespace (MCP
    ``documents.rag.reindex``, needsApproval). Body: ``{namespace, fullReindex?}``."""
    if not isinstance(payload, dict):
        payload = {}
    namespace = payload.get("namespace")
    if not namespace or not str(namespace).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "namespace_required"})

    args: Dict[str, Any] = {"namespace": str(namespace)[:120]}
    if payload.get("fullReindex") is not None:
        args["fullReindex"] = bool(payload["fullReindex"])

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "documents.rag.reindex", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital documents rag reindex failed")
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6a · Messaging (messaging.*) — threads / messages / reactions / attachments
# ---------------------------------------------------------------------------


def _normalize_thread(row: Any) -> Dict[str, Any]:
    """Map one messaging thread row onto the desktop ``ThreadRow``. Pass-through
    plus stable ``id``/``title`` (subject fallback); extra fields stay."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("subject") or row.get("title") or row.get("name") or "")
    return out


def _normalize_message(row: Any) -> Dict[str, Any]:
    """Map one messaging message row onto the desktop ``MessageRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    return out


def _rows_from_threads(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_thread(r) for r in _rows_from_key(payload, "threads")]


def _rows_from_messages(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_message(r) for r in _rows_from_key(payload, "messages")]


@router.get("/messaging/threads")
def list_threads(
    threadType: Optional[str] = None,
    refTable: Optional[str] = None,
    refId: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List messaging threads (read-only, MCP ``messaging.threads.list``). When
    ``refId`` is supplied, delegates to ``messaging.threads.list_by_ref`` (which
    requires ``refTable``)."""
    if refId:
        if not refTable or not str(refTable).strip():
            return JSONResponse(status_code=422, content={"ok": False, "error": "ref_table_required"})
        args: Dict[str, Any] = {"refTable": str(refTable)[:64], "refId": str(refId)}
        tool = "messaging.threads.list_by_ref"
    else:
        tool = "messaging.threads.list"
        args = {}
        if threadType:
            args["threadType"] = threadType
        if refTable:
            args["refTable"] = str(refTable)[:64]
        if limit is not None:
            args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, tool, args)
        return JSONResponse(content={"ok": True, "threads": _rows_from_threads(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: messaging threads list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/messaging/threads/{thread_id}")
def get_thread(thread_id: str, messageLimit: Optional[int] = None) -> JSONResponse:
    """Return one messaging thread incl. its recent messages (read-only, MCP
    ``messaging.threads.get``)."""
    args: Dict[str, Any] = {"id": thread_id}
    if messageLimit is not None:
        args["messageLimit"] = int(messageLimit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "messaging.threads.get", args)
        thread = _single_service(payload, "thread")
        if thread is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "thread": _normalize_thread(thread)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging threads get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/messaging/threads/{thread_id}/messages")
def list_thread_messages(thread_id: str, limit: Optional[int] = None) -> JSONResponse:
    """List messages in a thread (read-only, MCP ``messaging.messages.list``)."""
    args: Dict[str, Any] = {"threadId": thread_id}
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "messaging.messages.list", args)
        return JSONResponse(content={"ok": True, "messages": _rows_from_messages(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging messages list failed: %s", thread_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/messaging/threads")
def create_thread(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a messaging thread (MCP ``messaging.threads.create``, needsApproval).
    Body: ``{refTable?, refId?, threadType?, subject?}``."""
    if not isinstance(payload, dict):
        payload = {}
    args: Dict[str, Any] = {}
    if payload.get("refTable") is not None:
        args["refTable"] = str(payload["refTable"])[:64]
    if payload.get("refId") is not None:
        args["refId"] = payload["refId"]
    if payload.get("threadType") is not None:
        args["threadType"] = payload["threadType"]
    if payload.get("subject") is not None:
        args["subject"] = str(payload["subject"])[:240]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "messaging.threads.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging threads create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/messaging/threads/{thread_id}/messages")
def post_message(thread_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Post a message to a thread (MCP ``messaging.messages.post``, needsApproval).
    Body: ``{body}`` (required, ≤20000)."""
    body = payload.get("body") if isinstance(payload, dict) else None
    if not body or not str(body).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "body_required"})

    args: Dict[str, Any] = {"threadId": thread_id, "body": str(body)[:20000]}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "messaging.messages.post", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging messages post failed: %s", thread_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/messaging/messages/{message_id}/react")
def react_to_message(message_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """React to a message (MCP ``messaging.messages.react``, needsApproval).
    Body: ``{emoji}`` (required, ≤16)."""
    emoji = payload.get("emoji") if isinstance(payload, dict) else None
    if not emoji or not str(emoji).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "emoji_required"})

    args: Dict[str, Any] = {"messageId": message_id, "emoji": str(emoji)[:16]}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "messaging.messages.react", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging messages react failed: %s", message_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/messaging/messages/{message_id}/read")
def mark_message_read(message_id: str) -> JSONResponse:
    """Mark a message read (MCP ``messaging.messages.read``)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "messaging.messages.read", {"messageId": message_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging messages read failed: %s", message_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/messaging/messages/{message_id}/attachments")
def upload_attachment(message_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Attach a file to a message (MCP ``messaging.attachments.upload``,
    needsApproval). Body: ``{fileId, name?}``."""
    file_id = payload.get("fileId") if isinstance(payload, dict) else None
    if not file_id or not str(file_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "file_id_required"})

    args: Dict[str, Any] = {"messageId": message_id, "fileId": str(file_id)}
    if isinstance(payload, dict) and payload.get("name") is not None:
        args["name"] = str(payload["name"])[:240]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "messaging.attachments.upload", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital messaging attachments upload failed: %s", message_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6a · Notifications (notifications.*)
# ---------------------------------------------------------------------------


def _normalize_notification(row: Any) -> Dict[str, Any]:
    """Map one notification row onto the desktop ``NotificationRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("message") or row.get("type") or "")
    return out


# The literal ``/notifications/unread-count`` must be declared before any
# parametrized ``/notifications/{id}/...`` route; none exists on GET here, but
# keeping the literal first mirrors the workitems/playbooks guard convention.

@router.get("/notifications/unread-count")
def get_unread_count() -> JSONResponse:
    """Return the caller's unread notification count (MCP ``notifications.unread_count``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "notifications.unread_count", {})
        count = payload.get("unread_count") if isinstance(payload, dict) else payload
        if isinstance(count, (int, float)):
            count = int(count)
        else:
            count = 0
        return JSONResponse(content={"ok": True, "unread_count": count})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital notifications unread_count failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/notifications")
def list_notifications(
    unreadOnly: Optional[bool] = None,
    cursor: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the caller's notifications (read-only, MCP ``notifications.list``)."""
    args: Dict[str, Any] = {}
    if unreadOnly is not None:
        args["unreadOnly"] = bool(unreadOnly)
    if cursor:
        args["cursor"] = str(cursor)
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "notifications.list", args)
        rows = _rows_from_key(payload, "notifications")
        return JSONResponse(content={"ok": True, "notifications": [_normalize_notification(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: notifications list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/notifications/read-all")
def mark_all_notifications_read() -> JSONResponse:
    """Mark all notifications read (MCP ``notifications.mark_all_read``)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "notifications.mark_all_read", {})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital notifications mark_all_read failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str) -> JSONResponse:
    """Mark one notification read (MCP ``notifications.mark_read``)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "notifications.mark_read", {"id": notification_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital notifications mark_read failed: %s", notification_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6a · Timeline (timeline.*) — events, pins, reactions
# ---------------------------------------------------------------------------


def _normalize_event(row: Any) -> Dict[str, Any]:
    """Map one timeline event row onto the desktop ``TimelineEventRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault(
        "title",
        row.get("title") or row.get("summary") or row.get("event_type") or row.get("eventType") or "",
    )
    return out


def _rows_from_events(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_event(r) for r in _rows_from_key(payload, "events")]


@router.get("/timeline/events")
def list_timeline_events(
    entityType: Optional[str] = None,
    entityId: Optional[str] = None,
    actorUserId: Optional[str] = None,
    eventGlob: Optional[str] = None,
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    cursor: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List timeline events (read-only, MCP ``timeline.events.list``). Optional
    filters: entity, actor, event glob, from/to window, cursor + limit."""
    args: Dict[str, Any] = {}
    if entityType:
        args["entityType"] = entityType
    if entityId:
        args["entityId"] = entityId
    if actorUserId:
        args["actorUserId"] = actorUserId
    if eventGlob:
        args["eventGlob"] = eventGlob
    if from_:
        args["from"] = from_
    if to:
        args["to"] = to
    if cursor:
        args["cursor"] = cursor
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "timeline.events.list", args)
        return JSONResponse(content={"ok": True, "events": _rows_from_events(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: timeline events list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/timeline/events/{event_id}")
def get_timeline_event(event_id: str) -> JSONResponse:
    """Return one timeline event by id (MCP ``timeline.events.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "timeline.events.get", {"id": event_id})
        event = _single_service(payload, "event")
        if event is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "event": _normalize_event(event)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital timeline events get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


def _timeline_event_action(event_id: str, tool: str) -> JSONResponse:
    """Shared envelope for the id-only timeline event tools (pins)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, tool, {"event_id": event_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital %s failed: %s", tool, event_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/timeline/events/{event_id}/pin")
def pin_timeline_event(event_id: str) -> JSONResponse:
    """Pin a timeline event (MCP ``timeline.pins.add``)."""
    return _timeline_event_action(event_id, "timeline.pins.add")


@router.post("/timeline/events/{event_id}/unpin")
def unpin_timeline_event(event_id: str) -> JSONResponse:
    """Unpin a timeline event (MCP ``timeline.pins.remove``)."""
    return _timeline_event_action(event_id, "timeline.pins.remove")


@router.post("/timeline/events/{event_id}/reactions")
def add_event_reaction(event_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """React to a timeline event (MCP ``timeline.reactions.add``).
    Body: ``{reaction_type}`` (required)."""
    reaction_type = payload.get("reaction_type") if isinstance(payload, dict) else None
    if not reaction_type or not str(reaction_type).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "reaction_type_required"})

    args: Dict[str, Any] = {"event_id": event_id, "reaction_type": str(reaction_type)}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "timeline.reactions.add", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital timeline reactions add failed: %s", event_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/timeline/events/{event_id}/reactions/remove")
def remove_event_reaction(event_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Remove a reaction from a timeline event (MCP ``timeline.reactions.remove``).
    Body: ``{reaction_type}`` (required)."""
    reaction_type = payload.get("reaction_type") if isinstance(payload, dict) else None
    if not reaction_type or not str(reaction_type).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "reaction_type_required"})

    args: Dict[str, Any] = {"event_id": event_id, "reaction_type": str(reaction_type)}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "timeline.reactions.remove", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital timeline reactions remove failed: %s", event_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6a · Implementations (implementations.*) — projects, phases, files, messages
# ---------------------------------------------------------------------------


def _normalize_impl_project(row: Any) -> Dict[str, Any]:
    """Map one implementation project row onto the desktop ``ImplProjectRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    out.setdefault("status", row.get("status") or row.get("state") or "")
    return out


def _normalize_impl_phase(row: Any) -> Dict[str, Any]:
    """Map one implementation phase row onto the desktop ``ImplPhaseRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("title") or row.get("name") or "")
    out.setdefault("status", row.get("status") or row.get("state") or "")
    return out


def _normalize_impl_file(row: Any) -> Dict[str, Any]:
    """Map one implementation file row onto the desktop ``ImplFileRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or row.get("filename") or "")
    return out


def _rows_from_projects(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_impl_project(r) for r in _rows_from_key(payload, "projects")]


def _rows_from_phases(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_impl_phase(r) for r in _rows_from_key(payload, "phases")]


def _rows_from_impl_files(payload: Any) -> List[Dict[str, Any]]:
    return [_normalize_impl_file(r) for r in _rows_from_key(payload, "files")]


@router.get("/implementations/projects")
def list_implementation_projects(
    status: Optional[str] = None,
    search: Optional[str] = None,
    clientVisible: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List implementation projects (read-only, MCP ``implementations.projects.list``)."""
    args: Dict[str, Any] = {}
    if status:
        args["status"] = status
    if search:
        args["search"] = str(search)[:200]
    if clientVisible is not None:
        args["clientVisible"] = bool(clientVisible)
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "implementations.projects.list", args)
        return JSONResponse(content={"ok": True, "projects": _rows_from_projects(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: implementations projects list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/implementations/projects/{project_id}")
def get_implementation_project(project_id: str) -> JSONResponse:
    """Return one implementation project by id (MCP ``implementations.projects.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "implementations.projects.get", {"id": project_id})
        project = _single_service(payload, "project")
        if project is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "project": _normalize_impl_project(project)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations projects get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/implementations/projects/{project_id}/phases")
def list_implementation_phases(
    project_id: str,
    status: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List phases of an implementation project (read-only, MCP
    ``implementations.phases.list``)."""
    args: Dict[str, Any] = {"projectId": project_id}
    if status:
        args["status"] = status
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "implementations.phases.list", args)
        return JSONResponse(content={"ok": True, "phases": _rows_from_phases(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations phases list failed: %s", project_id)
        return _maybe_error(ERR_UNREACHABLE)


def _implementation_status_action(
    id_value: str, tool: str, body: Dict[str, Any], arg_key: str
) -> JSONResponse:
    """Shared envelope for the implementation status mutations (project/phase)."""
    status = body.get("status") if isinstance(body, dict) else None
    if not status or not str(status).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "status_required"})

    args: Dict[str, Any] = {arg_key: id_value, "status": str(status)}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, tool, args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital %s failed: %s", tool, id_value)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/implementations/projects/{project_id}/status")
def change_implementation_project_status(project_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Change an implementation project's status (MCP
    ``implementations.projects.change_status``, needsApproval). Body: ``{status}``."""
    return _implementation_status_action(project_id, "implementations.projects.change_status", payload, "id")


@router.post("/implementations/phases/{phase_id}/status")
def change_implementation_phase_status(phase_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Change an implementation phase's status (MCP
    ``implementations.phases.change_status``, needsApproval). Body: ``{status}``."""
    return _implementation_status_action(phase_id, "implementations.phases.change_status", payload, "id")


@router.post("/implementations/projects/{project_id}/complete")
def complete_implementation_project(project_id: str) -> JSONResponse:
    """Mark an implementation project complete (MCP ``implementations.projects.complete``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "implementations.projects.complete", {"id": project_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations projects complete failed: %s", project_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/implementations/projects/{project_id}/cancel")
def cancel_implementation_project(project_id: str) -> JSONResponse:
    """Cancel an implementation project (MCP ``implementations.projects.cancel``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "implementations.projects.cancel", {"id": project_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations projects cancel failed: %s", project_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/implementations/projects/{project_id}/files")
def list_implementation_files(project_id: str, limit: Optional[int] = None) -> JSONResponse:
    """List files attached to an implementation project (read-only, MCP
    ``implementations.files.list``)."""
    args: Dict[str, Any] = {"projectId": project_id}
    if limit is not None:
        args["limit"] = int(limit)

    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "implementations.files.list", args)
        return JSONResponse(content={"ok": True, "files": _rows_from_impl_files(payload)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations files list failed: %s", project_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/implementations/projects/{project_id}/messages")
def post_implementation_message(project_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Post a message on an implementation project (MCP ``implementations.messages.post``,
    needsApproval). Body: ``{body}`` (required)."""
    body = payload.get("body") if isinstance(payload, dict) else None
    if not body or not str(body).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "body_required"})

    args: Dict[str, Any] = {"projectId": project_id, "body": str(body)}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "implementations.messages.post", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital implementations messages post failed: %s", project_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6b · Organization & stakeholders — workspaces (workspaces.*)
# ---------------------------------------------------------------------------


def _normalize_workspace(row: Any) -> Dict[str, Any]:
    """Map one workspace row onto the desktop ``WorkspaceRow``. Pass-through
    plus stable ``id``/``title`` defaults; extra fields stay untouched."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    return out


def _normalize_workspace_member(row: Any) -> Dict[str, Any]:
    """Map one workspace member row onto a member-row contract."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or row.get("member_id") or ""))
    out.setdefault("role", row.get("role") or "")
    return out


# Literal ``/workspaces/invite`` is not part of this surface; the collection
# list is declared before the parametrized detail routes so ``/workspaces``
# never resolves to a workspace id.

@router.get("/workspaces")
def list_workspaces(
    archived: Optional[bool] = None,
    categoryId: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's workspaces (read-only, MCP ``workspaces.list``)."""
    try:
        args: Dict[str, Any] = {}
        if archived is not None:
            args["archived"] = bool(archived)
        if categoryId:
            args["categoryId"] = categoryId
        if search:
            args["search"] = str(search)[:200]
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workspaces.list", args)
        rows = _rows_from_key(payload, "workspaces")
        return JSONResponse(content={"ok": True, "workspaces": [_normalize_workspace(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: workspaces list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/workspaces/{workspace_id}")
def get_workspace(workspace_id: str) -> JSONResponse:
    """Return one workspace by id (MCP ``workspaces.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workspaces.get", {"id": workspace_id})
        ws = _single_service(payload, "workspace")
        if ws is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "workspace": _normalize_workspace(ws)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workspaces get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/workspaces/{workspace_id}/members")
def list_workspace_members(workspace_id: str) -> JSONResponse:
    """List members of a workspace (read-only, MCP ``workspaces.members.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "workspaces.members.list", {"workspaceId": workspace_id})
        rows = _rows_from_key(payload, "members")
        return JSONResponse(content={"ok": True, "members": [_normalize_workspace_member(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workspaces members list failed: %s", workspace_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workspaces")
def create_workspace(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a workspace (MCP ``workspaces.create``, needsApproval). Body:
    ``{name, description?, categoryId?, icon?, color?}`` — ``name`` (≤120) is
    required."""
    if not isinstance(payload, dict):
        payload = {}
    name = payload.get("name")
    if not name or not str(name).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "name_required"})

    args: Dict[str, Any] = {"name": str(name)[:120]}
    if payload.get("description") is not None:
        args["description"] = str(payload["description"])[:1000]
    if payload.get("categoryId") is not None:
        args["categoryId"] = payload["categoryId"]
    if payload.get("icon") is not None:
        args["icon"] = str(payload["icon"])[:60]
    if payload.get("color") is not None:
        args["color"] = str(payload["color"])[:7]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workspaces.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workspaces create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workspaces/{workspace_id}/members")
def add_workspace_member(workspace_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Add a member to a workspace (MCP ``workspaces.members.add``,
    needsApproval). Body: ``{userId, role?}`` (``lead|member|viewer``)."""
    if not isinstance(payload, dict):
        payload = {}
    user_id = payload.get("userId")
    if not user_id or not str(user_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "user_id_required"})

    args: Dict[str, Any] = {"workspaceId": workspace_id, "userId": str(user_id)}
    if payload.get("role") is not None:
        args["role"] = payload["role"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "workspaces.members.add", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workspaces members add failed: %s", workspace_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/workspaces/{workspace_id}/members/{member_id}/remove")
def remove_workspace_member(workspace_id: str, member_id: str) -> JSONResponse:
    """Remove a member from a workspace (MCP ``workspaces.members.remove``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(
            cfg, "workspaces.members.remove", {"workspaceId": workspace_id, "memberId": member_id}
        )
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital workspaces members remove failed: %s", workspace_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6b · Departments (departments.*)
# ---------------------------------------------------------------------------


def _normalize_department(row: Any) -> Dict[str, Any]:
    """Map one department row onto the desktop ``DepartmentRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("title", row.get("name") or row.get("title") or "")
    out.setdefault("slug_key", row.get("slugKey") or row.get("slug_key") or "")
    return out


def _normalize_department_member(row: Any) -> Dict[str, Any]:
    """Map one department member row onto a member-row contract."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or row.get("member_id") or ""))
    out.setdefault("role", row.get("role") or "")
    return out


@router.get("/departments")
def list_departments(
    activeOnly: Optional[bool] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's departments (read-only, MCP ``departments.list``)."""
    try:
        args: Dict[str, Any] = {}
        if activeOnly is not None:
            args["activeOnly"] = bool(activeOnly)
        if search:
            args["search"] = str(search)[:200]
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "departments.list", args)
        rows = _rows_from_key(payload, "departments")
        return JSONResponse(content={"ok": True, "departments": [_normalize_department(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: departments list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/departments/{department_id}")
def get_department(department_id: str) -> JSONResponse:
    """Return one department by id (MCP ``departments.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "departments.get", {"id": department_id})
        dep = _single_service(payload, "department")
        if dep is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "department": _normalize_department(dep)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital departments get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/departments/{department_id}/members")
def list_department_members(department_id: str) -> JSONResponse:
    """List members of a department (read-only, MCP ``departments.members.list``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "departments.members.list", {"departmentId": department_id})
        rows = _rows_from_key(payload, "members")
        return JSONResponse(content={"ok": True, "members": [_normalize_department_member(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital departments members list failed: %s", department_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/departments")
def create_department(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a department (MCP ``departments.create``, needsApproval). Body:
    ``{name, slugKey, areas?, headId?}`` — ``name`` (≤120) and ``slugKey``
    (≤60) are required."""
    if not isinstance(payload, dict):
        payload = {}
    name = payload.get("name")
    slug_key = payload.get("slugKey")
    if not name or not str(name).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "name_required"})
    if not slug_key or not str(slug_key).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "slug_key_required"})

    args: Dict[str, Any] = {"name": str(name)[:120], "slugKey": str(slug_key)[:60]}
    if payload.get("areas") is not None:
        areas = payload["areas"]
        args["areas"] = areas if isinstance(areas, list) else []
    if payload.get("headId") is not None:
        args["headId"] = payload["headId"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "departments.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital departments create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/departments/{department_id}/members")
def add_department_member(department_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Add a member to a department (MCP ``departments.members.add``,
    needsApproval). Body: ``{userId, role?}`` (``head|member``)."""
    if not isinstance(payload, dict):
        payload = {}
    user_id = payload.get("userId")
    if not user_id or not str(user_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "user_id_required"})

    args: Dict[str, Any] = {"departmentId": department_id, "userId": str(user_id)}
    if payload.get("role") is not None:
        args["role"] = payload["role"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "departments.members.add", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital departments members add failed: %s", department_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/departments/{department_id}/members/{user_id}/remove")
def remove_department_member(department_id: str, user_id: str) -> JSONResponse:
    """Remove a member from a department (MCP ``departments.members.remove``,
    needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(
            cfg, "departments.members.remove", {"departmentId": department_id, "userId": user_id}
        )
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital departments members remove failed: %s", department_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6b · Members (members.*) — tenant members
# ---------------------------------------------------------------------------

# The literal ``/members/invite`` POST MUST be declared before the parametrized
# ``/members/{user_id}`` detail so ``invite`` is never captured as a user_id.

@router.post("/members/invite")
def invite_member(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Invite a tenant member (MCP ``members.invite``, needsApproval). Body:
    ``{email, role?}`` — ``email`` is required; ``role`` defaults to
    ``member``."""
    if not isinstance(payload, dict):
        payload = {}
    email = payload.get("email")
    if not email or not str(email).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "email_required"})

    args: Dict[str, Any] = {"email": str(email).strip()}
    if payload.get("role") is not None:
        args["role"] = str(payload["role"])[:64]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "members.invite", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital members invite failed")
        return _maybe_error(ERR_UNREACHABLE)


def _normalize_member(row: Any) -> Dict[str, Any]:
    """Map one tenant member row onto the desktop ``MemberRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or row.get("user_id") or ""))
    out.setdefault("title", row.get("name") or row.get("full_name") or row.get("email") or "")
    out.setdefault("role", row.get("role") or "")
    return out


@router.get("/members")
def list_members(
    role: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's members (read-only, MCP ``members.list``)."""
    try:
        args: Dict[str, Any] = {}
        if role:
            args["role"] = str(role)[:64]
        if limit is not None:
            args["limit"] = int(limit)
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "members.list", args)
        rows = _rows_from_key(payload, "members")
        return JSONResponse(content={"ok": True, "members": [_normalize_member(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: members list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/members/{user_id}")
def get_member(user_id: str) -> JSONResponse:
    """Return one tenant member by user id (MCP ``members.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "members.get", {"userId": user_id})
        member = _single_service(payload, "member")
        if member is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "member": _normalize_member(member)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital members get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/members/{user_id}/revoke")
def revoke_member(user_id: str) -> JSONResponse:
    """Revoke a tenant member (MCP ``members.revoke``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "members.revoke", {"userId": user_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital members revoke failed: %s", user_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/members/{user_id}/role")
def update_member_role(user_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Update a tenant member's role (MCP ``members.update_role``,
    needsApproval). Body: ``{role}`` — required (≤64)."""
    if not isinstance(payload, dict):
        payload = {}
    role = payload.get("role")
    if not role or not str(role).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "role_required"})

    args: Dict[str, Any] = {"userId": user_id, "role": str(role)[:64]}
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "members.update_role", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital members update_role failed: %s", user_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# W6b · Integrations (integrations.*)
# ---------------------------------------------------------------------------


def _normalize_integration(row: Any) -> Dict[str, Any]:
    """Map one integration row onto the desktop ``IntegrationRow``."""
    if not isinstance(row, dict):
        row = {}
    out: Dict[str, Any] = dict(row)
    out.setdefault("id", str(row.get("id") or row.get("_id") or ""))
    out.setdefault("provider_code", row.get("providerCode") or row.get("provider_code") or "")
    out.setdefault("app_slug", row.get("appSlug") or row.get("app_slug") or "")
    out.setdefault("status", row.get("status") or "")
    out.setdefault("scope", row.get("scope") or "")
    return out


# The collection list is declared before the parametrized detail routes to keep
# the literal ``/integrations`` collection from resolving to an integration id.

@router.get("/integrations")
def list_integrations(
    providerCode: Optional[str] = None,
    status: Optional[str] = None,
    scope: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's integrations (read-only, MCP ``integrations.list``)."""
    try:
        args: Dict[str, Any] = {}
        if providerCode:
            args["providerCode"] = str(providerCode)[:64]
        if status:
            args["status"] = status
        if scope:
            args["scope"] = scope
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "integrations.list", args)
        rows = _rows_from_key(payload, "integrations")
        return JSONResponse(content={"ok": True, "integrations": [_normalize_integration(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital: integrations list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/integrations/{integration_id}")
def get_integration(integration_id: str) -> JSONResponse:
    """Return one integration by id (MCP ``integrations.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "integrations.get", {"id": integration_id})
        integration = _single_service(payload, "integration")
        if integration is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "integration": _normalize_integration(integration)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital integrations get failed: %s", type(exc).__name__)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/integrations/{integration_id}/test")
def test_integration(integration_id: str) -> JSONResponse:
    """Test an integration (MCP ``integrations.test``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "integrations.test", {"id": integration_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital integrations test failed: %s", integration_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/integrations")
def connect_integration(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Connect an integration (MCP ``integrations.connect``, needsApproval).
    Body: ``{providerCode, appSlug, scope?, mailboxKey?, mailboxLabel?,
    metadata?}`` — ``providerCode`` (≤64) and ``appSlug`` (≤64) are required;
    ``scope`` defaults to ``user``; ``mailboxKey`` defaults to ``default``."""
    if not isinstance(payload, dict):
        payload = {}
    provider_code = payload.get("providerCode")
    app_slug = payload.get("appSlug")
    if not provider_code or not str(provider_code).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "provider_code_required"})
    if not app_slug or not str(app_slug).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "app_slug_required"})

    args: Dict[str, Any] = {"providerCode": str(provider_code)[:64], "appSlug": str(app_slug)[:64]}
    if payload.get("scope") is not None:
        args["scope"] = payload["scope"]
    if payload.get("mailboxKey") is not None:
        args["mailboxKey"] = str(payload["mailboxKey"])[:32]
    if payload.get("mailboxLabel") is not None:
        args["mailboxLabel"] = str(payload["mailboxLabel"])[:120]
    if payload.get("metadata") is not None:
        args["metadata"] = payload["metadata"]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "integrations.connect", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital integrations connect failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/integrations/{integration_id}/disconnect")
def disconnect_integration(integration_id: str) -> JSONResponse:
    """Disconnect an integration (MCP ``integrations.disconnect``, needsApproval)."""
    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "integrations.disconnect", {"id": integration_id})
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital integrations disconnect failed: %s", integration_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# Commerce & payments (W7) — proxy over the commerce/payments MCP tools.
# Reads: orders.*.list/get, payments.*.list/get, payments.links.cancel.
# Mutations (needApproval there): orders.update_status, payments.links.create.
# ---------------------------------------------------------------------------


def _normalize_order(row: Any) -> Dict[str, Any]:
    """Map a CEODigital order row onto the ``OrderRow`` contract (snake/camel)."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "status": row.get("status") or "",
        "payment_status": row.get("paymentStatus") or row.get("payment_status") or row.get("payment_state") or "",
        "fulfillment_status": row.get("fulfillmentStatus") or row.get("fulfillment_status") or "",
        "customer_id": row.get("customerId") or row.get("customer_id") or row.get("customer") or "",
        "customer_email": row.get("customerEmail") or row.get("customer_email") or "",
        "total_cents": row.get("totalCents") or row.get("total_cents") or row.get("amountCents") or row.get("amount_cents"),
        "currency": row.get("currency") or "",
        "created_at": row.get("createdAt") or row.get("created_at"),
        "updated_at": row.get("updatedAt") or row.get("updated_at"),
    }


def _normalize_payment(row: Any) -> Dict[str, Any]:
    """Map a CEODigital payment row onto the ``PaymentRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "status": row.get("status") or "",
        "order_id": row.get("orderId") or row.get("order_id") or "",
        "customer_email": row.get("customerEmail") or row.get("customer_email") or row.get("email") or "",
        "amount_cents": row.get("amountCents") or row.get("amount_cents") or row.get("amount") or row.get("total"),
        "currency": row.get("currency") or "",
        "created_at": row.get("createdAt") or row.get("created_at"),
    }


def _normalize_payment_link(row: Any) -> Dict[str, Any]:
    """Map a CEODigital payment-link row onto the ``PaymentLinkRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "url": row.get("url") or row.get("link") or "",
        "status": row.get("status") or "",
        "amount_cents": row.get("amountCents") or row.get("amount_cents") or row.get("amount"),
        "currency": row.get("currency") or "",
        "customer_email": row.get("customerEmail") or row.get("customer_email") or "",
        "customer_name": row.get("customerName") or row.get("customer_name") or "",
        "customer_phone": row.get("customerPhone") or row.get("customer_phone") or "",
        "expires_at": row.get("expiresAt") or row.get("expires_at"),
        "created_at": row.get("createdAt") or row.get("created_at"),
    }


def _normalize_dsr(row: Any) -> Dict[str, Any]:
    """Map a CEODigital DSR request row onto the ``DsrRequestRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "status": row.get("status") or "",
        "request_type": row.get("requestType") or row.get("request_type") or "",
        "user_id": str(row.get("userId") or row.get("user_id") or ""),
        "processed_by": row.get("processedBy") or row.get("processed_by") or "",
        "created_at": row.get("createdAt") or row.get("created_at"),
        "processed_at": row.get("processedAt") or row.get("processed_at"),
    }


def _normalize_consent(row: Any) -> Dict[str, Any]:
    """Map a CEODigital consent row onto the ``ConsentRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "user_id": str(row.get("userId") or row.get("user_id") or ""),
        "terms_version": row.get("termsVersion") or row.get("terms_version") or "",
        "privacy_version": row.get("privacyVersion") or row.get("privacy_version") or "",
        "ip_address": row.get("ipAddress") or row.get("ip_address") or "",
        "user_agent": row.get("userAgent") or row.get("user_agent") or "",
        "created_at": row.get("createdAt") or row.get("created_at"),
    }


def _normalize_processing_record(row: Any) -> Dict[str, Any]:
    """Map a CEODigital processing record onto the ``ProcessingRecordRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "entity_type": row.get("entityType") or row.get("entity_type") or "",
        "entity_id": row.get("entityId") or row.get("entity_id") or "",
        "status": row.get("status") or "",
        "is_active": row.get("isActive") if row.get("isActive") is not None else row.get("is_active"),
        "started_at": row.get("startedAt") or row.get("started_at"),
        "completed_at": row.get("completedAt") or row.get("completed_at"),
    }


def _normalize_retention_policy(row: Any) -> Dict[str, Any]:
    """Map a CEODigital retention policy onto the ``RetentionPolicyRow`` contract."""
    if not isinstance(row, dict):
        row = {}
    return {
        "id": str(row.get("id") or row.get("_id") or ""),
        "entity": row.get("entity") or "",
        "retention_days": row.get("retentionDays") or row.get("retention_days") or row.get("days"),
        "is_active": row.get("isActive") if row.get("isActive") is not None else row.get("is_active"),
        "created_at": row.get("createdAt") or row.get("created_at"),
    }


def _single_row(payload: Any, *keys: str) -> Optional[Dict[str, Any]]:
    """Pick the single object out of a commerce/governance detail payload."""
    if isinstance(payload, dict):
        for key in keys:
            value = payload.get(key)
            if isinstance(value, dict):
                return value
        rows = _rows_from_services(payload, *keys)
        if rows:
            return rows[0]
    return None


@router.get("/commerce/orders")
def list_orders(
    status: Optional[str] = None,
    paymentStatus: Optional[str] = None,
    fulfillmentStatus: Optional[str] = None,
    customerId: Optional[str] = None,
    search: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's orders (read-only, MCP ``orders.list``)."""
    try:
        args: Dict[str, Any] = {}
        if status:
            args["status"] = status
        if paymentStatus:
            args["paymentStatus"] = paymentStatus
        if fulfillmentStatus:
            args["fulfillmentStatus"] = fulfillmentStatus
        if customerId:
            args["customerId"] = str(customerId)[:64]
        if search is not None:
            args["search"] = str(search)[:200]
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "orders.list", args)
        rows = _rows_from_services(payload, "orders", "items")
        return JSONResponse(content={"ok": True, "orders": [_normalize_order(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital orders list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/commerce/orders/{order_id}")
def get_order(order_id: str) -> JSONResponse:
    """Return a single order by id (MCP ``orders.get``)."""
    try:
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "orders.get", {"id": order_id})
        order = _single_row(payload, "order", "orders")
        if order is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "order": _normalize_order(order)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital orders get failed: %s", order_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/commerce/orders/{order_id}/status")
def update_order_status(order_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Update an order's status/fulfillment (MCP ``orders.update_status``,
    needsApproval). Body: ``{status?, fulfillmentStatus?, cancellationReason?}`` —
    at least one field is required.

    Mutations flow through the CEODigital MCP adapter, which holds its own
    human-in-the-loop approval; this proxy never bypasses it."""
    if not isinstance(payload, dict):
        payload = {}
    status = payload.get("status")
    fulfillment = payload.get("fulfillmentStatus")
    reason = payload.get("cancellationReason")
    if not status and not fulfillment:
        return JSONResponse(
            status_code=422, content={"ok": False, "error": "status_required"}
        )

    args: Dict[str, Any] = {"id": order_id}
    if status:
        args["status"] = status
    if fulfillment:
        args["fulfillmentStatus"] = fulfillment
    if reason is not None:
        args["cancellationReason"] = str(reason)[:500]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "orders.update_status", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital orders update_status failed: %s", order_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/commerce/payments")
def list_payments(
    status: Optional[str] = None,
    orderId: Optional[str] = None,
    customerEmail: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List the tenant's payments (read-only, MCP ``payments.list``)."""
    try:
        args: Dict[str, Any] = {}
        if status:
            args["status"] = status
        if orderId:
            args["orderId"] = str(orderId)[:64]
        if customerEmail is not None:
            args["customerEmail"] = str(customerEmail)[:200]
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "payments.list", args)
        rows = _rows_from_services(payload, "payments", "items")
        return JSONResponse(content={"ok": True, "payments": [_normalize_payment(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital payments list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/commerce/payments/{payment_id}")
def get_payment(payment_id: str, token: Optional[str] = None) -> JSONResponse:
    """Return a single payment by id (MCP ``payments.get``). Optional ``token``
    is forwarded for provider-context lookups."""
    try:
        args: Dict[str, Any] = {"id": payment_id}
        if token is not None:
            args["token"] = str(token)[:256]
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "payments.get", args)
        payment = _single_row(payload, "payment", "payments")
        if payment is None:
            return _maybe_error("not_found")
        return JSONResponse(content={"ok": True, "payment": _normalize_payment(payment)})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital payments get failed: %s", payment_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/commerce/payment-links")
def create_payment_link(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a payment link (MCP ``payments.links.create``, needsApproval).
    Body maps 1:1 to the MCP input: ``{orderId?, customerEmail?,
    customerName?, customerPhone?, amountCents?, currency?, expiresInDays?}``."""
    if not isinstance(payload, dict):
        payload = {}

    args: Dict[str, Any] = {}
    if payload.get("orderId") is not None:
        args["orderId"] = payload["orderId"]
    if payload.get("customerEmail") is not None:
        args["customerEmail"] = str(payload["customerEmail"])[:200]
    if payload.get("customerName") is not None:
        args["customerName"] = str(payload["customerName"])[:200]
    if payload.get("customerPhone") is not None:
        args["customerPhone"] = str(payload["customerPhone"])[:50]
    if payload.get("amountCents") is not None:
        args["amountCents"] = int(payload["amountCents"])
    if payload.get("currency") is not None:
        args["currency"] = str(payload["currency"])[:3]
    if payload.get("expiresInDays") is not None:
        args["expiresInDays"] = int(payload["expiresInDays"])

    if not args:
        return JSONResponse(
            status_code=422, content={"ok": False, "error": "fields_required"}
        )

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "payments.links.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital payment links create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/commerce/payment-links/{link_id}/cancel")
def cancel_payment_link(link_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Cancel a payment link (MCP ``payments.links.cancel``, needsApproval).
    Body: ``{reason?}`` (≤500)."""
    args: Dict[str, Any] = {"id": link_id}
    if isinstance(payload, dict) and payload.get("reason") is not None:
        args["reason"] = str(payload["reason"])[:500]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "payments.links.cancel", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital payment links cancel failed: %s", link_id)
        return _maybe_error(ERR_UNREACHABLE)


# ---------------------------------------------------------------------------
# Governance (W7) — proxy over the governance.* MCP tools. Reads are lists;
# writes (needApproval there): governance.dsr.create/route, consents.record.
# ---------------------------------------------------------------------------


@router.get("/governance/dsr")
def list_dsr_requests(
    status: Optional[str] = None,
    requestType: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List data-subject requests (read-only, MCP ``governance.dsr.list``)."""
    try:
        args: Dict[str, Any] = {}
        if status:
            args["status"] = status
        if requestType:
            args["requestType"] = requestType
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "governance.dsr.list", args)
        rows = _rows_from_services(payload, "requests", "dsr_requests", "dsrRequests", "items")
        return JSONResponse(content={"ok": True, "requests": [_normalize_dsr(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance dsr list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/governance/dsr")
def create_dsr_request(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Create a data-subject request (MCP ``governance.dsr.create``,
    needsApproval). Body: ``{userId, requestType}`` — ``requestType`` is
    required and one of ``export``|``deletion``."""
    if not isinstance(payload, dict):
        payload = {}
    user_id = payload.get("userId")
    request_type = payload.get("requestType")
    if not request_type or request_type not in ("export", "deletion"):
        return JSONResponse(
            status_code=422, content={"ok": False, "error": "invalid_request_type"}
        )
    if not user_id or not str(user_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "user_id_required"})

    args: Dict[str, Any] = {"userId": str(user_id), "requestType": str(request_type)}

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "governance.dsr.create", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance dsr create failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/governance/dsr/{request_id}/route")
def route_dsr_request(request_id: str, payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Route / claim a DSR request (MCP ``governance.dsr.route``,
    needsApproval). Body: ``{processedBy?}``."""
    args: Dict[str, Any] = {"id": request_id}
    if isinstance(payload, dict) and payload.get("processedBy") is not None:
        args["processedBy"] = str(payload["processedBy"])[:64]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "governance.dsr.route", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance dsr route failed: %s", request_id)
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/governance/consents")
def list_consents(
    userId: Optional[str] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List recorded consents (read-only, MCP ``governance.consents.list``)."""
    try:
        args: Dict[str, Any] = {}
        if userId:
            args["userId"] = str(userId)[:64]
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "governance.consents.list", args)
        rows = _rows_from_services(payload, "consents", "items")
        return JSONResponse(content={"ok": True, "consents": [_normalize_consent(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance consents list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.post("/governance/consents")
def record_consent(payload: Dict[str, Any] = Body(default={})) -> JSONResponse:
    """Record a consent (MCP ``governance.consents.record``, needsApproval).
    Body: ``{userId, termsVersion?, privacyVersion?, termsDocumentId?,
    privacyDocumentId?, ipAddress?, userAgent?}``."""
    if not isinstance(payload, dict):
        payload = {}
    user_id = payload.get("userId")
    if not user_id or not str(user_id).strip():
        return JSONResponse(status_code=422, content={"ok": False, "error": "user_id_required"})

    args: Dict[str, Any] = {"userId": str(user_id)}
    for key, maxlen in (
        ("termsVersion", 32),
        ("privacyVersion", 32),
        ("ipAddress", 45),
        ("userAgent", 500),
    ):
        if payload.get(key) is not None:
            args[key] = str(payload[key])[:maxlen]
    for key in ("termsDocumentId", "privacyDocumentId"):
        if payload.get(key) is not None:
            args[key] = str(payload[key])[:64]

    try:
        cfg = _load_config()
        result = _mcp_fetch(cfg, "governance.consents.record", args)
        return JSONResponse(content={"ok": True, "result": result})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance consents record failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/governance/processing-records")
def list_processing_records(
    isActive: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List processing records (read-only, MCP
    ``governance.processing_records.list``)."""
    try:
        args: Dict[str, Any] = {}
        if isActive is not None:
            args["isActive"] = bool(isActive)
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "governance.processing_records.list", args)
        rows = _rows_from_services(payload, "records", "processing_records", "processingRecords", "items")
        return JSONResponse(content={"ok": True, "records": [_normalize_processing_record(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance processing records list failed")
        return _maybe_error(ERR_UNREACHABLE)


@router.get("/governance/retention")
def list_retention_policies(
    entity: Optional[str] = None,
    isActive: Optional[bool] = None,
    limit: Optional[int] = None,
) -> JSONResponse:
    """List retention policies (read-only, MCP ``governance.retention.list``)."""
    try:
        args: Dict[str, Any] = {}
        if entity is not None:
            args["entity"] = str(entity)[:64]
        if isActive is not None:
            args["isActive"] = bool(isActive)
        if limit is not None:
            args["limit"] = max(1, min(50, int(limit)))
        cfg = _load_config()
        payload = _mcp_fetch(cfg, "governance.retention.list", args)
        rows = _rows_from_services(payload, "policies", "retention_policies", "retentionPolicies", "items")
        return JSONResponse(content={"ok": True, "policies": [_normalize_retention_policy(r) for r in rows]})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital governance retention list failed")
        return _maybe_error(ERR_UNREACHABLE)