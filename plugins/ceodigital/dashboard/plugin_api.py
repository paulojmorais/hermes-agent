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
        return JSONResponse(content={"ok": True, "pending": rows})
    except _TypedError as exc:
        return _maybe_error(exc.code)
    except Exception:
        log.exception("ceodigital agent.runs.pending_calls list failed")
        return _maybe_error(ERR_UNREACHABLE)