"""``hermes serve key`` — print or generate the headless API server key.

Fase 1 of making ``hermes serve`` consumable by the CEODigital Go connector
bundle: this command resolves (or, on first use, mints) the profile's
``API_SERVER_KEY``—the Bearer credential the bundle installer needs to talk
to the headless server—and prints it for capture.

Contract:
- The key is read/persisted ONLY through the repo's canonical credential
  lifecycle (``agent.secret_scope.get_secret`` /
  ``hermes_cli.config.save_env_value_secure``). Nothing is hand-rolled here.
- stdout carries ONLY the machine-readable payload (the key — optionally
  prefixed with a label or paired with the expected bind line, or wrapped in
  JSON). Scripts can do ``$(hermes serve key)`` safely.
- Everything human-facing — the ``(generated new)`` notice and the
  share-with-the-connector note — goes to stderr. The key never touches the
  logs: this module performs no ``logger.*`` calls at all.
"""

from __future__ import annotations

import json
import secrets
import sys

# Expected default bind for the headless API server. The ``API_SERVER_KEY``
# this command mints authenticates the gateway ``api_server`` platform — which
# exposes ``/v1/runs`` on ``API_SERVER_PORT`` (default 8642) — NOT the
# ``hermes serve`` web-ui port (9119). Must match the connector bundle's
# ``CONNECTOR_SERVE_URL`` default (http://127.0.0.1:8642). See ADR-0032.
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8642

# 16 chars is well below any generated token; only a deliberately-strong
# pre-existing key counts as usable.
_MIN_KEY_LENGTH = 16


def _load_key() -> str:
    """Resolve the active profile's API_SERVER_KEY (empty string when absent)."""
    from agent.secret_scope import get_secret

    return get_secret("API_SERVER_KEY", "") or ""


def _persist_key(key: str) -> None:
    """Persist the key through the unified secure credential lifecycle."""
    from hermes_cli.config import save_env_value_secure

    save_env_value_secure("API_SERVER_KEY", key)


def cmd_serve_key(args) -> None:
    """Print (or generate and print) the headless API server key.

    ``hermes serve key`` prints whatever strong key exists; if none does, it
    mints one, persists it, and prints it. ``--generate`` always mints a
    fresh key (rotating any existing one). The key value is printed to
    stdout only — it is never logged.
    """
    from hermes_cli.auth import has_usable_secret

    existing = _load_key()
    generate = bool(getattr(args, "generate", False))

    if generate or not has_usable_secret(existing, min_length=_MIN_KEY_LENGTH):
        key = secrets.token_urlsafe(32)
        _persist_key(key)
        generated_new = True
    else:
        key = existing
        generated_new = False

    if getattr(args, "json", False):
        host = getattr(args, "host", DEFAULT_HOST) or DEFAULT_HOST
        print(
            json.dumps(
                {
                    "api_server_key": key,
                    "host": host,
                    "port": DEFAULT_PORT,
                }
            )
        )
    else:
        if getattr(args, "show_port", False):
            host = getattr(args, "host", DEFAULT_HOST) or DEFAULT_HOST
            print(f"{host}:{DEFAULT_PORT}")
        label = getattr(args, "label", "") or ""
        if label:
            print(f"{label}: {key}")
        else:
            print(key)

    if generated_new:
        print("(generated new)", file=sys.stderr)

    # Human-facing note only (stderr) — never includes the key value.
    from hermes_constants import display_hermes_home

    host = getattr(args, "host", DEFAULT_HOST) or DEFAULT_HOST
    print(
        f"# Share this key with the CEODigital connector bundle: it authenticates "
        f"to the headless API server via CONNECTOR_SERVE_URL (http://{host}:"
        f"{DEFAULT_PORT}) using Bearer auth. Stored in "
        f"{display_hermes_home()}/.env as API_SERVER_KEY.",
        file=sys.stderr,
    )