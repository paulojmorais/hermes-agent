# CEODigital Desktop — Module Coverage Plan (spec)

> **Repo fonte:** `paulojmorais/ceodigital-agent` (fork Hermes branded) · **Branch:** `ceodigital-branding`
> **Plataforma alvo:** `ceodigital` v2 (TanStack Start) — `~/dev/ceodigital`
> **Autor:** Hermes (CEODigital Agent) · **Última atualização:** 2026-08-18
> **Objetivo:** gerir **todo** o CEODigital a partir do desktop Hermes (plugin `ceodigital`), cobrindo todos os módulos que a plataforma já expõe via MCP e os que ainda não foram expostos.

---

## 1. Contexto e propósito

O plugin desktop `ceodigital` (`apps/desktop/src/plugins/ceodigital/` + `plugins/ceodigital/dashboard/plugin_api.py`)
é o proxy que liga o Hermes desktop à superfície MCP da plataforma CEODigital (Direção A, `/api/public/mcp/{slug}`).

Hoje o plugin cobre **~10%** da superfície MCP do tenant. Este plano define a cobertura
completa para que o utilizador possa **gerir todo o CEODigital a partir do desktop**:
consultar, criar, executar, approvar e pesquisar — em todos os módulos que a plataforma
já concretizou (não só os que o plugin já mostra).

### Arquitetura (resumo)

```
Hermes Desktop plugin (ceodigital)
   ├─ React pages  (apps/desktop/src/plugins/ceodigital/pages/)
   ├─ REST proxy   (plugins/ceodigital/dashboard/plugin_api.py  →  /api/plugins/ceodigital/*)
   └─ MCP client   (… → /api/public/mcp/{slug}  →  buildMcpToolRegistry → cada módulo)
```

Regras de fronteira (do `ceodigital-fork-ownership-map.md §3.2 / §4 Layer 2):
- **Uma via, sem paralelo.** O desktop consome CE tools **através de MCP → resolveTools()**, nunca
  com uma segunda conta Composio/Nango ou credentials store.
- **Aditivo e de nossa propriedade.** Novas páginas/widgets do plugin são ficheiros Layer 2
  (zero conflito de merge). Nenhuma edição a core (Layer 0).
- **Read-first, depois mutação** — mutating tools já têm `needsApproval`/HITL no adapter; o desktop deve
  deixar approve/reject na UI do tenant (como já faz em `/agents/pending`).
- **Credenciais nunca no renderer** — config MCP lida server-side (overrides + env), nunca renderizada.

---

## 2. Fontes de verdade da superfície (verificado no código, 2026-08-18)

### 2.1 Registry tenant — `buildMcpToolRegistry` (`ceodigital/src/integrations/ai/mcp/buildMcpToolRegistry.server.ts`)

Este é o registry que o `/api/public/mcp/{slug}` serve para o desktop. Agrega (e gate-por-capability):

| Bloco | Registry source | Tools | Notas |
|---|---|---|---|
| Chat web read-only | `@/tenant/chat/tools/registry` | `chat.web.search`, `chat.web.fetch` | stateless, gated |
| Documents RAG | `@/tenant/chat/tools/documents` | `searchDocuments` | fail-open |
| Documents metadata | `@/modules/business/documents/tools/registry` | ~17 (files, collections, bindings, reingest) | |
| Workitems cockpit | `@/tenant/workitems/tools/registry` | 12 | approve/reject **excluídos do MCP** (UI tenant) |
| CRM | `@/tenant/crm/tools/registry` | 34 | leads/deals/persons/orgs/pipelines/stages/activities/categories |
| Entity fields | `@/modules/business/entity-fields/tools/registry` | 2 | |
| Help docs KB | `@/modules/business/help-docs/tools/registry` | 2 | |
| Services + Proposals | `@/modules/business/services/tools/registry` | 21 | catálogo, offerings, proposals (13 verbos), tranches, categorias |
| Implementations | `@/modules/business/implementation/tools/registry` | 9 | |
| Timeline/activity | `@/modules/foundation/timeline/tools/registry` | 6 | |
| Messaging | `@/modules/business/messaging/tools/registry` | 9 | |
| Notifications | `@/modules/business/notifications/tools/registry` | 4 | |
| Workspaces | `@/tenant/workspaces/tools/registry` | 6 | |
| Departments | `@/modules/core/org/tools/registry` | 6 | |
| CEO agent runs | `@/tenant/agent/ceo-agents/tools/registry` | 8 | |
| Integrations metadata | `@/tenant/integrations/tools/registry` | 5 | |
| Members | `@/tenant/members/tools/registry` | 5 | |
| Payments & Commerce | `@/modules/business/commerce/tools/registry` | 7+ | orders + payment_links |
| Governance | `@/tenant/governance/tools/registry` | 7 | DSR, consents, processing, retention |
| Automation | `@/tenant/automation/tools/registry` | 18 | conversations, playbooks, agentflow(NativeFlow) |
| Integrations (Composio/Nango/HTTP) | `resolveTools()` | `int.*` (dinâmicas) | fail-open |
| CEO agents `agent.<slug>.ask` | `agentsToolAdapter` | 1 + por agente exposto | |
| CEO agent catálogo | `buildAgentsCatalogMcpApi` | `agents.list` | |
| Skills-as-MCP | `skillsToolAdapter` | `skill.<slug>` (dinâmico) | |
| Introspection | `introspectionTools` | `mcp.tools.list` e afins | gated |

**Total estático ≈ 160 tools fixas** + dinâmicas (agentes, skills, integrações).

### 2.2 Registry control-plane — `buildPlatformMcpToolRegistry` (mesmo ficheiro, 18 tools)

`platform.tenants.*, plans.*, subscriptions.*, implementation.*, connector.fleet.*,`
plus billing/credits/ai/*/integration-catalog — **só visível se o token tiver capabilities de
control-plane**. Para um desktop de end-user/gestor de tenant, a superfície relevante é a do §2.1.

---

## 3. Estado atual do plugin (gap real, verificado)

Rota do plugin → tool MCP → cobertura:

| Área | Rotas plugin actuais | Tools MCP disponíveis | Cobertura |
|---|---|---|---|
| **Workitems** | `workitems`, `workitems/{id}` | 12 | ~2 (list/context) — falta create/run/assign/submit/checklist/suggest |
| **CRM** | `leads`, `deals` | 34 | 2 (leads/deals list) — falta persons, organizations, pipelines, stages, activities, categories, mutações |
| **Services/Propostas** | — (0) | 21 | 0 |
| **Automation** | `agentflows` | 18 | 1 (workflows list) — falta conversations, playbooks, run/publish |
| **Documents/RAG** | — | ~19 | 0 |
| **Messaging** | — | 9 | 0 |
| **Implementations** | — | 9 | 0 |
| **Commerce/Payments** | — | 7+ | 0 |
| **Governance** | — | 7 | 0 |
| **Timeline/Notif/Workspaces/Org/Members/Integrations** | — | ~32 | 0 |
| **Agents** | `agents`, `agents/{slug}/ask`, `runs`, `schedules`, `pending` | dinâmicas | ✅ já cobre catálogo+ask+runs+schedules+pending |
| **Platform admin.** | — | 18 (só CP) | 0 (opcional, token CP) |

**Conclusão:** o plugin cobre hoje ~10% (Agents quase completo; Workitems/CRM parciais; o resto a 0).

### 3.1 Módulos do produto CEODigital que AINDA NÃO têm surface MCP (falta criar do lado ceodigital)

A gestão "de todo o ceodigital" no desktop exige que estes módulos exponham tools MCP.
Verificado em 2026-08-18 (não têm `tools/registry`):

| Módulo (repo) | Localização | Estado MCP | Acção necessária |
|---|---|---|---|
| **Calendar** | `src/modules/business/calendar/` | sem tools | criar registry de tools (events, availability, booking) |
| **Attendance** | `src/modules/business/attendance/` | sem tools | criar registry (shifts, clock, requests) |
| **Pricing** | `src/modules/business/pricing/` | sem tools | criar registry (price lists, tiers) |
| **Labels** | `src/modules/business/labels/` | sem tools | criar registry (labels entity tagging) |
| **SocialFlow** | `src/modules/business/socialflow/` | sem tools | criar registry (posts, schedules, analytics; injeta nodes NativeFlow) |
| **InformaDB** | `src/modules/business/informadb/` | sem tools | criar registry (enrichment, queries) |
| **Chat (gestão)** | `src/modules/business/chat/` | sem tools diretos | conversations já existem em automation; completar gestão de mensagens/workspace |
| **Chat widgets** | `src/modules/business/chat-widgets/` | sem tools | criar registry (config widgets) |
| **LLM Studio** | `src/modules/foundation/llm-studio/` | sem tools | criar registry (tenants, fine-tune jobs, datasets) |
| **Skills (produto)** | `src/modules/foundation/skills/` | skills-as-MCP cobre execução; falta gestão/catálogo | registry de gestão (list/install/config) |
| **Dashboards (produto)** | `src/modules/foundation/dashboards/` | sem tools | registry (widgets, datasources) |
| **Workbench** | `src/modules/foundation/workbench/` | sem tools | registry (templates, runs) |
| **Categories (foundation)** | `src/modules/foundation/categories/` | sem tools | registry |

> Para cada um destes: **criar no repo ceodigital** um `tools/registry.ts` no padrão dos existentes
> (ToolRegistry por capability, `needsApproval` nas mutating, fail-open) e registá-lo no
> `buildMcpToolRegistry`. Depois o plugin desktop só adiciona a página/normalizer.

---

## 4. Plano de implementação (waves)

Prioridade por valor/gestão (o que o CEO/gestor quer gerir daqui). Cada wave = repo alvo
(`ceodigital` para criar tools MCP; `ceodigital-agent` para a página/normalizer do plugin).

### W1 — CRM completo (recomendado primeiro: estende o existente)
**ceodigital-agent:** páginas Persons, Organizations, Pipeline/Stages, Activities; mutações lead/deal desbloqueadas na UI.
**ceodigital:** nada a criar (34 tools já existem).
- Ferramentas a expor no plugin: `crm.persons.list/get/create/update`, `crm.organizations.*`, `crm.pipelines.list`, `crm.stages.list`, `crm.activities.*`, `crm.leads.change_stage/close_*`, `crm.categories.*`.
- Esforço: Médio.

### W2 — Workitems operacional
**ceodigital-agent:** criação/execução/assign/submit/checklist/suggest no painel.
- Tools: `workitems.create/run/assign/submit_output/checklist.toggle/suggest/status/context`.
- Nota: `approve/reject` ficam na UI tenant (já excluídos do MCP — manter).
- Esforço: Médio.

### W3 — Services & Proposals
**ceodigital-agent:** novas páginas Catálogo, Offerings, Proposals (list/get/create/send/accept/reject/duplicate/tranches/items).
- Tools: as 21 de `@/modules/business/services/tools/registry`.
- Esforço: Alto (21 tools, 13 verbos de proposal).

### W4 — Automation completo (Conversations + Playbooks + NativeFlow)
**ceodigital-agent:** painéis de conversas, playbooks (list/get/run), NativeFlow (workflows list/get/publish/run, schedules, webhooks, runs).
- Tools: 18 de `@/tenant/automation/tools/registry`.
- Esforço: Médio-Alto.

### W5 — Documents / RAG
**ceodigital-agent:** painel de documentos, ficheiros, coleções; centro de pesquisa RAG.
- Tools: `searchDocuments` + ~17 de `@/modules/business/documents/tools/registry`.
- Esforço: Alto.

### W6 — Messaging, Notifications, Timeline, Workspaces, Members, Integrations, Departments
**ceodigital-agent:** painéis agregados (inbox de notificações, mensagens, workspace switcher, gestão de membros, integrações visíveis).
- Tools: ~32 agrupadas.
- Esforço: Médio (muitas páginas pequenas).

### W7 — Commerce / Payments / Governance
**ceodigital-agent:** painéis de orders, payment_links, DSR/consents/retention.
- Tools: `@/modules/business/commerce/tools/registry` + `@/tenant/governance/tools/registry`.
- Esforço: Médio.

### W8 — Módulos sem MCP ainda (Calendar, Attendance, Pricing, Labels, SocialFlow, InformaDB, LLM Studio, Skills gestão, Dashboards, Workbench, Categories, Chat widgets)
**ceodigital (repo alvo):** criar `tools/registry.ts` em cada módulo e registar no `buildMcpToolRegistry`.
**ceodigital-agent:** depois, página/normalizer por módulo.
- **Sequenciar por roadmap de produto**; este é o maior bloco mas cada registry é independente.
- Esforço: Alto (multi-módulo, faseado).

### W9 — (opcional) Platform admin no desktop
**ceodigital-agent:** painel de gestão platform (tenants, plans, subs, fleet) — **só se o token tiver caps CP** (`buildPlatformMcpToolRegistry`).
- Decide-se se o desktop de admins CEODigital deve mostrar isto.
- Esforço: Alto.

---

## 5. Padrão de implementação (reutilizável)

Cada nova página segue o padrão já provado no plugin:

1. **ceodigital-agent — `plugin_api.py`:** 1 rota `@router.get("/<area>")` → `_mcp_fetch("<tool>", args)` → `_normalize_<area>` → envelope `{ok, ...}`.
2. **ceodigital-agent — `api.ts`:** 1 função `fetch<Area>()` → `call('/<area>')`.
3. **ceodigital-agent — `pages/<Area>.tsx`:** página React, registada em `plugin.tsx` (nav + command palette).
4. **ceodigital-agent — i18n:** chaves `pt/fr/en` em `apps/desktop/src/plugins/ceodigital/i18n/`.
5. **ceodigital — (só para módulos sem MCP):** `tools/registry.ts` + registo no `buildMcpToolRegistry`.

Testes: `plugin_api_test.py` (backend) + vitest (quando o rolldown do desktop estiver resolvido — ver §7).

---

## 6. Definição de "feito" (gate por wave)

- [ ] Todas as tools do módulo expostas (read; mutating com `needsApproval`) passam no smoke MCP real.
- [ ] Página(s) no desktop consomem via `_mcp_fetch` → envelope `{ok,}`; sem credenciais no renderer.
- [ ] Approve/reject e HITL ficam na UI do tenant (nunca no desktop, exceto `pending` read-only).
- [ ] i18n pt/fr/en completo na nova página.
- [ ] `py_compile` + testes backend verdes; vitest/tsc quando destravado.
- [ ] Commit no `ceodigital-branding` (ficheiros Layer 2, zero edições a core).

---

## 7. Bloqueios / dependências (estado real 2026-08-18)

| Item | Estado | Impacto |
|---|---|---|
| **Smoke MCP real (W3)** | ⏳ bloqueado (ambiente dev CEODigital: token+slug+app_url) | Critério de done de cada wave precisa de um ambiente para provar o caminho completo |
| **vitest/typecheck desktop** | ⏳ npm bug #4828 (rolldown binding) — requer `npm ci` destrutivo | Validação TS do plugin; os ficheiros provaram intactos por LSP |
| **Distribuição F3b / wheel** | 🟡 OPS pendente (migração F3b + disparar build + import wheel) | Não bloqueia dev do plugin; bloqueia go-live |
| **Auth plugin (W6)** | ⬜ não iniciado | Sem SSO, o token MCP é colado manualmente (funciona, não ideal) |

---

## 8. Referências cruzadas

- Spec deste plano (fonte): **`docs/ceodigital-desktop-module-coverage-spec.md`** (repo ceodigital-agent).
- Mapping MCP → módulos: `src/integrations/ai/mcp/buildMcpToolRegistry.server.ts` + `buildPlatformMcpToolRegistry.server.ts` (repo ceodigital).
- Ownership map: `docs/ceodigital-fork-ownership-map.md` (repo ceodigital-agent).
- Fork todos/estado: `docs/ceodigital-fork-todos.md` (repo ceodigital-agent).
- Agent Plugins v1 portável: `~/.hermes/profiles/ceodigital/skills/teamhub-hermes-integration/references/agent-plugins-v1-portable.md`.
- **Referência a criar no repo ceodigital v2:** `docs/implementation-plans/desktop-module-coverage/README.md` (ver ficheiro de referência incluído neste plano).
