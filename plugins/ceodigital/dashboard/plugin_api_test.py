"""Unit tests for the CEODigital dashboard plugin backend router.

Mocks only — no live network. The router is loaded exactly the way the
dashboard mounts it (``importlib`` from the plugin file), then attached to
a bare FastAPI app under the namespace prefix, mirroring the kanban test
harness (``tests/plugins/test_kanban_dashboard_plugin.py``).

The suite asserts the W3 contract (design doc §5):
  * ``{ok: true, workitems: WorkItemRow[]}`` on success
  * ``{ok: false, error: 'mcp_not_configured' | 'mcp_unreachable' |
        'tenant_not_found' | string}`` on failure
and that the MCP bearer token never leaks into a response body.
"""

from __future__ import annotations

import importlib.util
import pathlib
import sys

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

_REPO_ROOT = pathlib.Path(__file__).resolve().parents[3]  # .../<repo>/plugins/ceodigital/dashboard/<file>
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))


def _load_plugin_module():
    """Load ``plugins/ceodigital/dashboard/plugin_api.py`` via importlib,
    mirroring ``hermes_cli.web_server._mount_plugin_api_routes``."""
    plugin_file = _REPO_ROOT / "plugins" / "ceodigital" / "dashboard" / "plugin_api.py"
    assert plugin_file.exists(), f"plugin file missing: {plugin_file}"

    spec = importlib.util.spec_from_file_location(
        "hermes_dashboard_plugin_ceodigital_test", plugin_file,
    )
    assert spec is not None and spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


@pytest.fixture(scope="module")
def plugin():
    return _load_plugin_module()


@pytest.fixture()
def client(plugin):
    app = FastAPI()
    app.include_router(plugin.router, prefix="/api/plugins/ceodigital")
    return TestClient(app)


# ---------------------------------------------------------------------------
# Helpers — fake the only network boundary: httpx.post
# ---------------------------------------------------------------------------


class _FakeResponse:
    """Minimal stand-in for an httpx.Response."""

    def __init__(self, payload=None, status_code: int = 200):
        self._payload = payload
        self.status_code = status_code

    def json(self):
        return self._payload


_OK_CONFIG = {
    "app_url": "https://ceodigital-example.internal",
    "tenant_slug": "acme-dev",
    "mcp_token": "secret-mcp-token",
}


# ---------------------------------------------------------------------------
# GET /workitems — success shape
# ---------------------------------------------------------------------------


def test_list_workitems_success_shape(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx,
        "post",
        lambda *a, **kw: _FakeResponse({"workitems": [
            {
                "id": "wi-1",
                "title": "Beta onboarding flow",
                "status": "ready",
                "assignee": "maria",
                "summary": "Ship beta onboarding",
                "updated_at": "2026-08-01T10:00:00Z",
            },
            {
                "_id": "wi-2",
                "name": "Fix billing webhook",
                "state": "running",
            },
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/workitems")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    items = data["workitems"]
    assert len(items) == 2

    row = items[0]
    assert row == {
        "id": "wi-1",
        "title": "Beta onboarding flow",
        "status": "ready",
        "assignee": "maria",
        "summary": "Ship beta onboarding",
        "updated_at": "2026-08-01T10:00:00Z",
    }
    template = items[1]
    assert template["id"] == "wi-2"
    assert template["title"] == "Fix billing webhook"  # name → title fallback
    assert template["status"] == "running"  # state → status fallback


def test_workitems_success_never_leaks_token(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_post(url, **kw):
        captured["url"] = url
        captured["auth"] = kw["headers"]["Authorization"]
        return _FakeResponse({"workitems": []})

    monkeypatch.setattr(plugin.httpx, "post", fake_post)
    resp = client.get("/api/plugins/ceodigital/workitems")
    assert resp.status_code == 200
    # The renderer never receives the token, and the auth header is a Bearer token.
    assert resp.json()["ok"] is True
    assert "secret-mcp-token" not in resp.text
    assert captured["auth"] == "Bearer secret-mcp-token"
    assert captured["url"].endswith("/api/public/mcp/acme-dev")


# ---------------------------------------------------------------------------
# Error envelope: mcp_not_configured
# ---------------------------------------------------------------------------


def test_missing_config_returns_mcp_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {})

    resp = client.get("/api/plugins/ceodigital/workitems")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


def test_missing_token_returns_mcp_not_configured(plugin, client, monkeypatch):
    cfg = dict(_OK_CONFIG, mcp_token=None)
    monkeypatch.setattr(plugin, "_load_config", lambda: cfg)

    resp = client.get("/api/plugins/ceodigital/workitems")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# Error envelope: mcp_unreachable
# ---------------------------------------------------------------------------


def test_network_error_returns_mcp_unreachable(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    def boom(*args, **kw):
        raise plugin.httpx.ConnectError("boom")

    monkeypatch.setattr(plugin.httpx, "post", boom)

    resp = client.get("/api/plugins/ceodigital/workitems")

    assert resp.status_code == 502
    assert resp.json() == {"ok": False, "error": "mcp_unreachable"}


def test_http_500_returns_mcp_unreachable(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"detail": "internal"}, status_code=500),
    )

    resp = client.get("/api/plugins/ceodigital/workitems")

    assert resp.status_code == 502
    assert resp.json() == {"ok": False, "error": "mcp_unreachable"}


# ---------------------------------------------------------------------------
# Error envelope: tenant_not_found
# ---------------------------------------------------------------------------


def test_http_404_returns_tenant_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"detail": "nope"}, status_code=404),
    )

    resp = client.get("/api/plugins/ceodigital/workitems")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "tenant_not_found"}


# ---------------------------------------------------------------------------
# Detail endpoint
# ---------------------------------------------------------------------------


def test_workitem_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"workitems": [{
            "id": "wi-7",
            "title": "CRM sync",
            "status": "done",
            "assignee": "joao",
            "summary": "Keep CRM in-sync",
            "updated_at": "2026-08-14T09:00:00Z",
        }]}),
    )

    resp = client.get("/api/plugins/ceodigital/workitems/wi-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workitem"]["id"] == "wi-7"
    assert data["workitem"]["title"] == "CRM sync"


def test_workitem_detail_unknown_id_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"workitems": []}))

    resp = client.get("/api/plugins/ceodigital/workitems/wi-nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


# ---------------------------------------------------------------------------
# CRM (W4): leads + deals
# ---------------------------------------------------------------------------


def test_leads_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"leads": [
            {"id": "lead-1", "name": "Acme Corp", "status": "new"},
            {"id": "lead-2", "name": "Beta Lda", "status": "contacted"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/leads")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [l["id"] for l in data["leads"]] == ["lead-1", "lead-2"]
    # title falls back to name; unknown fields pass through untouched.
    assert data["leads"][0]["title"] == "Acme Corp"
    assert data["leads"][0]["name"] == "Acme Corp"


def test_leads_tolerates_jsonrpc_content_envelope(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    # A JSON-RPC envelope {result:{content:[{type:text,text:...}]}} whose text
    # is itself a {"leads": [...]} object.
    import json as _json

    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {"content": [{"type": "text", "text": _json.dumps({"leads": [{"id": "l9", "name": "Gamma", "status": "new"}]})}]},
    }
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse(payload))

    resp = client.get("/api/plugins/ceodigital/leads")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["leads"][0]["id"] == "l9"


def test_deals_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"deals": [
            {"id": "deal-1", "name": "Annual contract", "status": "won"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/deals")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["deals"][0]["id"] == "deal-1"
    assert data["deals"][0]["title"] == "Annual contract"


def test_leads_empty(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"leads": []}))

    resp = client.get("/api/plugins/ceodigital/leads")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "leads": []}


def test_deals_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    resp = client.get("/api/plugins/ceodigital/deals")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# Agents + NativeFlows (W5)
# ---------------------------------------------------------------------------


def test_agents_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"agents": [
            {"id": "a1", "slug": "ops-lead", "name": "Ops Lead", "description": "Runs ops", "is_active": True},
            {"id": "a2", "slug": "research", "name": "Research", "description": None, "is_active": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/agents")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [a["slug"] for a in data["agents"]] == ["ops-lead", "research"]


def test_agents_empty(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"agents": []}))

    resp = client.get("/api/plugins/ceodigital/agents")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "agents": []}


def test_agentflows_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"workflows": [
            {"id": "w1", "name": "Onboarding", "status": "active", "trigger_type": "manual"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/agentflows")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workflows"][0]["name"] == "Onboarding"


def test_agentflows_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    resp = client.get("/api/plugins/ceodigital/agentflows")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W5+ — Agent run + debrief (execute + runs)
# ---------------------------------------------------------------------------


def test_agent_ask_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({
            "run_id": "run-1",
            "status": "completed",
            "response_text": "Done!",
            "pending_approvals": [],
        }),
    )

    resp = client.post(
        "/api/plugins/ceodigital/agents/ops-lead/ask",
        json={"prompt": "what should I do next?"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["run"]["run_id"] == "run-1"
    assert data["run"]["status"] == "completed"


def test_agent_ask_requires_prompt(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post(
        "/api/plugins/ceodigital/agents/ops-lead/ask",
        json={},
    )

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "prompt_required"}


def test_agent_runs_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"runs": [
            {"id": "run-1", "agent_id": "a1", "status": "completed", "started_at": "2026-08-15T10:00:00Z"},
            {"id": "run-2", "agent_id": "a1", "status": "running", "started_at": "2026-08-15T11:00:00Z"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/agents/runs")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [r["id"] for r in data["runs"]] == ["run-1", "run-2"]


def test_agent_run_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"run": {
            "id": "run-1", "agent_id": "a1", "status": "completed",
            "steps": [{"type": "text", "text": "hello"}], "usage": {"input_tokens": 10},
        }}),
    )

    resp = client.get("/api/plugins/ceodigital/agents/runs/run-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["run"]["id"] == "run-1"
    assert data["run"]["steps"][0]["text"] == "hello"


def test_agent_run_detail_unknown_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    resp = client.get("/api/plugins/ceodigital/agents/runs/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_agent_schedules_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"schedules": [
            {"id": "s1", "agent_id": "a1", "name": "Daily digest", "cron_expr": "0 9 * * *", "is_active": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/agents/schedules")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["schedules"][0]["name"] == "Daily digest"


def test_agent_schedules_active_only_query(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"schedules": []}))

    resp = client.get("/api/plugins/ceodigital/agents/schedules?activeOnly=true")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "schedules": []}


def test_agent_pending_approvals_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"pending_calls": [
            {"id": "p1", "run_id": "r1", "tool_name": "int.gmail.send_email", "status": "pending"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/agents/pending")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["pending"][0]["tool_name"] == "int.gmail.send_email"
    # The approval URL is built server-side from app_url + tenant_slug (never
    # the token) so the desktop can deep-link to the tenant HITL UI.
    assert data["approval_url"] == (
        "https://ceodigital-example.internal/t/acme-dev/agent/approvals"
    )


def test_agent_pending_empty(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"pending_calls": []}))

    resp = client.get("/api/plugins/ceodigital/agents/pending")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["pending"] == []
    # approval_url is always present once the tenant MCP works.
    assert data["approval_url"] == (
        "https://ceodigital-example.internal/t/acme-dev/agent/approvals"
    )


def test_agent_schedules_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    resp = client.get("/api/plugins/ceodigital/agents/schedules")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# Config shapes never hardcoded
# ---------------------------------------------------------------------------


def test_config_never_hardcodes_url_or_slug(plugin):
    import re

    source = pathlib.Path(plugin.__file__).read_text(encoding="utf-8")
    # Certify that no production-ish URL/slug appears as a root literal,
    # only the config-driven path segment (/api/public/mcp).
    assert "https://" not in source.replace("https://<app>", "")
    assert "acme-dev" not in source
    assert "secret-mcp-token" not in source
    assert "_MCP_PATH" in source and "api/public/mcp" in source
    # The env names exist so operators can provision without code edits.
    for env in ("CEODIGITAL_APP_URL", "CEODIGITAL_TENANT_SLUG", "CEODIGITAL_MCP_TOKEN"):
        assert env in source