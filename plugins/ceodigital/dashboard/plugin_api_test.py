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