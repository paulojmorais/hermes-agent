# CEODigital Fork — Ownership Surface Map

> **Fork:** `paulojmorais/hermes-agent` · **Branch:** `ceodigital-branding`
> **Upstream:** `NousResearch/hermes-agent` · **Maintained by:** CEODigital
> **Last updated:** 2026-08-15

---

## 1. Purpose

This document defines the **file-level ownership boundaries** between the
CEODigital branded fork and upstream NousResearch/hermes-agent. It answers:

- Which files do **we own** (can freely modify, add, diverge)?
- Which files do **we track** from upstream (only branding strings change)?
- How do we **manage the boundary** during merges?

---

## 2. Core Principle

> **We own our surfaces; we rent the upstream engine.**

Our differentiated value — auth, translations (pt-pt, fr, es, de), branding,
CEODigital-specific features — lives in **additive files upstream doesn't
touch**. The engine core stays mergeable so we can pull bug fixes, security
patches, and new model support **on demand**.

---

## 3. The Two Roles of the Fork

| Role | Surface | Governed by | Upstream sync impact |
|---|---|---|---|
| **Engine** (`hermes run` headless) | agent loop, tools, gateway, terminal, TUI | Connector-v2 daemon (capability dispatcher) | Must stay syncable — core files untouched |
| **Branded Desktop App** (Direction A MCP consumer + plugin host) | Electron app, skin, identity, service messages, **CEODigital UI panels** | CEODigital (branding choices + desktop plugins) | ~8 branded files + additive plugin dirs, low conflict |

Auth, translations, and branded UI apply **only to the Desktop App role**. The
headless engine doesn't need them — it is provisioned per-run by the daemon
via env (`HERMES_TENANT_MODELS`, `HERMES_CEO_AGENTS`, skills, isolated home).

### 3.1 Data flow: how the Desktop App accesses CEODigital

```
┌──────────── Hermes Desktop ─────────────────────┐
│  ┌────────────────┐   ┌──────────────────────┐   │
│  │ Sidebar nav    │   │ CEODigital Panel     │   │
│  │  Chat          │   │ (desktop plugin)     │   │
│  │  Files         │   │  ┌────────────────┐  │   │
│  │  Terminal      │   │  │ Projects list  │  │   │
│  │ ● CEODigital   │   │  │ Agent catalog  │  │   │
│  │    Projects    │   │  │ Leads/CRM      │  │   │
│  │    Leads       │   │  └────────────────┘  │   │
│  │    Agents      │   │                      │   │
│  └────────────────┘   └──────────────────────┘   │
│                │           ▲                      │
│                │           │ MCP / REST           │
│                ▼           │                      │
│           ┌─────────────────┐                     │
│           │  MCP client     │                     │
│           │  (114 tools)    │                     │
│           └────────┬────────┘                     │
└────────────────────┼─────────────────────────────┘
                     │ HTTPS
                     ▼
            ┌─────────────────┐
            │  CEODigital     │
            │  (cloud)        │
            └─────────────────┘
```

Two mechanisms:

- **Desktop plugins** (@hermes/plugin-sdk) — native React UI panels registered
  by a plugin directory under `src/plugins/`. Auto-discovered, no core edits.
  Registers routes, sidebar nav, statusbar widgets, command palette, keybinds,
  i18n, REST API. See §4.2 Layer 2.

- **MCP client (Direction A, F0)** — data transport from plugins to CEODigital.
  Each plugin panel consumes MCP tools (`workitems_list`, `crm_leads_list`,
  `services_catalog_list`, etc.) or calls REST. Already functional with 114 tools.

### 3.2 Integrations — reuse CEODigital's existing integration system (Composio)

The Hermes agent does NOT need its own integration stack. It reuses the
CEODigital integration layer over MCP, because `resolveTools()` is the **single
exit point** of the Integrations module (`src/integrations/.../resolveTools.server.ts`)
consumed by Chat, AgentFlow, Skills, **and** the MCP endpoint
(`/api/public/mcp/{slug}`).

```
Hermes (desktop / agent)
   └─ MCP /api/public/mcp/{slug}     (one endpoint → full ToolRegistry, ~114 tools)
        └─ buildPlatformMcpToolRegistry → resolveTools(ctx, actor)
             └─ active providers by priority
                  ├─ Composio.adapter (ADR-0017)  → int.gmail.*, int.outlook.*, int.googledocs.*
                  ├─ Nango.adapter
                  └─ HTTP / other providers
```

Rules that matter for the fork:

- **One path, no parallel.** The desktop plugins and the agent must consume
  CE tools **through MCP → resolveTools()** — never by importing a second
  Composio/Nango account or a parallel credentials store. Duplicating the
  integration pipeline is the one thing we must not do.
- **Sharing & scope are already enforced** (`INT-SHARE-1`): a connection
  `scope='user'` is only visible to its owner; `scope='tenant'` respects
  `allowed_roles` / `allowed_user_ids`. As a result the Hermes sees **exactly
  the integrations that user/tenant already authorised in CEODigital** — no
  own Composio account, no new OAuth, no duplication.
- **Fail-open**: an adapter error is logged and the rest proceed; `resolveTools`
  never throws to the caller.

**Rule for this fork:** never add a second integration layer. Projects / Leads /
Agents desktop plugins call CE tools via MCP → `resolveTools()`.

### 3.3 LLM credentials & billing — two supported models

CEODigital already supports **both** credential models the product needs. The
choice is per-run/per-session, never hardcoded.

**Model A — Reseller / metered (user uses our credentials, pays us, we pay the
provider).** Used for ALL governed runs (connector-v2 agent capability).

- Device never holds a real provider key. The `model` block in the run payload
  is `{ provider, model, apiKey: "ceod_…" (ephemeral, 24h TTL), baseUrl: "…/llm-billing-proxy" }`.
- The billing proxy authenticates the ephemeral key, resolves the real provider
  key internally, streams, and records `cost_billed_eur` (charged to tenant) vs
  `cost_provider_eur` (what the provider charges CE).
- Tables: `platform.ai_models` (catalog + prices, `provider` free string),
  `platform.tenant_ai_wallet` (balance, topups), `platform.ai_usage`
  (cost_billed vs cost_provider per request). Tools:
  `platform.ai.models.*`, `platform.ai.wallets.*`, `platform.ai.usage.list`.

**Model B — BYOK (bring your own key).**
User supplies their own provider key (e.g. their OpenRouter key). They pay the
provider directly; CE didn't bill.

- Provider keys live in the vault/`secure_secrets` / admin credentials
  (`getPlatformCredential`). Router uses the user's key without a billing relay.
- Currently: `getPlatformCredential` registers per-provider keys; the direct
  BYOK routing decision in the Hermes desktop still needs a small, explicit
  rule (see below).

**Which one the Hermes picks (proposed rule, matches `runner.go` "billing-proxy
fallback"):**

- If the tenant heartbeat / `HERMES_TENANT_MODELS` returns a
  `billing_proxy_url` + `billing_api_key` → **Model A (reseller)**. Runs
  governed through connector-v2 always take this path.
- Otherwise → **Model B (BYOK)** — the user may plug their own key directly in
  the Hermes config. Fine for the personal/direct desktop use.

**Provider openness:** `ai_models.provider` is a free string, and the runner's
`envVarForProvider` already handles `openrouter`, `anthropic`, `openai`,
`google/gemini`, `deepseek`, `xai/grok`, `groq`, `ollama`, `custom`. Adding a
new provider (e.g. Vercel AI) = one catalog row + an adapter in `resolveTools`
(if tool-gated) + a key resolver — no architecture change.

---

## 4. File Ownership Map

### Layer 0 — Upstream Core (NO edits, NO divergence)

These files are the **engine**. We accept upstream on every merge. If we need
a change, we do it via: config override, plugin, MCP server, or a **new
additive file** — never by editing these paths.

```
run_agent.py                  # AIAgent core loop
cli.py                        # CLI orchestrator
model_tools.py                # Tool orchestration
toolsets.py                   # Toolset definitions
hermes_state.py               # Session DB
tools/                        # Tool implementations (except mcp_oauth.py client_name)
agent/                        # Agent internals (providers, memory, caching)
gateway/                      # Messaging gateway
ui-tui/                       # Ink React TUI
apps/desktop/src/             # Desktop app source (curated exceptions below)
apps/shared/                  # Shared package (JsonRpcGatewayClient, WS helpers)
hermes_cli/plugins.py         # Plugin manager
hermes_cli/config.py          # DEFAULT_CONFIG (overrides via separate file)
hermes_cli/providers.py       # Provider registry
hermes_cli/main.py            # CLI entry point (keep package name hermes)
hermes_cli/setup.py           # Setup wizard
pyproject.toml                # Dependencies, version (upstream version wins)
scripts/                      # Install scripts (upstream URLs)
```

### Layer 1 — Branding Surface (~8 files, Tier 2, low conflict)

These are the files we **brand**. Every merge: `ours` for branding strings,
`theirs` for structure, features, and fixes.

| File | What we change | Merge policy |
|---|---|---|
| `hermes_cli/skin_engine.py` | `_BUILTIN_SKINS["default"]`: `agent_name: "CEODigital Agent"`, welcome, goodbye, response_label, prompt_symbol, tool_prefix, spinner, tool_emojis | Keep our default skin data; keep upstream's new skin additions + infrastructure code |
| `hermes_cli/default_soul.py` | `DEFAULT_SOUL_MD` → identity text (CEODigital Agent) | Ours always |
| `pyproject.toml` | `description`, `authors` | Upstream wins version/deps/scripts; ours wins description/authors |
| `hermes_cli/gateway.py` | `SERVICE_DESCRIPTION` | Ours always |
| `tools/mcp_oauth.py` | `client_name` default | Ours always |
| `tools/send_message_tool.py` | Email `Subject` default | Ours always |
| `apps/desktop/package.json` | `productName: "CEODigital Agent"` (was "Hermes") | Ours always |
| `gateway/platforms/whatsapp_common.py` | `DEFAULT_REPLY_PREFIX` | Ours always |

**Non-negotiable:** Entry point name stays `hermes`. Package name stays
`hermes-agent`. Connector discovery (`pip show hermes-agent`,
`findHermesBinary()`) depends on both.

### Layer 2 — CEODigital Surfaces (NEW files, ADDITIVE, zero conflict)

These are files **we create and own entirely**. Upstream has no matching paths
— no merge risk.

| Area | Files | Purpose |
|---|---|---|
| **Fork strategy** | `docs/ceodigital-fork-ownership-map.md` | This document |
| **Desktop i18n pt-pt** | `apps/desktop/src/i18n/locales/pt.ts` | Portuguese (Portugal) locale bundle |
| **Desktop i18n fr** | `apps/desktop/src/i18n/locales/fr.ts` | French locale bundle |
| **Desktop i18n es** | `apps/desktop/src/i18n/locales/es.ts` | Spanish locale bundle |
| **Desktop i18n de** | `apps/desktop/src/i18n/locales/de.ts` | German locale bundle |
| **CEODigital desktop plugins** | `apps/desktop/src/plugins/ceodigital/` (dir) | Native CEODigital panels — projects, agents, leads/CRM, tenant settings, billing. Auto-discovered by Hermes plugin system. Each panel is a HermesPlugin registering routes, sidebar nav, command palette, i18n, and REST API. |
| **CEODigital plugin — Projects** | `apps/desktop/src/plugins/ceodigital/projects/` | Projects list, detail, creation, management. Consumes MCP `workitems_*` tools. |
| **CEODigital plugin — Agents** | `apps/desktop/src/plugins/ceodigital/agents/` | CEO Agents catalog, local agent status, run history. |
| **CEODigital plugin — Leads/CRM** | `apps/desktop/src/plugins/ceodigital/crm/` | Leads and deals list, pipeline view. Consumes MCP `crm_*` tools. |
| **Auth integration** | `plugins/ceodigital-auth/` (plugin dir) | CEODigital OAuth/SSO login for desktop |
| **Config overlays** | `hermes_cli/ceodigital_overrides.py` | CEODigital-safe defaults (toolsets, max_turns, approvals) |
| **Python-side i18n** | `agent/i18n/locales/pt.json` | Python-side locale (error messages, tool descriptions) |

### Layer 3 — Configuration Lock-down (our overrides)

These are CEODigital-safe defaults applied via the config overlay
(`hermes_cli/ceodigital_overrides.py`), not by editing `DEFAULT_CONFIG`.

| Key | CEODigital value | Upstream default |
|---|---|---|
| `agent.max_turns` | 30–50 | 90 |
| `agent.disabled_toolsets` | `["image_gen","video_gen","browser","computer_use","homeassistant","discord","spotify"]` | `[]` |
| `approvals.mode` | `"manual"` | `"auto"` |
| `approvals.cron_mode` | `"deny"` | `"auto"` |
| `security.redact_secrets` | `True` | `False` |
| `security.allow_private_urls` | `False` | `True` |

---

## 5. Sync Policy

**Style:** On-demand merge, never automatic, never rebase. We merge upstream
when a specific feature or fix matters to CEODigital, not on a schedule.

**Procedure:**

```bash
cd ~/dev/paulojmorais/hermes-agent
git fetch upstream main && git fetch origin

# 1. Fast-forward local to origin if behind
git merge --ff-only origin/ceodigital-branding

# 2. Merge upstream
git merge upstream/main --no-edit

# 3. Resolve conflicts per Layer 1 table
#    After each file: python3 -m py_compile <file>

# 4. Re-grep for "<<<<<<<" before committing
#    A single file can hide multiple conflict hunks
git diff --name-only --diff-filter=U | xargs grep -l '<<<<<<<' 2>/dev/null || true
#    If found: resolve the remaining hunks, recompile, repeat

# 5. Commit
git add <resolved-files> && git commit --no-edit
```

**Real track record:**
- 2026-07-30: 7,106 commits behind, 4 unique commits → **4 conflict hunks in 3 files** (minutes).
- 2026-08-14: 2,714 commits behind, 6 unique commits → **1 conflict hunk in 1 file** (seconds).

**The guarantee:** As long as files outside Layer 1 and Layer 2 stay untouched,
merges cost near zero. Touching Layer 0 (core) is what makes merges expensive.

---

## 6. Translation Strategy

### Desktop App (Electron)

The desktop uses a `plugin-i18n` architecture (`apps/desktop/src/i18n/`). Core
locale is `en.ts`. To add a new locale:

1. Create `apps/desktop/src/i18n/locales/{pt,fr,es,de}.ts` mirroring `en.ts`'s
   shape.
2. Register in the i18n system (`context.ts` / `runtime.ts` locale list +
   loading path).
3. Wire `display.language` config key to locale selection.

**Rule:** never edit `en.ts`. Always add new locale files. Fall back to `en`
when the active locale has a missing key.

### Python-side (agent/i18n.py)

Follow `agent/i18n.py`'s existing locale mechanism. Add
`agent/i18n/locales/pt.json` with matching keys.

### Website (Docusaurus)

The website has Docusaurus i18n infrastructure (existing `zh-Hans`). Copy the
plugin config for `pt` and translate per-page. This is the **highest-effort**
surface; defer to P2/P3.

## 7. Auth Strategy (sketch)

Hermes desktop currently authenticates to CEODigital via MCP user tokens
(platform.mcp_user_tokens). For a full CEODigital SSO auth integration:

1. **Plugin approach** (preferred): create `plugins/ceodigital-auth/` as a
   general Hermes plugin that hooks `on_session_start` and registers:
   - CEODigital OAuth/SSO login flow
   - Tenant-aware session management
   - Credential injection from CEODigital vault
2. This directory is **our file** (Layer 2) — no core file edits.
3. For the **headless Engine role**, credentials arrive via daemon env vars
   (`HERMES_TENANT_MODELS`, `HERMES_CEO_AGENTS`), never via desktop auth.

## 8. Priority (recommended order of work)

| Wave | What | Effort | Impact |
|---|---|---|---|
| **W1** | Create locale files `pt.ts`, `fr.ts` for desktop | Low–Med | User sees chat in native language |
| **W2** | Wire `display.language` to locale switching | Low | Language config works |
| **W3** | Desktop plugin scaffold — `src/plugins/ceodigital/` with sidebar entry + `Projects` page consuming MCP `workitems_list` | Med | **Prova de conceito** "gerir ceodigital daqui" — primeira superfície CEODigital nativa no Hermes |
| **W4** | CRM plugin — leads + deals lists (MCP `crm_*` tools) | Med | Painel comercial nativo |
| **W5** | Agents plugin — CEO Agents catalog, run history | Med | Painel agentes nativo |
| **W6** | Auth plugin — CEODigital SSO login | Med | Desktop autentica-se ao CEODigital |
| **W7** | Python-side translation (`agent/i18n/locales/pt.json`) | Low | Agent messages in PT |
| **W8** | Website translations (Docusaurus pt) | High | Docs in PT

---

## 9. Code Review Gate Checklist

Before merging anything into `ceodigital-branding`:

- [ ] Is the change a **NEW file**? → Layer 2 (safe, owned, no conflict risk)
- [ ] Does it edit one of the ~8 branding files (Layer 1)? → Ensure branding
      strings only, no structural changes
- [ ] Does it edit a **core file** (Layer 0)? → **BLOCKED.** Must explain why
      it can't be a plugin / new file / config override
- [ ] Does it touch `pyproject.toml`? → Only `description`/`authors` permitted;
      upstream wins version, dependencies, entry points
- [ ] Does `hermes --version` return the upstream version? (connector heartbeat
      probes for it)

---

## 10. Distribution & Security

### 10.1 Distribution — how the packaged fork reaches a user's device

CEODigital already ships a distribution channel: the **F3 App Manager**
(`platform.local_apps` catalog + `platform.local_app_releases` + outbox
`kind='app.install'` + pairing→auto-MCP-token). The branded Hermes fork is
installed through it as a **Python package**, not a `.dmg`.

**Decision (recommended — recorded 2026-08-15):**
- **Fork repo is PRIVATE on GitHub.**
- The fork is distributed as a **published wheel** resolved like a "binary"
  release in `local_app_releases` (`download_url` + `sha256`), served through
  the existing `installLocalApp` release-resolution path.
- The device never fetches from the git repo or needs any provider/auth to
  pull the source — it gets a SHA-256-verified artifact.

```
admin:  /admin/connector  → register hermes-agent in F3 catalog (app_code, install_spec.method="binary", release:true)
tenant: /t/<slug>/connector → "Install Hermes"
   installLocalApp → resolve release+sha256 (app_code, platform, arch, channel=stable)
       → device_outbox kind='app.install'  (install_spec = { method, url, sha256, version })
   daemon → pip install <wheel url> ; verify sha256
   provisionAppAccess → generate MCP token + config (url + Bearer) → Hermes connected
```

**Current gaps to close (OPS):**
- Code signing / notarization (Developer ID) is still pending (F6c). Until then,
  users need "right-click → Open" on first launch (Gatekeeper).
- The build pipeline should emit a wheel per architecture (arm64/amd64 or pure
  Python `py3-none-any`) and push to `local_app_releases`. CI-generated, not
  manual upload, to keep SHA-256 authoritative.

### 10.2 Repository visibility — public vs private

| Consideration | Public | Private (recommended) |
|---|---|---|
| Engine core (`run_agent.py`, tools, desktop) | Already public upstream (MIT) — nothing to hide | Same |
| CEODigital-specific surfaces (auth, plugins, billing model, integration topology, `cost_billed` vs `cost_provider`) | Exposed to scanners / bad actors probing CE endpoints | Not exposed |
| `pip install` from the repo git | Simple, no auth | Requires published wheel or a PAT in the daemon (avoided — use wheel) |
| Cost (GitHub) | — | Free (private repos free) |

**Decision: keep the fork repo PRIVATE.** Publishing code that contains the
CEODigital integration topology, billing model, and internal endpoint shapes is
giving away the product's differentiated work. The MIT engine itself can be
public; the CEODigital layer (what differentiates us) is not.

### 10.3 Security measures

Enforced regardless of visibility:

1. **Token / secret scan in CI** (gitleaks pre-commit + post-commit) — no
   `.env*`, `ceod_*`, provider keys, or PATs may land in the repo.
2. **Never hardcode production URLs / slugs** — use `ceodigital_overrides.py`
   config, not source literals (Layer 3).
3. **Per-device MCP token + TTL** (already `provisionAppAccess` /
   `generate_mcp_user_token`, `expires_in`, auto-revoke previous). Never
   committed; shown once.
4. **Artifact integrity** — the wheel is SHA-256 verified against
   `local_app_releases.sha256` before the daemon installs it (supply-chain
   protection).
5. **Private bucket, blinded download** — `local_app_releases` served via
   `/api/public/connector/download/<id>` (service_role), never open RLS; one
   item per id.
6. **Code signing / notarization** — pending F6c; required before public
   Gatekeeper-friendly distribution.
7. **No source-level secrets** — because all CE users' credentials / auth flow
   via cloud (MCP proxy, billing proxy, vault), the fork source never contains
   a live tenant credential.