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
# Workitems operational (W2) — status, suggest + the POST actions
# ---------------------------------------------------------------------------


def test_workitems_status_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    # Monkeypatch the module-level _mcp_fetch to return rows.
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"workitems": [{"id": "wi-m1", "title": "My item", "status": "ready"}]}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.get("/api/plugins/ceodigital/workitems/status?filter=mine")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workitems"][0]["id"] == "wi-m1"
    assert captured["tool"] == "workitems.status"
    assert captured["args"] == {"filter": "mine"}


def test_workitems_status_without_filter(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["args"] = arguments
        return {"workitems": []}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.get("/api/plugins/ceodigital/workitems/status")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "workitems": []}
    assert captured["args"] == {}


def test_workitems_status_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    resp = client.get("/api/plugins/ceodigital/workitems/status")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


def test_workitems_suggest_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"suggestions": [{"id": "sop-1", "title": "Onboarding SOP", "score": 0.9}]}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.get("/api/plugins/ceodigital/workitems/suggest?intent=onboard%20new%20client&limit=3")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["suggestions"][0]["id"] == "sop-1"
    assert captured["tool"] == "workitems.suggest"
    assert captured["args"] == {"intent": "onboard new client", "limit": 3}


def test_workitems_suggest_default_limit(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, _tool_name, arguments):
        captured["args"] = arguments
        return {"suggestions": []}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.get("/api/plugins/ceodigital/workitems/suggest?intent=followup")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "suggestions": []}
    assert "limit" not in captured["args"]
    assert captured["args"] == {"intent": "followup"}


def test_workitems_suggest_requires_intent(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.get("/api/plugins/ceodigital/workitems/suggest")

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "intent_required"}


def test_workitems_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"id": "wi-new", "title": "Ship onboarding", "status": "backlog"}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post(
        "/api/plugins/ceodigital/workitems",
        json={
            "title": "Ship onboarding",
            "subject_type": "project",
            "description": "Onboard beta clients",
            "due_at": "2026-09-01T00:00:00Z",
            "auto_run": True,
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["id"] == "wi-new"
    assert captured["tool"] == "workitems.create"
    assert captured["args"] == {
        "title": "Ship onboarding",
        "subject_type": "project",
        "description": "Onboard beta clients",
        "due_at": "2026-09-01T00:00:00Z",
        "auto_run": True,
    }


def test_workitems_create_requires_title_and_subject(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/workitems", json={"subject_type": "project"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "title_required"}

    resp = client.post("/api/plugins/ceodigital/workitems", json={"title": "x"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "subject_type_required"}


def test_workitems_create_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    resp = client.post(
        "/api/plugins/ceodigital/workitems",
        json={"title": "x", "subject_type": "project"},
    )

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


def test_workitems_run_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"run_id": "run-1", "status": "running"}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/run", json={})

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["run_id"] == "run-1"
    assert captured["tool"] == "workitems.run"
    assert captured["args"] == {"work_item_id": "wi-1"}


def test_workitems_assign_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"work_item_id": "wi-1"}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post(
        "/api/plugins/ceodigital/workitems/wi-1/assign",
        json={"add": ["u-1", "u-2"], "remove": ["u-3"], "role": "reviewer"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workitems.assign"
    assert captured["args"] == {
        "work_item_id": "wi-1",
        "role": "reviewer",
        "add": ["u-1", "u-2"],
        "remove": ["u-3"],
    }


def test_workitems_assign_defaults_role_owner(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, _tool_name, arguments):
        captured["args"] = arguments
        return {}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/assign", json={"add": ["u-9"]})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["args"] == {"work_item_id": "wi-1", "role": "owner", "add": ["u-9"]}


def test_workitems_submit_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"accepted": True}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post(
        "/api/plugins/ceodigital/workitems/wi-1/submit",
        json={"run_id": "run-1", "output": {"summary": "done"}, "notes": "all green"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workitems.submit_output"
    assert captured["args"] == {
        "work_item_id": "wi-1",
        "run_id": "run-1",
        "output": {"summary": "done"},
        "notes": "all green",
    }


def test_workitems_submit_requires_run_id_and_output(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/submit", json={"output": {}})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "run_id_required"}

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/submit", json={"run_id": "r1"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "output_required"}


def test_workitems_checklist_toggle_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return {"item_id": "cli-1", "done": True}

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)

    resp = client.post(
        "/api/plugins/ceodigital/workitems/wi-1/checklist",
        json={"checklist_item_id": "cli-1", "done": True},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workitems.checklist.toggle"
    assert captured["args"] == {"work_item_id": "wi-1", "checklist_item_id": "cli-1", "done": True}


def test_workitems_checklist_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/checklist", json={"done": True})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "checklist_item_id_required"}

    resp = client.post("/api/plugins/ceodigital/workitems/wi-1/checklist", json={"checklist_item_id": "cli-1"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "done_required"}


def test_no_approve_or_reject_route_exposed(plugin):
    """Certify the plugin never proxies approval/denial of work items — the
    platform excludes ``workitems.approve``/``workitems.reject`` from MCP on
    purpose; they stay in the tenant UI."""
    source = pathlib.Path(plugin.__file__).read_text(encoding="utf-8")
    assert "workitems.approve" not in source
    assert "workitems.reject" not in source


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
# CRM W1 — persons, organizations, pipelines, stages, activities, categories
# ---------------------------------------------------------------------------


def test_persons_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"persons": [
            {"id": "p-1", "first_name": "Ana", "last_name": "Silva", "email": "ana@x.pt"},
            {"id": "p-2", "first_name": "Joao", "last_name": "Moura"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/persons")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["persons"][0]["id"] == "p-1"
    # title falls back to the full name when no title/name field exists.
    assert data["persons"][0]["title"] == "Ana Silva"
    assert data["persons"][1]["title"] == "Joao Moura"


def test_person_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"person": {"id": "p-1", "first_name": "Ana", "last_name": "Silva"}}),
    )

    resp = client.get("/api/plugins/ceodigital/persons/p-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["person"]["title"] == "Ana Silva"


def test_person_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({"ok": False, "error": "person_not_found"}))

    resp = client.get("/api/plugins/ceodigital/persons/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_organizations_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"organizations": [
            {"id": "o-1", "name": "Acme Corp", "industry": "tech"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/organizations")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["organizations"][0]["id"] == "o-1"
    assert data["organizations"][0]["title"] == "Acme Corp"


def test_organization_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"organization": {"id": "o-1", "name": "Acme Corp"}}),
    )

    resp = client.get("/api/plugins/ceodigital/organizations/o-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["organization"]["title"] == "Acme Corp"


def test_organization_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    resp = client.get("/api/plugins/ceodigital/organizations/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_pipelines_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"pipelines": [
            {"id": "pl-1", "name": "Sales", "subject_type": "deal", "stages": [{"id": "s-1", "name": "New"}]},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/pipelines")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["pipelines"][0]["id"] == "pl-1"
    # Inline stages pass through untouched.
    assert data["pipelines"][0]["stages"][0]["name"] == "New"


def test_stages_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"stages": [
            {"id": "s-1", "name": "Qualified", "probability": 50},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/stages?pipelineId=pl-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["stages"][0]["id"] == "s-1"
    assert data["stages"][0]["title"] == "Qualified"


def test_stages_without_pipeline_returns_empty(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    resp = client.get("/api/plugins/ceodigital/stages")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "stages": []}


def test_activities_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"activities": [
            {"id": "a-1", "kind": "note", "body": "Called the client"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/activities?related_type=lead&related_id=lead-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["activities"][0]["title"] == "Called the client"


def test_activities_without_subject_returns_empty(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    resp = client.get("/api/plugins/ceodigital/activities")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "activities": []}


def test_categories_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(
        plugin.httpx, "post",
        lambda *a, **kw: _FakeResponse({"categories": [
            {"id": "c-1", "label": "Cold call", "slug": "cold_call"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/categories")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["categories"][0]["id"] == "c-1"
    assert data["categories"][0]["title"] == "Cold call"


def test_crm_reads_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})
    monkeypatch.setattr(plugin.httpx, "post", lambda *a, **kw: _FakeResponse({}))

    for route in ("persons", "organizations", "pipelines", "categories"):
        resp = client.get(f"/api/plugins/ceodigital/{route}")
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


# ---------------------------------------------------------------------------
# W3 · Services & Proposals — reads (catalog / offerings / categories)
# ---------------------------------------------------------------------------


def _fake_mcp(captured, payload):
    """Return a ``_mcp_fetch`` fake that records tool/args and yields ``payload``."""

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        captured["tool"] = tool_name
        captured["args"] = arguments
        return payload

    return fake_mcp_fetch


def test_services_catalog_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"catalog": [
            {"id": "ci-1", "name": "Onboarding", "produces": "implementation", "active": True},
            {"id": "ci-2", "title": "Retainer", "produces": "subscription", "active": False},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/services/catalog?search=onb&produces=implementation&active=true&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [c["id"] for c in data["catalog"]] == ["ci-1", "ci-2"]
    assert data["catalog"][0]["title"] == "Onboarding"  # name → title fallback
    assert captured["tool"] == "services.catalog.list"
    assert captured["args"] == {"search": "onb", "produces": "implementation", "active": True, "limit": 5}


def test_services_catalog_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"catalog": []}))

    resp = client.get("/api/plugins/ceodigital/services/catalog")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "catalog": []}
    assert captured["args"] == {}


def test_services_catalog_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"catalog": {"id": "ci-7", "name": "Sprint Boost", "produces": "implementation"}}),
    )

    resp = client.get("/api/plugins/ceodigital/services/catalog/ci-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["item"]["id"] == "ci-7"
    assert data["item"]["title"] == "Sprint Boost"
    assert captured["tool"] == "services.catalog.get"
    assert captured["args"] == {"id": "ci-7"}


def test_services_catalog_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/services/catalog/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_services_offerings_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"offerings": [
            {"id": "of-1", "name": "Starter", "pricing_model": "fixed", "price": 500},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/services/offerings?serviceCatalogId=ci-1&pricingModel=fixed&isActive=true")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["offerings"][0]["title"] == "Starter"
    assert captured["tool"] == "services.offerings.list"
    assert captured["args"] == {"serviceCatalogId": "ci-1", "pricingModel": "fixed", "isActive": True}


def test_services_offerings_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"offering": {"id": "of-9", "name": "Pro", "pricing_model": "per_unit"}}),
    )

    resp = client.get("/api/plugins/ceodigital/services/offerings/of-9")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["offering"]["id"] == "of-9"
    assert data["offering"]["title"] == "Pro"
    assert captured["args"] == {"id": "of-9"}


def test_services_categories_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"categories": [
            {"id": "cat-1", "label": "Implementation", "parent_id": None},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/services/categories?isActive=true")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["categories"][0]["title"] == "Implementation"  # label → title fallback
    assert captured["tool"] == "services.categories.list"
    assert captured["args"] == {"isActive": True}


def test_services_categories_parent_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"categories": []}))

    resp = client.get("/api/plugins/ceodigital/services/categories?parentId=cat-1")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "categories": []}
    assert captured["args"] == {"parentId": "cat-1"}


def test_services_proposals_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"proposals": [
            {"id": "pr-1", "title": "Acme renewal", "status": "draft", "totalValue": 1200, "currency": "EUR"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/services/proposals?status=draft&search=acme&limit=10")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    proposal = data["proposals"][0]
    assert proposal["id"] == "pr-1"
    assert proposal["value"] == 1200  # totalValue → value pinned by the normalizer
    assert proposal["currency"] == "EUR"
    assert captured["tool"] == "services.proposals.list"
    assert captured["args"] == {"status": "draft", "search": "acme", "limit": 10}


def test_services_proposals_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"proposal": {
            "id": "pr-2",
            "title": "Beta onboarding",
            "status": "sent",
            "items": [{"id": "it-1", "description": "Setup", "unitPrice": 900}],
            "payment_tranches": [{"id": "tr-1", "label": "Deposit", "amount": 300, "dueDate": "2026-09-01"}],
        }}),
    )

    resp = client.get("/api/plugins/ceodigital/services/proposals/pr-2")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["proposal"]["id"] == "pr-2"
    assert data["proposal"]["items"][0]["unit_price"] == 900  # unitPrice pinned
    assert data["proposal"]["tranches"][0]["due_date"] == "2026-09-01"  # dueDate pinned
    assert captured["args"] == {"id": "pr-2"}


def test_services_proposals_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/services/proposals/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_services_reads_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for route in ("services/catalog", "services/offerings", "services/categories", "services/proposals"):
        resp = client.get(f"/api/plugins/ceodigital/{route}")
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W3 · Services & Proposals — proposal lifecycle mutations
# ---------------------------------------------------------------------------


def test_services_proposals_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"id": "pr-new", "title": "Acme onboarding", "status": "draft"}),
    )

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals",
        json={
            "title": "Acme onboarding",
            "leadId": "lead-1",
            "description": "Full onboarding sprint",
            "currency": "EUR",
            "totalValue": 2500,
            "paymentModel": "milestone_based",
            "depositPercentage": 20,
            "validUntil": "2026-10-01",
            "terms": "Net 30",
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["id"] == "pr-new"
    assert captured["tool"] == "services.proposals.create"
    assert captured["args"] == {
        "title": "Acme onboarding",
        "leadId": "lead-1",
        "description": "Full onboarding sprint",
        "currency": "EUR",
        "totalValue": 2500,
        "paymentModel": "milestone_based",
        "depositPercentage": 20,
        "validUntil": "2026-10-01",
        "terms": "Net 30",
    }


def test_services_proposals_create_requires_title(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/services/proposals", json={"currency": "EUR"})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "title_required"}


def test_services_proposals_send_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "sent"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/send", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.send"
    assert captured["args"] == {"id": "pr-1"}


def test_services_proposals_accept_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "accepted"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/accept", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.accept"
    assert captured["args"] == {"id": "pr-1"}


def test_services_proposals_reject_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "rejected"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/reject",
        json={"reason": "budget too high"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.reject"
    assert captured["args"] == {"id": "pr-1", "reason": "budget too high"}


def test_services_proposals_reject_without_reason(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "rejected"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/reject", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["args"] == {"id": "pr-1"}


def test_services_proposals_cancel_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "cancelled"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/cancel", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.cancel"
    assert captured["args"] == {"id": "pr-1"}


def test_services_proposals_update_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "draft"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/update",
        json={"title": "Renamed", "description": None, "terms": "Net 15"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.update"
    # description:null is passed through so the MCP tool can clear the field.
    assert captured["args"] == {"id": "pr-1", "title": "Renamed", "description": None, "terms": "Net 15"}


def test_services_proposals_duplicate_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "pr-dup"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/duplicate", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.duplicate"
    assert captured["args"] == {"id": "pr-1"}


def test_services_proposals_expire_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"status": "expired"}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/expire", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.expire"
    assert captured["args"] == {"id": "pr-1"}


def test_services_mutations_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/send", json={})

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W3 · Services & Proposals — line items + tranches mutations
# ---------------------------------------------------------------------------


def test_services_proposals_items_add_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "it-new"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/items",
        json={"values": {
            "serviceCatalogId": "ci-1",
            "serviceOfferingId": "of-1",
            "quantity": 2,
            "unitPrice": 450,
            "discount": 10,
            "vatRate": 23,
            "recurrence": "monthly",
            "description": "Two seats",
        }},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.items.add"
    assert captured["args"] == {
        "proposalId": "pr-1",
        "values": {
            "serviceCatalogId": "ci-1",
            "serviceOfferingId": "of-1",
            "quantity": 2,
            "unitPrice": 450,
            "discount": 10,
            "vatRate": 23,
            "recurrence": "monthly",
            "description": "Two seats",
        },
    }


def test_services_proposals_items_add_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/items", json={})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "values_required"}

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/items", json={"values": {"unitPrice": 100}})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "service_catalog_id_required"}

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/items", json={"values": {"serviceCatalogId": "ci-1"}})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "unit_price_required"}


def test_services_proposals_items_update_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "it-1"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/items/it-1",
        json={"values": {"quantity": 3, "unitPrice": 400}},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.items.update"
    assert captured["args"] == {"id": "it-1", "values": {"quantity": 3, "unitPrice": 400}}


def test_services_proposals_items_update_requires_values(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/items/it-1", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "values_required"}


def test_services_proposals_items_remove_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"removed": True}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/items/it-1/remove", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.items.remove"
    assert captured["args"] == {"id": "it-1"}


def test_services_proposals_tranches_add_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "tr-new"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/tranches",
        json={"values": {"label": "Deposit", "amount": 300, "dueDate": "2026-09-01"}},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.tranches.add"
    assert captured["args"] == {
        "proposalId": "pr-1",
        "values": {"label": "Deposit", "amount": 300, "dueDate": "2026-09-01"},
    }


def test_services_proposals_tranches_add_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/tranches", json={"values": {"amount": 100}})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "label_required"}

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/tranches", json={"values": {"label": "Deposit"}})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "amount_required"}


def test_services_proposals_tranches_update_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "tr-1"}))

    resp = client.post(
        "/api/plugins/ceodigital/services/proposals/pr-1/tranches/tr-1",
        json={"values": {"label": "Milestone", "amount": 700}},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.tranches.update"
    assert captured["args"] == {"id": "tr-1", "values": {"label": "Milestone", "amount": 700}}


def test_services_proposals_tranches_remove_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"removed": True}))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/tranches/tr-1/remove", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "services.proposals.tranches.remove"
    assert captured["args"] == {"id": "tr-1"}


def test_services_proposals_tranches_update_requires_values(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/services/proposals/pr-1/tranches/tr-1", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "values_required"}


# ---------------------------------------------------------------------------
# W4 · Automation — conversations
# ---------------------------------------------------------------------------


def test_conversations_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"conversations": [
            {"id": "c-1", "title": "Prospecting", "is_archived": False},
            {"id": "c-2", "name": "Billing", "isArchived": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/conversations?isArchived=true&search=bill&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["conversations"][0]["id"] == "c-1"
    assert data["conversations"][0]["title"] == "Prospecting"
    assert data["conversations"][1]["title"] == "Billing"  # name → title fallback
    assert captured["tool"] == "conversations.list"
    assert captured["args"] == {"isArchived": True, "search": "bill", "limit": 5}


def test_conversations_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"conversations": []}))

    resp = client.get("/api/plugins/ceodigital/automation/conversations")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "conversations": []}
    assert captured["args"] == {}


def test_conversation_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"conversation": {"id": "c-7", "title": "Onboarding", "model": "sonnet"}}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/conversations/c-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["conversation"]["id"] == "c-7"
    assert captured["args"] == {"id": "c-7"}


def test_conversation_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/automation/conversations/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_conversations_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"id": "c-new", "title": "New chat", "status": "active"}),
    )

    resp = client.post(
        "/api/plugins/ceodigital/automation/conversations",
        json={
            "title": "New chat",
            "systemPrompt": "Act as an ops analyst",
            "model": "sonnet",
            "tags": ["ops", "lead"],
            "workspaceId": "ws-1",
        },
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["id"] == "c-new"
    assert captured["tool"] == "conversations.create"
    assert captured["args"] == {
        "title": "New chat",
        "systemPrompt": "Act as an ops analyst",
        "model": "sonnet",
        "tags": ["ops", "lead"],
        "workspaceId": "ws-1",
    }


def test_conversations_create_empty_body(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "c-blank"}))

    resp = client.post("/api/plugins/ceodigital/automation/conversations", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["args"] == {}


def test_conversations_archive_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "c-1", "is_archived": True}))

    resp = client.post("/api/plugins/ceodigital/automation/conversations/c-1/archive", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "conversations.archive"
    assert captured["args"] == {"id": "c-1"}


def test_conversations_share_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "c-1", "shared": True}))

    resp = client.post("/api/plugins/ceodigital/automation/conversations/c-1/share", json={"enabled": True})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "conversations.share"
    assert captured["args"] == {"id": "c-1", "enabled": True}


def test_conversations_share_requires_enabled(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/automation/conversations/c-1/share", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "enabled_required"}


def test_conversations_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    resp = client.get("/api/plugins/ceodigital/automation/conversations")

    assert resp.status_code == 503
    assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W4 · Automation — playbooks (+ runs)
# ---------------------------------------------------------------------------


def test_playbooks_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"playbooks": [
            {"id": "pb-1", "title": "Close lead", "subject_type": "deal", "is_active": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/playbooks?subjectType=deal&isActive=true&limit=10")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["playbooks"][0]["id"] == "pb-1"
    assert data["playbooks"][0]["title"] == "Close lead"
    assert captured["tool"] == "playbooks.list"
    assert captured["args"] == {"subjectType": "deal", "isActive": True, "limit": 10}


def test_playbook_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"playbook": {"id": "pb-7", "title": "Onboarding runbook", "code": "onb"}}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/playbooks/pb-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["playbook"]["id"] == "pb-7"
    assert captured["args"] == {"id": "pb-7"}


def test_playbook_detail_by_code(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"playbook": {"id": "pb-x", "code": "onb", "title": "Onboarding"}}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/playbooks/pb-x?code=onb")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["args"] == {"id": "pb-x", "code": "onb"}


def test_playbook_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/automation/playbooks/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_playbooks_run_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"run_id": "run-1", "status": "running"}))

    resp = client.post(
        "/api/plugins/ceodigital/automation/playbooks/pb-1/run",
        json={"subjectType": "deal", "subjectId": "deal-9"},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["run_id"] == "run-1"
    assert captured["tool"] == "playbooks.run"
    assert captured["args"] == {"playbookId": "pb-1", "subjectType": "deal", "subjectId": "deal-9"}


def test_playbooks_run_requires_subject_type(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/automation/playbooks/pb-1/run", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "subject_type_required"}


def test_playbook_runs_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"runs": [
            {"id": "r-1", "playbook_id": "pb-1", "status": "completed"},
            {"id": "r-2", "playbook_id": "pb-1", "status": "running"},
        ]}),
    )

    resp = client.get(
        "/api/plugins/ceodigital/automation/playbooks/runs?playbookId=pb-1&status=completed&subjectType=deal&subjectId=deal-9&limit=5"
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [r["id"] for r in data["runs"]] == ["r-1", "r-2"]
    assert captured["tool"] == "playbook.runs.list"
    assert captured["args"] == {
        "playbookId": "pb-1",
        "status": "completed",
        "subjectType": "deal",
        "subjectId": "deal-9",
        "limit": 5,
    }


def test_playbook_runs_list_not_captured_by_detail(plugin, client, monkeypatch):
    """The literal /automation/playbooks/runs must route to the runs list, not
    be captured as a playbook id by /automation/playbooks/{id}."""
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"runs": []}))

    resp = client.get("/api/plugins/ceodigital/automation/playbooks/runs")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "runs": []}
    assert captured["tool"] == "playbook.runs.list"


# ---------------------------------------------------------------------------
# W4 · Automation — NativeFlow (workflows / runs / webhooks / schedules)
# ---------------------------------------------------------------------------


def test_workflows_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"workflows": [
            {"id": "wf-1", "name": "Onboarding", "status": "active", "trigger_type": "webhook"},
            {"id": "wf-2", "name": "Digest", "status": "draft", "trigger_type": "schedule"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/workflows?status=active&triggerType=webhook&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert [w["id"] for w in data["workflows"]] == ["wf-1", "wf-2"]
    assert captured["tool"] == "agentflow.workflows.list"
    assert captured["args"] == {"status": "active", "triggerType": "webhook", "limit": 5}


def test_workflow_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"workflow": {"id": "wf-7", "name": "Pipeline", "status": "active"}}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/workflows/wf-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workflow"]["id"] == "wf-7"
    assert captured["args"] == {"id": "wf-7"}


def test_workflow_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/automation/workflows/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_workflow_publish_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "wf-1", "status": "active"}))

    resp = client.post("/api/plugins/ceodigital/automation/workflows/wf-1/publish", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "agentflow.workflows.publish"
    assert captured["args"] == {"id": "wf-1"}


def test_workflow_run_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"run_id": "run-9", "status": "running"}))

    resp = client.post(
        "/api/plugins/ceodigital/automation/workflows/wf-1/run",
        json={"input": {"subject_id": "deal-1"}},
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["result"]["run_id"] == "run-9"
    assert captured["tool"] == "agentflow.run"
    assert captured["args"] == {"flowId": "wf-1", "input": {"subject_id": "deal-1"}}


def test_workflow_run_empty_body(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"run_id": "run-0"}))

    resp = client.post("/api/plugins/ceodigital/automation/workflows/wf-1/run", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["args"] == {"flowId": "wf-1"}


def test_workflow_runs_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"runs": [
            {"id": "r-1", "workflow_id": "wf-1", "status": "completed"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/workflows/wf-1/runs?limit=3")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["runs"][0]["id"] == "r-1"
    assert captured["tool"] == "agentflow.runs.list"
    assert captured["args"] == {"workflowId": "wf-1", "limit": 3}


def test_workflow_webhooks_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"webhooks": [
            {"id": "wh-1", "workflow_id": "wf-1", "url": "https://hooks.internal", "is_active": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/workflows/wf-1/webhooks?active=true")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["webhooks"][0]["id"] == "wh-1"
    assert captured["tool"] == "agentflow.webhooks.list"
    assert captured["args"] == {"workflowId": "wf-1", "active": True}


def test_webhook_rotate_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "wh-1", "secret": "rotated"}))

    resp = client.post("/api/plugins/ceodigital/automation/webhooks/wh-1/rotate", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "agentflow.webhooks.rotate"
    assert captured["args"] == {"id": "wh-1"}


def test_workflow_schedules_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"schedules": [
            {"id": "s-1", "workflow_id": "wf-1", "cron_expr": "0 9 * * *", "is_active": True},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/automation/workflows/wf-1/schedules?active=true")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["schedules"][0]["id"] == "s-1"
    assert captured["tool"] == "agentflow.schedules.list"
    assert captured["args"] == {"workflowId": "wf-1", "active": True}


def test_schedule_pause_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "s-1", "paused": True}))

    resp = client.post("/api/plugins/ceodigital/automation/schedules/s-1/pause", json={"paused": True})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "agentflow.schedules.pause"
    assert captured["args"] == {"id": "s-1", "paused": True}


def test_schedule_pause_requires_paused(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/automation/schedules/s-1/pause", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "paused_required"}


def test_automation_mutations_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/automation/workflows", None),
        ("POST", "/automation/workflows/wf-1/publish", {}),
        ("POST", "/automation/playbooks/pb-1/run", {"subjectType": "deal"}),
        ("POST", "/automation/conversations", {"title": "x"}),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body) if body is not None else client.get(f"/api/plugins/ceodigital{route}")
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W5 · Documents & RAG (documents.* / documents.rag.*)
# ---------------------------------------------------------------------------


def test_documents_search_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"results": [
            {"id": "f-1", "title": "Onboarding.pdf", "score": 0.95, "snippet": "How to onboard"},
            {"document_id": "f-2", "filename": "Policy.md", "score": 0.82},
        ]}),
    )

    resp = client.get(
        "/api/plugins/ceodigital/documents/search?query=onboarding&namespaces=tenant/docs,tenant/shared&maxResults=5"
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    results = data["results"]
    assert len(results) == 2
    assert results[0]["title"] == "Onboarding.pdf"
    assert results[1]["id"] == "f-2"  # document_id → id fallback
    assert results[1]["title"] == "Policy.md"  # filename → title fallback
    assert captured["tool"] == "searchDocuments"
    assert captured["args"] == {
        "query": "onboarding",
        "namespaces": ["tenant/docs", "tenant/shared"],
        "maxResults": 5,
    }


def test_documents_search_supports_q_and_comma_namespaces(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"results": []}))

    resp = client.get("/api/plugins/ceodigital/documents/search?q=terms&namespaces=tenant/a,tenant/b&maxResults=15")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "results": []}
    assert captured["args"] == {
        "query": "terms",
        "namespaces": ["tenant/a", "tenant/b"],
        "maxResults": 15,
    }


def test_documents_search_max_results_clamps(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"results": []}))

    resp = client.get("/api/plugins/ceodigital/documents/search?query=x&maxResults=999")

    assert resp.status_code == 200
    assert captured["args"] == {"query": "x", "maxResults": 20}


def test_documents_search_requires_query(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.get("/api/plugins/ceodigital/documents/search")

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "query_required"}


def test_documents_files_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"files": [
            {"id": "f-1", "name": "Onboarding.pdf", "namespace": "tenant/docs", "visibility": "internal", "mimeType": "application/pdf"},
            {"id": "f-2", "name": "Policy.md", "mime_type": "text/markdown", "collectionId": "col-1"},
        ]}),
    )

    resp = client.get(
        "/api/plugins/ceodigital/documents/files?search=onb&collectionId=col-1&namespace=tenant/docs&visibility=internal&limit=5"
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    files = data["files"]
    assert len(files) == 2
    assert files[0]["title"] == "Onboarding.pdf"  # name → title fallback
    assert files[0]["mime_type"] == "application/pdf"  # mimeType → mime_type
    assert files[1]["collection_id"] == "col-1"  # collectionId → collection_id
    assert captured["tool"] == "documents.files.list"
    assert captured["args"] == {
        "search": "onb",
        "collectionId": "col-1",
        "namespace": "tenant/docs",
        "visibility": "internal",
        "limit": 5,
    }


def test_documents_files_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"files": []}))

    resp = client.get("/api/plugins/ceodigital/documents/files")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "files": []}
    assert captured["args"] == {}


def test_documents_file_detail_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"file": {"id": "f-7", "name": "Report.pdf", "namespace": "default"}}),
    )

    resp = client.get("/api/plugins/ceodigital/documents/files/f-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["file"]["id"] == "f-7"
    assert data["file"]["title"] == "Report.pdf"
    assert captured["args"] == {"id": "f-7"}


def test_documents_file_detail_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp({}, {}))

    resp = client.get("/api/plugins/ceodigital/documents/files/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_documents_upload_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "f-new", "name": "notes.md"}))

    resp = client.post(
        "/api/plugins/ceodigital/documents/files/upload",
        json={
            "name": "notes.md",
            "contentBase64": "aGVsbG8=",
            "mimeType": "text/markdown",
            "namespace": "tenant/docs",
            "collectionId": "col-1",
        },
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.files.upload"
    assert captured["args"] == {
        "name": "notes.md",
        "contentBase64": "aGVsbG8=",
        "mimeType": "text/markdown",
        "namespace": "tenant/docs",
        "collectionId": "col-1",
    }


def test_documents_upload_requires_name_and_content(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/documents/files/upload", json={"contentBase64": "aGVsbG8="})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "name_required"}

    resp = client.post("/api/plugins/ceodigital/documents/files/upload", json={"name": "x.md"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "content_base64_required"}


def test_documents_delete_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"deleted": True}))

    resp = client.post("/api/plugins/ceodigital/documents/files/f-1/delete", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.files.delete"
    assert captured["args"] == {"id": "f-1"}


def test_documents_move_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "f-1", "namespace": "tenant/shared"}))

    resp = client.post(
        "/api/plugins/ceodigital/documents/files/f-1/move",
        json={"targetNamespace": "tenant/shared", "targetCollectionId": "col-2"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.files.move"
    assert captured["args"] == {"fileId": "f-1", "targetNamespace": "tenant/shared", "targetCollectionId": "col-2"}


def test_documents_move_without_collection(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "f-1"}))

    resp = client.post("/api/plugins/ceodigital/documents/files/f-1/move", json={"targetNamespace": "other"})

    assert resp.status_code == 200
    assert captured["args"] == {"fileId": "f-1", "targetNamespace": "other"}


def test_documents_collections_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"collections": [
            {"id": "col-1", "name": "Knowledge base", "description": "SOPs", "color": "#ffeecc"},
            {"id": "col-2", "name": "Contracts", "parentId": "col-1"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/documents/collections")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["collections"][0]["title"] == "Knowledge base"  # name → title
    assert data["collections"][0]["color"] == "#ffeecc"
    assert data["collections"][1]["parent_id"] == "col-1"  # parentId → parent_id
    assert captured["tool"] == "documents.collections.list"
    assert captured["args"] == {}


def test_documents_collection_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "col-new", "name": "Policies"}))

    resp = client.post(
        "/api/plugins/ceodigital/documents/collections",
        json={"name": "Policies", "description": "Company policies", "color": "#ccffcc", "icon": "book", "parentId": "col-1"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.collections.create"
    assert captured["args"] == {
        "name": "Policies",
        "description": "Company policies",
        "color": "#ccffcc",
        "icon": "book",
        "parentId": "col-1",
    }


def test_documents_collection_create_requires_name(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/documents/collections", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "name_required"}


def test_documents_collection_add_file_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"added": True}))

    resp = client.post("/api/plugins/ceodigital/documents/collections/col-1/add_file", json={"fileId": "f-9"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.collections.add_file"
    assert captured["args"] == {"collectionId": "col-1", "fileId": "f-9"}


def test_documents_collection_remove_file_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"removed": True}))

    resp = client.post("/api/plugins/ceodigital/documents/collections/col-1/remove_file", json={"fileId": "f-9"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.collections.remove_file"
    assert captured["args"] == {"collectionId": "col-1", "fileId": "f-9"}


def test_documents_collection_file_mutation_requires_file_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/documents/collections/col-1/add_file", json={})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "file_id_required"}

    resp = client.post("/api/plugins/ceodigital/documents/collections/col-1/remove_file", json={})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "file_id_required"}


def test_documents_bindings_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(
        plugin,
        "_mcp_fetch",
        _fake_mcp(captured, {"bindings": [
            {"id": "b-1", "entityType": "project", "entityId": "pr-1", "direction": "output", "bindingId": "bd-1", "ragIndex": True},
            {"id": "b-2", "entityType": "crm_deal", "entityId": "dl-1", "direction": "input", "binding_id": "bd-2"},
        ]}),
    )

    resp = client.get("/api/plugins/ceodigital/documents/bindings?entityType=project&entityId=pr-1&direction=output&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["bindings"][0]["id"] == "b-1"
    assert data["bindings"][0]["bindingId"] == "bd-1"
    assert data["bindings"][1]["id"] == "b-2"
    assert captured["tool"] == "documents.bindings.list"
    assert captured["args"] == {
        "entityType": "project",
        "entityId": "pr-1",
        "direction": "output",
        "limit": 5,
    }


def test_documents_bindings_list_requires_entity(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.get("/api/plugins/ceodigital/documents/bindings?entityId=pr-1")
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "entity_type_required"}

    resp = client.get("/api/plugins/ceodigital/documents/bindings?entityType=project")
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "entity_id_required"}


def test_documents_binding_attach_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"id": "b-new"}))

    resp = client.post(
        "/api/plugins/ceodigital/documents/bindings",
        json={
            "entityType": "project",
            "entityId": "pr-1",
            "direction": "input",
            "bindingId": "bd-1",
            "targetRef": {"file_id": "f-1"},
            "syncMode": "on_demand",
            "publishMode": "on_approve",
            "ragIndex": True,
            "outputFormat": "pdf",
            "nameTemplate": "{{title}}-summary",
        },
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.bindings.attach"
    assert captured["args"] == {
        "entityType": "project",
        "entityId": "pr-1",
        "direction": "input",
        "bindingId": "bd-1",
        "targetRef": {"file_id": "f-1"},
        "syncMode": "on_demand",
        "publishMode": "on_approve",
        "ragIndex": True,
        "outputFormat": "pdf",
        "nameTemplate": "{{title}}-summary",
    }


def test_documents_binding_attach_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    for key in ("entityType", "entityId", "direction", "bindingId"):
        resp = client.post("/api/plugins/ceodigital/documents/bindings", json={"bindingId": "bd-1", "entityType": "project", "entityId": "pr-1", "direction": "input", **{key: ""}})
        assert resp.status_code == 422
        assert resp.json() == {"ok": False, "error": f"{key}_required"}


def test_documents_binding_detach_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"detached": True}))

    resp = client.post("/api/plugins/ceodigital/documents/bindings/b-1/detach", json={})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.bindings.detach"
    assert captured["args"] == {"bindingRowId": "b-1"}


def test_documents_reindex_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    monkeypatch.setattr(plugin, "_mcp_fetch", _fake_mcp(captured, {"reindexed": True, "count": 12}))

    resp = client.post("/api/plugins/ceodigital/documents/reindex", json={"namespace": "tenant/docs", "fullReindex": True})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "documents.rag.reindex"
    assert captured["args"] == {"namespace": "tenant/docs", "fullReindex": True}


def test_documents_reindex_requires_namespace(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/documents/reindex", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "namespace_required"}


def test_documents_mutations_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/documents/files", None),
        ("GET", "/documents/collections", None),
        ("POST", "/documents/files/upload", {"name": "x.md", "contentBase64": "aGVsbG8="}),
        ("POST", "/documents/collections", {"name": "x"}),
        ("POST", "/documents/bindings", {"entityType": "project", "entityId": "pr-1", "direction": "input", "bindingId": "bd-1"}),
        ("POST", "/documents/reindex", {"namespace": "default"}),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body) if body is not None else client.get(f"/api/plugins/ceodigital{route}")
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W6a · Messaging (messaging.*) — threads / messages / reactions / attachments
# ---------------------------------------------------------------------------


def _fake_fetch(plugin, monkeypatch, payload, capture=None):
    """Monkeypatch ``_mcp_fetch`` to return ``payload`` and (optionally) record
    the tool name + arguments into ``capture``."""

    def fake_mcp_fetch(_cfg, tool_name, arguments):
        if capture is not None:
            capture["tool"] = tool_name
            capture["args"] = arguments
        return payload

    monkeypatch.setattr(plugin, "_mcp_fetch", fake_mcp_fetch)


def test_messaging_threads_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"threads": [{"id": "th-1", "subject": "Beta onboarding", "thread_type": "internal"}]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/messaging/threads?threadType=internal&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["threads"][0]["id"] == "th-1"
    assert data["threads"][0]["title"] == "Beta onboarding"
    assert captured["tool"] == "messaging.threads.list"
    assert captured["args"] == {"threadType": "internal", "limit": 5}


def test_messaging_threads_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"threads": []}, captured)

    resp = client.get("/api/plugins/ceodigital/messaging/threads")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "threads": []}
    assert captured["tool"] == "messaging.threads.list"
    assert captured["args"] == {}


def test_messaging_threads_list_by_ref(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"threads": [{"_id": "th-2", "title": "Deal thread"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/messaging/threads?refTable=project&refId=pr-1")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert resp.json()["threads"][0]["id"] == "th-2"
    assert captured["tool"] == "messaging.threads.list_by_ref"
    assert captured["args"] == {"refTable": "project", "refId": "pr-1"}


def test_messaging_threads_list_by_ref_requires_ref_table(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.get("/api/plugins/ceodigital/messaging/threads?refId=pr-1")

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "ref_table_required"}


def test_messaging_thread_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"thread": {"id": "th-1", "subject": "Beta onboarding", "messages": [{"id": "m-1", "body": "hi"}]}},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/messaging/threads/th-1?messageLimit=10")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["thread"]["id"] == "th-1"
    assert len(data["thread"]["messages"]) == 1
    assert captured["tool"] == "messaging.threads.get"
    assert captured["args"] == {"id": "th-1", "messageLimit": 10}


def test_messaging_thread_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"threads": []})

    resp = client.get("/api/plugins/ceodigital/messaging/threads/th-nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_messaging_messages_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"messages": [{"id": "m-1", "body": "hello"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/messaging/threads/th-1/messages?limit=25")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["messages"][0]["id"] == "m-1"
    assert captured["tool"] == "messaging.messages.list"
    assert captured["args"] == {"threadId": "th-1", "limit": 25}


def test_messaging_threads_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"id": "th-new"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/messaging/threads",
        json={"refTable": "deal", "refId": "dl-1", "threadType": "internal", "subject": "Follow up"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "messaging.threads.create"
    assert captured["args"] == {"refTable": "deal", "refId": "dl-1", "threadType": "internal", "subject": "Follow up"}


def test_messaging_messages_post_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"id": "m-9"}, captured)

    resp = client.post("/api/plugins/ceodigital/messaging/threads/th-1/messages", json={"body": "Hello there"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "messaging.messages.post"
    assert captured["args"] == {"threadId": "th-1", "body": "Hello there"}


def test_messaging_messages_post_requires_body(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/messaging/threads/th-1/messages", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "body_required"}


def test_messaging_messages_react_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/messaging/messages/m-1/react", json={"emoji": "👍"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "messaging.messages.react"
    assert captured["args"] == {"messageId": "m-1", "emoji": "👍"}


def test_messaging_messages_react_requires_emoji(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/messaging/messages/m-1/react", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "emoji_required"}


def test_messaging_messages_read_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/messaging/messages/m-1/read")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "messaging.messages.read"
    assert captured["args"] == {"messageId": "m-1"}


def test_messaging_attachments_upload_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"attachment_id": "a-1"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/messaging/messages/m-1/attachments",
        json={"fileId": "f-1", "name": "quote.pdf"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "messaging.attachments.upload"
    assert captured["args"] == {"messageId": "m-1", "fileId": "f-1", "name": "quote.pdf"}


def test_messaging_attachments_upload_requires_file_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/messaging/messages/m-1/attachments", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "file_id_required"}


def test_messaging_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/messaging/threads", None),
        ("GET", "/messaging/threads/th-1", None),
        ("GET", "/messaging/threads/th-1/messages", None),
        ("POST", "/messaging/threads", {"subject": "Hi"}),
        ("POST", "/messaging/threads/th-1/messages", {"body": "Hi"}),
        ("POST", "/messaging/messages/m-1/react", {"emoji": "👍"}),
        ("POST", "/messaging/messages/m-1/read", None),
        ("POST", "/messaging/messages/m-1/attachments", {"fileId": "f-1"}),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W6a · Notifications (notifications.*)
# ---------------------------------------------------------------------------


def test_notifications_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"notifications": [{"id": "n-1", "title": "Payment received", "is_read": False}]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/notifications?unreadOnly=true&limit=20")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["notifications"][0]["id"] == "n-1"
    assert captured["tool"] == "notifications.list"
    assert captured["args"] == {"unreadOnly": True, "limit": 20}


def test_notifications_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"notifications": []}, captured)

    resp = client.get("/api/plugins/ceodigital/notifications")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "notifications": []}
    assert captured["args"] == {}


def test_notifications_unread_count_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"unread_count": 4}, captured)

    resp = client.get("/api/plugins/ceodigital/notifications/unread-count")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "unread_count": 4}
    assert captured["tool"] == "notifications.unread_count"
    assert captured["args"] == {}


def test_notifications_mark_read_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/notifications/n-1/read")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "notifications.mark_read"
    assert captured["args"] == {"id": "n-1"}


def test_notifications_mark_all_read_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/notifications/read-all")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "notifications.mark_all_read"
    assert captured["args"] == {}


def test_notifications_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/notifications", None),
        ("GET", "/notifications/unread-count", None),
        ("POST", "/notifications/n-1/read", None),
        ("POST", "/notifications/read-all", None),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W6a · Timeline (timeline.*) — events, pins, reactions
# ---------------------------------------------------------------------------


def test_timeline_events_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"events": [{"id": "e-1", "event_type": "project.created", "pinned": True}]},
        captured,
    )

    resp = client.get(
        "/api/plugins/ceodigital/timeline/events"
        "?entityType=project&actorUserId=u-1&eventGlob=*.created&from=2026-01-01&to=2026-08-01&limit=10"
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["events"][0]["id"] == "e-1"
    assert captured["tool"] == "timeline.events.list"
    assert captured["args"] == {
        "entityType": "project",
        "actorUserId": "u-1",
        "eventGlob": "*.created",
        "from": "2026-01-01",
        "to": "2026-08-01",
        "limit": 10,
    }


def test_timeline_events_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"events": []}, captured)

    resp = client.get("/api/plugins/ceodigital/timeline/events")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "events": []}
    assert captured["args"] == {}


def test_timeline_event_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"event": {"id": "e-1", "summary": "Phase 1 kicked off"}}, captured)

    resp = client.get("/api/plugins/ceodigital/timeline/events/e-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["event"]["id"] == "e-1"
    assert data["event"]["title"] == "Phase 1 kicked off"
    assert captured["tool"] == "timeline.events.get"
    assert captured["args"] == {"id": "e-1"}


def test_timeline_event_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"events": []})

    resp = client.get("/api/plugins/ceodigital/timeline/events/e-nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_timeline_event_pin_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/timeline/events/e-1/pin")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "timeline.pins.add"
    assert captured["args"] == {"event_id": "e-1"}


def test_timeline_event_unpin_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/timeline/events/e-1/unpin")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "timeline.pins.remove"
    assert captured["args"] == {"event_id": "e-1"}


def test_timeline_reactions_add_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/timeline/events/e-1/reactions", json={"reaction_type": "like"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "timeline.reactions.add"
    assert captured["args"] == {"event_id": "e-1", "reaction_type": "like"}


def test_timeline_reactions_remove_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/timeline/events/e-1/reactions/remove", json={"reaction_type": "like"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "timeline.reactions.remove"
    assert captured["args"] == {"event_id": "e-1", "reaction_type": "like"}


def test_timeline_reactions_requires_reaction_type(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/timeline/events/e-1/reactions", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "reaction_type_required"}


def test_timeline_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/timeline/events", None),
        ("GET", "/timeline/events/e-1", None),
        ("POST", "/timeline/events/e-1/pin", None),
        ("POST", "/timeline/events/e-1/unpin", None),
        ("POST", "/timeline/events/e-1/reactions", {"reaction_type": "like"}),
        ("POST", "/timeline/events/e-1/reactions/remove", {"reaction_type": "like"}),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W6a · Implementations (implementations.*) — projects / phases / files / messages
# ---------------------------------------------------------------------------


def test_implementations_projects_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"projects": [{"id": "p-1", "name": "Website relaunch", "status": "in_progress"}]},
        captured,
    )

    resp = client.get(
        "/api/plugins/ceodigital/implementations/projects?status=in_progress&search=web&clientVisible=true&limit=5"
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["projects"][0]["id"] == "p-1"
    assert data["projects"][0]["title"] == "Website relaunch"
    assert captured["tool"] == "implementations.projects.list"
    assert captured["args"] == {"status": "in_progress", "search": "web", "clientVisible": True, "limit": 5}


def test_implementations_projects_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"projects": []}, captured)

    resp = client.get("/api/plugins/ceodigital/implementations/projects")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "projects": []}
    assert captured["args"] == {}


def test_implementation_project_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"project": {"id": "p-1", "title": "Website relaunch", "status": "planned"}}, captured)

    resp = client.get("/api/plugins/ceodigital/implementations/projects/p-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["project"]["id"] == "p-1"
    assert captured["tool"] == "implementations.projects.get"
    assert captured["args"] == {"id": "p-1"}


def test_implementation_project_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"projects": []})

    resp = client.get("/api/plugins/ceodigital/implementations/projects/p-nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_implementation_phases_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"phases": [{"id": "ph-1", "name": "Design", "status": "done"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/implementations/projects/p-1/phases?status=done")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["phases"][0]["id"] == "ph-1"
    assert data["phases"][0]["title"] == "Design"
    assert captured["tool"] == "implementations.phases.list"
    assert captured["args"] == {"projectId": "p-1", "status": "done"}


def test_implementation_change_status_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/status", json={"status": "delivered"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "implementations.projects.change_status"
    assert captured["args"] == {"id": "p-1", "status": "delivered"}


def test_implementation_change_status_requires_status(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/status", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "status_required"}


def test_implementation_complete_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/complete")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "implementations.projects.complete"
    assert captured["args"] == {"id": "p-1"}


def test_implementation_cancel_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/cancel")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "implementations.projects.cancel"
    assert captured["args"] == {"id": "p-1"}


def test_implementation_phase_change_status_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/implementations/phases/ph-1/status", json={"status": "in_progress"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "implementations.phases.change_status"
    assert captured["args"] == {"id": "ph-1", "status": "in_progress"}


def test_implementation_files_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"files": [{"id": "f-1", "name": "scope.md"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/implementations/projects/p-1/files?limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["files"][0]["id"] == "f-1"
    assert data["files"][0]["title"] == "scope.md"
    assert captured["tool"] == "implementations.files.list"
    assert captured["args"] == {"projectId": "p-1", "limit": 5}


def test_implementation_messages_post_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/messages", json={"body": "Kicking off"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "implementations.messages.post"
    assert captured["args"] == {"projectId": "p-1", "body": "Kicking off"}


def test_implementation_messages_post_requires_body(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/implementations/projects/p-1/messages", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "body_required"}


def test_implementations_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/implementations/projects", None),
        ("GET", "/implementations/projects/p-1", None),
        ("GET", "/implementations/projects/p-1/phases", None),
        ("POST", "/implementations/projects/p-1/status", {"status": "delivered"}),
        ("POST", "/implementations/projects/p-1/complete", None),
        ("POST", "/implementations/projects/p-1/cancel", None),
        ("POST", "/implementations/phases/ph-1/status", {"status": "done"}),
        ("GET", "/implementations/projects/p-1/files", None),
        ("POST", "/implementations/projects/p-1/messages", {"body": "Hi"}),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}


# ---------------------------------------------------------------------------
# W6b · Workspaces (workspaces.*)
# ---------------------------------------------------------------------------


def test_workspaces_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"workspaces": [
            {"id": "ws-1", "name": "Ops", "category_id": "c-1", "archived": False},
            {"id": "ws-2", "title": "Backoffice", "archived": True},
        ]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/workspaces?archived=true&categoryId=c-1&search=ops&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workspaces"][0]["id"] == "ws-1"
    assert data["workspaces"][0]["title"] == "Ops"  # name → title
    assert data["workspaces"][1]["title"] == "Backoffice"
    assert captured["tool"] == "workspaces.list"
    assert captured["args"] == {"archived": True, "categoryId": "c-1", "search": "ops", "limit": 5}


def test_workspaces_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"workspaces": []}, captured)

    resp = client.get("/api/plugins/ceodigital/workspaces")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "workspaces": []}
    assert captured["args"] == {}


def test_workspace_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"workspace": {"id": "ws-7", "name": "Project X"}}, captured)

    resp = client.get("/api/plugins/ceodigital/workspaces/ws-7")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["workspace"]["id"] == "ws-7"
    assert data["workspace"]["title"] == "Project X"
    assert captured["tool"] == "workspaces.get"
    assert captured["args"] == {"id": "ws-7"}


def test_workspace_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"workspaces": []})

    resp = client.get("/api/plugins/ceodigital/workspaces/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_workspace_members_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"members": [{"id": "u-1", "member_id": "u-1", "role": "lead"}, {"id": "u-2", "role": "viewer"}]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/workspaces/ws-1/members")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["members"][0]["id"] == "u-1"
    assert data["members"][0]["role"] == "lead"
    assert captured["tool"] == "workspaces.members.list"
    assert captured["args"] == {"workspaceId": "ws-1"}


def test_workspace_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"id": "ws-new", "name": "Growth"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/workspaces",
        json={"name": "Growth", "description": "Go-to-market", "categoryId": "c-2", "icon": "rocket", "color": "#123456"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workspaces.create"
    assert captured["args"] == {
        "name": "Growth",
        "description": "Go-to-market",
        "categoryId": "c-2",
        "icon": "rocket",
        "color": "#123456",
    }


def test_workspace_create_requires_name(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/workspaces", json={"description": "no name"})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "name_required"}


def test_workspace_member_add_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"added": True}, captured)

    resp = client.post("/api/plugins/ceodigital/workspaces/ws-1/members", json={"userId": "u-9", "role": "member"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workspaces.members.add"
    assert captured["args"] == {"workspaceId": "ws-1", "userId": "u-9", "role": "member"}


def test_workspace_member_add_requires_user_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/workspaces/ws-1/members", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "user_id_required"}


def test_workspace_member_remove_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"removed": True}, captured)

    resp = client.post("/api/plugins/ceodigital/workspaces/ws-1/members/u-9/remove")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "workspaces.members.remove"
    assert captured["args"] == {"workspaceId": "ws-1", "memberId": "u-9"}


# ---------------------------------------------------------------------------
# W6b · Departments (departments.*)
# ---------------------------------------------------------------------------


def test_departments_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"departments": [
            {"id": "dp-1", "name": "Engineering", "slugKey": "eng", "is_active": True},
            {"id": "dp-2", "name": "Sales", "slug_key": "sales"},
        ]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/departments?activeOnly=true&search=eng&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["departments"][0]["id"] == "dp-1"
    assert data["departments"][0]["title"] == "Engineering"
    assert data["departments"][0]["slug_key"] == "eng"
    assert data["departments"][1]["slug_key"] == "sales"
    assert captured["tool"] == "departments.list"
    assert captured["args"] == {"activeOnly": True, "search": "eng", "limit": 5}


def test_departments_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"departments": []}, captured)

    resp = client.get("/api/plugins/ceodigital/departments")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "departments": []}
    assert captured["args"] == {}


def test_department_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"department": {"id": "dp-1", "name": "Finance"}}, captured)

    resp = client.get("/api/plugins/ceodigital/departments/dp-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["department"]["id"] == "dp-1"
    assert data["department"]["title"] == "Finance"
    assert captured["args"] == {"id": "dp-1"}


def test_department_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"departments": []})

    resp = client.get("/api/plugins/ceodigital/departments/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_department_members_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"members": [{"id": "u-1", "role": "head"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/departments/dp-1/members")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["members"][0]["id"] == "u-1"
    assert data["members"][0]["role"] == "head"
    assert captured["tool"] == "departments.members.list"
    assert captured["args"] == {"departmentId": "dp-1"}


def test_department_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"id": "dp-new"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/departments",
        json={"name": "Marketing", "slugKey": "mkt", "areas": ["brand", "content"], "headId": "u-1"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "departments.create"
    assert captured["args"] == {
        "name": "Marketing",
        "slugKey": "mkt",
        "areas": ["brand", "content"],
        "headId": "u-1",
    }


def test_department_create_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/departments", json={"slugKey": "x"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "name_required"}

    resp = client.post("/api/plugins/ceodigital/departments", json={"name": "Legal"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "slug_key_required"}


def test_department_member_add_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"added": True}, captured)

    resp = client.post("/api/plugins/ceodigital/departments/dp-1/members", json={"userId": "u-5", "role": "member"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "departments.members.add"
    assert captured["args"] == {"departmentId": "dp-1", "userId": "u-5", "role": "member"}


def test_department_member_add_requires_user_id(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/departments/dp-1/members", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "user_id_required"}


def test_department_member_remove_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"removed": True}, captured)

    resp = client.post("/api/plugins/ceodigital/departments/dp-1/members/u-5/remove")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "departments.members.remove"
    assert captured["args"] == {"departmentId": "dp-1", "userId": "u-5"}


# ---------------------------------------------------------------------------
# W6b · Members (members.*)
# ---------------------------------------------------------------------------


def test_members_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"members": [
            {"id": "u-1", "name": "Ana", "role": "owner", "email": "ana@x.pt"},
            {"id": "u-2", "full_name": "Joao", "role": "member"},
        ]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/members?role=member&limit=10")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["members"][0]["id"] == "u-1"
    assert data["members"][0]["title"] == "Ana"
    assert data["members"][1]["title"] == "Joao"  # full_name → title
    assert captured["tool"] == "members.list"
    assert captured["args"] == {"role": "member", "limit": 10}


def test_members_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"members": []}, captured)

    resp = client.get("/api/plugins/ceodigital/members")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "members": []}
    assert captured["args"] == {}


def test_member_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"member": {"id": "u-1", "name": "Ana", "role": "owner"}}, captured)

    resp = client.get("/api/plugins/ceodigital/members/u-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["member"]["id"] == "u-1"
    assert captured["tool"] == "members.get"
    assert captured["args"] == {"userId": "u-1"}


def test_member_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"members": []})

    resp = client.get("/api/plugins/ceodigital/members/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_members_invite_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"invited": True}, captured)

    resp = client.post("/api/plugins/ceodigital/members/invite", json={"email": "new@x.pt", "role": "member"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "members.invite"
    assert captured["args"] == {"email": "new@x.pt", "role": "member"}


def test_members_invite_routes_to_invite_not_member_id(plugin, client, monkeypatch):
    """POST /members/invite must hit members.invite (not be captured as a
    member id on another route)."""
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"invited": True}, captured)

    resp = client.post("/api/plugins/ceodigital/members/invite", json={"email": "a@x.pt"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "members.invite"
    assert captured["args"] == {"email": "a@x.pt"}


def test_members_invite_requires_email(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/members/invite", json={"role": "member"})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "email_required"}


def test_member_revoke_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"revoked": True}, captured)

    resp = client.post("/api/plugins/ceodigital/members/u-1/revoke")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "members.revoke"
    assert captured["args"] == {"userId": "u-1"}


def test_member_update_role_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"role": "admin"}, captured)

    resp = client.post("/api/plugins/ceodigital/members/u-1/role", json={"role": "admin"})

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "members.update_role"
    assert captured["args"] == {"userId": "u-1", "role": "admin"}


def test_member_update_role_requires_role(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/members/u-1/role", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "role_required"}


# ---------------------------------------------------------------------------
# W6b · Integrations (integrations.*)
# ---------------------------------------------------------------------------


def test_integrations_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"integrations": [
            {"id": "it-1", "providerCode": "gmail", "appSlug": "gmail", "status": "active", "scope": "user"},
            {"id": "it-2", "provider_code": "slack", "app_slug": "slack", "status": "pending", "scope": "tenant"},
        ]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/integrations?providerCode=gmail&status=active&scope=user&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["integrations"][0]["id"] == "it-1"
    assert data["integrations"][0]["provider_code"] == "gmail"  # providerCode → provider_code
    assert data["integrations"][0]["app_slug"] == "gmail"
    assert data["integrations"][1]["provider_code"] == "slack"
    assert captured["tool"] == "integrations.list"
    assert captured["args"] == {"providerCode": "gmail", "status": "active", "scope": "user", "limit": 5}


def test_integrations_list_no_filters(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"integrations": []}, captured)

    resp = client.get("/api/plugins/ceodigital/integrations")

    assert resp.status_code == 200
    assert resp.json() == {"ok": True, "integrations": []}
    assert captured["args"] == {}


def test_integration_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"integration": {"id": "it-1", "providerCode": "gmail"}}, captured)

    resp = client.get("/api/plugins/ceodigital/integrations/it-1")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["integration"]["id"] == "it-1"
    assert data["integration"]["provider_code"] == "gmail"
    assert captured["args"] == {"id": "it-1"}


def test_integration_get_unknown_returns_not_found(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    _fake_fetch(plugin, monkeypatch, {"integrations": []})

    resp = client.get("/api/plugins/ceodigital/integrations/nope")

    assert resp.status_code == 404
    assert resp.json() == {"ok": False, "error": "not_found"}


def test_integration_test_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"status": "active"}, captured)

    resp = client.post("/api/plugins/ceodigital/integrations/it-1/test")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "integrations.test"
    assert captured["args"] == {"id": "it-1"}


def test_integration_connect_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"id": "it-new"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/integrations",
        json={
            "providerCode": "gmail",
            "appSlug": "gmail",
            "scope": "user",
            "mailboxKey": "work",
            "mailboxLabel": "Work inbox",
            "metadata": {"label": "x"},
        },
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "integrations.connect"
    assert captured["args"] == {
        "providerCode": "gmail",
        "appSlug": "gmail",
        "scope": "user",
        "mailboxKey": "work",
        "mailboxLabel": "Work inbox",
        "metadata": {"label": "x"},
    }


def test_integration_connect_requires_fields(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/integrations", json={"appSlug": "gmail"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "provider_code_required"}

    resp = client.post("/api/plugins/ceodigital/integrations", json={"providerCode": "gmail"})
    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "app_slug_required"}


def test_integration_disconnect_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"disconnected": True}, captured)

    resp = client.post("/api/plugins/ceodigital/integrations/it-1/disconnect")

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "integrations.disconnect"
    assert captured["args"] == {"id": "it-1"}


def test_w6b_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/workspaces", None),
        ("GET", "/workspaces/ws-1", None),
        ("GET", "/workspaces/ws-1/members", None),
        ("POST", "/workspaces", {"name": "ops"}),
        ("POST", "/workspaces/ws-1/members", {"userId": "u-1"}),
        ("POST", "/workspaces/ws-1/members/u-1/remove", None),
        ("GET", "/departments", None),
        ("GET", "/departments/dp-1", None),
        ("GET", "/departments/dp-1/members", None),
        ("POST", "/departments", {"name": "eng", "slugKey": "eng"}),
        ("POST", "/departments/dp-1/members", {"userId": "u-1"}),
        ("POST", "/departments/dp-1/members/u-1/remove", None),
        ("GET", "/members", None),
        ("GET", "/members/u-1", None),
        ("POST", "/members/invite", {"email": "a@x.pt"}),
        ("POST", "/members/u-1/revoke", None),
        ("POST", "/members/u-1/role", {"role": "admin"}),
        ("GET", "/integrations", None),
        ("GET", "/integrations/it-1", None),
        ("POST", "/integrations/it-1/test", None),
        ("POST", "/integrations", {"providerCode": "gmail", "appSlug": "gmail"}),
        ("POST", "/integrations/it-1/disconnect", None),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}
# ────────────────────────────────────────────────────────────────────────────
# W7 — Commerce / Payments + Governance
# ────────────────────────────────────────────────────────────────────────────

def test_orders_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(
        plugin, monkeypatch,
        {"orders": [{"id": "o-1", "status": "confirmed", "total": "120.00"}]},
        captured,
    )

    resp = client.get("/api/plugins/ceodigital/commerce/orders?status=confirmed&limit=5")

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["orders"][0]["id"] == "o-1"
    assert captured["tool"] == "orders.list"
    assert captured["args"] == {"status": "confirmed", "limit": 5}


def test_orders_list_search_capped(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"orders": []}, captured)

    long = "x" * 300
    resp = client.get(f"/api/plugins/ceodigital/commerce/orders?search={long}")

    assert resp.status_code == 200
    assert captured["args"]["search"] == "x" * 200


def test_order_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"order": {"id": "o-1", "status": "paid"}}, captured)

    resp = client.get("/api/plugins/ceodigital/commerce/orders/o-1")

    assert resp.status_code == 200
    assert resp.json()["order"]["id"] == "o-1"
    assert captured["tool"] == "orders.get"
    assert captured["args"] == {"id": "o-1"}


def test_order_update_status_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/commerce/orders/o-1/status",
        json={"status": "shipped"},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "orders.update_status"
    assert captured["args"] == {"id": "o-1", "status": "shipped"}


def test_order_update_status_requires_field(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/commerce/orders/o-1/status", json={})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "status_required"}


def test_payments_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"payments": [{"id": "pay-1", "status": "paid"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/commerce/payments?status=paid")

    assert resp.status_code == 200
    assert resp.json()["payments"][0]["id"] == "pay-1"
    assert captured["tool"] == "payments.list"
    assert captured["args"] == {"status": "paid"}


def test_payment_get_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"payment": {"id": "pay-1"}}, captured)

    resp = client.get("/api/plugins/ceodigital/commerce/payments/pay-1")

    assert resp.status_code == 200
    assert resp.json()["payment"]["id"] == "pay-1"
    assert captured["tool"] == "payments.get"
    assert captured["args"] == {"id": "pay-1"}


def test_payment_link_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True, "url": "https://pay/link-1"}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/commerce/payment-links",
        json={"orderId": "o-1", "customerEmail": "a@b.c", "amountCents": 1000},
    )

    assert resp.status_code == 200
    assert resp.json()["ok"] is True
    assert captured["tool"] == "payments.links.create"
    assert captured["args"]["orderId"] == "o-1"
    assert captured["args"]["amountCents"] == 1000


def test_payment_link_cancel_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/commerce/payment-links/l-1/cancel",
        json={"reason": "changed mind"},
    )

    assert resp.status_code == 200
    assert captured["tool"] == "payments.links.cancel"
    assert captured["args"] == {"id": "l-1", "reason": "changed mind"}


def test_governance_dsr_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"requests": [{"id": "r-1", "status": "pending"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/governance/dsr?status=pending&requestType=export")

    assert resp.status_code == 200
    assert resp.json()["requests"][0]["id"] == "r-1"
    assert captured["tool"] == "governance.dsr.list"
    assert captured["args"] == {"status": "pending", "requestType": "export"}


def test_governance_dsr_create_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True, "request": {"id": "r-1"}}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/governance/dsr",
        json={"userId": "u-1", "requestType": "deletion"},
    )

    assert resp.status_code == 200
    assert captured["tool"] == "governance.dsr.create"
    assert captured["args"] == {"userId": "u-1", "requestType": "deletion"}


def test_governance_dsr_create_invalid_type(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))

    resp = client.post("/api/plugins/ceodigital/governance/dsr", json={"userId": "u-1", "requestType": "bogus"})

    assert resp.status_code == 422
    assert resp.json() == {"ok": False, "error": "invalid_request_type"}


def test_governance_dsr_route_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True}, captured)

    resp = client.post("/api/plugins/ceodigital/governance/dsr/r-1/route", json={"processedBy": "u-2"})

    assert resp.status_code == 200
    assert captured["tool"] == "governance.dsr.route"
    assert captured["args"] == {"id": "r-1", "processedBy": "u-2"}


def test_governance_consents_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"consents": [{"id": "c-1"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/governance/consents?userId=u-1")

    assert resp.status_code == 200
    assert resp.json()["consents"][0]["id"] == "c-1"
    assert captured["tool"] == "governance.consents.list"
    assert captured["args"] == {"userId": "u-1"}


def test_governance_consents_record_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"ok": True, "consent": {"id": "c-1"}}, captured)

    resp = client.post(
        "/api/plugins/ceodigital/governance/consents",
        json={"userId": "u-1", "termsVersion": "v1"},
    )

    assert resp.status_code == 200
    assert captured["tool"] == "governance.consents.record"
    assert captured["args"] == {"userId": "u-1", "termsVersion": "v1"}


def test_governance_processing_records_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"records": [{"id": "pr-1"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/governance/processing-records?isActive=true")

    assert resp.status_code == 200
    assert resp.json()["records"][0]["id"] == "pr-1"
    assert captured["tool"] == "governance.processing_records.list"
    assert captured["args"] == {"isActive": True}


def test_governance_retention_list_success(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: dict(_OK_CONFIG))
    captured = {}
    _fake_fetch(plugin, monkeypatch, {"policies": [{"id": "rt-1"}]}, captured)

    resp = client.get("/api/plugins/ceodigital/governance/retention?entity=orders")

    assert resp.status_code == 200
    assert resp.json()["policies"][0]["id"] == "rt-1"
    assert captured["tool"] == "governance.retention.list"
    assert captured["args"] == {"entity": "orders"}


def test_w7_not_configured(plugin, client, monkeypatch):
    monkeypatch.setattr(plugin, "_load_config", lambda: {**dict(_OK_CONFIG), "mcp_token": ""})

    for method, route, body in (
        ("GET", "/commerce/orders", None),
        ("GET", "/commerce/orders/o-1", None),
        ("POST", "/commerce/orders/o-1/status", {"status": "shipped"}),
        ("GET", "/commerce/payments", None),
        ("GET", "/commerce/payments/pay-1", None),
        ("POST", "/commerce/payment-links", {"orderId": "o-1"}),
        ("POST", "/commerce/payment-links/l-1/cancel", {"reason": "x"}),
        ("GET", "/governance/dsr", None),
        ("POST", "/governance/dsr", {"userId": "u-1", "requestType": "export"}),
        ("POST", "/governance/dsr/r-1/route", {"processedBy": "u-2"}),
        ("GET", "/governance/consents", None),
        ("POST", "/governance/consents", {"userId": "u-1"}),
        ("GET", "/governance/processing-records", None),
        ("GET", "/governance/retention", None),
    ):
        resp = client.request(method, f"/api/plugins/ceodigital{route}", json=body)
        assert resp.status_code == 503
        assert resp.json() == {"ok": False, "error": "mcp_not_configured"}
