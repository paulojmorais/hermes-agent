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

from fastapi import APIRouter, Body
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