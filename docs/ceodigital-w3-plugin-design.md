# W3 — CEODigital Desktop Plugin (Design)

> Branch: `ceodigital-branding` · Repo privado: `paulojmorais/ceodigital-agent`
> Doc: `docs/ceodigital-fork-ownership-map.md` (camada de contexto; este é o spec W3)
> Data: 2026-08-15 · Estado: **rascunho para review**
> Relacionado: `docs/ceodigital-fork-ownership-map.md` §3.1/§3.2/§8

## 1. Objetivo

Provar o modelo "o utilizador gere o seu CEODigital a partir do Hermes":
uma **página/porta nativa no desktop** que lista **Projects** (work items) do
tenant e permite ver detalhes — consumindo os dados **pelo MCP do CEODigital**
(114 tools, Direção A, §3.2 do ownership map), **sem** criar camada paralela
de integração e **sem** tocar em core Hermes.

A W3 é o **scaffold mínimo end-to-end**. Campoção do "Plumbing": plugin desktop
registado + uma rota real + um fetch real a provar o caminho
`renderer → ctx.rest → plugin backend → MCP CEODigital → dados`.

## 2. Porquê este desenho (padrão kanban, réplica fiel)

O plugin **kanban** é a referência canónica e demonstra o padrão exato que
replicamos:

```
apps/desktop/src/plugins/kanban/
  plugin.tsx        HermesPlugin (regista page/sidebar/statusbar/palette/i18n/rest)
  api.ts            data layer via ctx.rest → /api/plugins/kanban/*  + query keys
  types.ts          tipos
  board.tsx         página React
  i18n.ts           locales do plugin
```

Ponto estrutural: o react runner **nunca fala diretamente** com o CEODigital.
Tudo passa pelo **`ctx.rest`** (namespace-scoped `/api/plugins/<id>/*`) que é
servido pelo **backend Hermes** (router Python). É **este caminho** que
queremos — o renderer não pode (nem deve) ter token MCP/credenciais.

## 3. Arquitetura W3

```
┌──────────────────────────── Hermes Desktop (renderer) ───────────────────────────┐
│  apps/desktop/src/plugins/ceodigital/                                           │
│    plugin.tsx   HermesPlugin → contribution points                              │
│    api.ts       ctx.rest → /api/plugins/ceodigital/*   (query keys, atoms, caches)│
│    pages/Projects.tsx  página React "Projects"                                   │
│    i18n/pt.ts, fr.ts, en.ts   bundles do plugin                                  │
└───────────────────────────────┬──────────────────────────────────────────────────┘
                                │ ctx.rest (namespace scoped, /api/plugins/ceodigital/*)
                        ┌───────▼───────────────────────────────┐
                        │ backend Hermes (Python plugin door)   │
                        │ plugins/ceodigital/dashboard/plugin_api.py  │
                        │  ├─ GET /projects  → proxy MCP server   │
                        │  └─ valida tenant + usa token MCP       │
                        └───────┬───────────────────────────────┘
                                │ HTTPS (MCP, Direção A)
                        ┌───────▼───────────────────────────────┐
                        │ CEODigital /api/public/mcp/{slug}     │
                        │  → resolveTools() → workitems/crm/…   │
                        └────────────────────────────────────────┘
```

**Porquê o backend Python como proxy (e não o renderer chamar MCP em direto):**
o token MCP de projeto (`mcp_user_tokens`) e o `slug` do tenant são
**segredos/noção do utilizador** (§10.3.3). Mantê-los no backend Hermes (via
`certools`/config) impede que o renderer tenha credenciais de cloud. O renderer
só vê JSON limpo do `ctx.rest`.

## 4. Componentes W3 (ficheiros)

### 4.1 Backend Hermes — router Python (cap-pessoa, o "plugin door")

Novo ficheiro: `plugins/ceodigital/dashboard/plugin_api.py` (padrão idêntico ao
kanban `plugins/kanban/dashboard/plugin_api.py`).

Precisa de:
- Config: `ceodigital.tenant_slug` e `ceodigital.mcp_token` (lidos de
  `config.yaml`/`ceodigital_overrides.py`, nunca literais — §10.3.2).
- Router FastAPI em `/api/plugins/ceodigital/*`.
- `GET /api/plugins/ceodigital/workitems` → `fetchWorkitems()` no MCP
  `mcp__ceodigital_*__workitems_list` (proxy).
- `GET /api/plugins/ceodigital/workitems/{id}` → `workitems_get`.
- Erros tipados: `mcp_not_configured` / `mcp_unreachable` / `tenant_not_found`.

**Nota:** Este router é código nosso em escrita (Layer 2 / plugin), não core.
O kanban prova que esta abordagem de plugin REST door funciona.

### 4.2 `apps/desktop/src/plugins/ceodigital/plugin.tsx`

`HermesPlugin` com:
- `id: 'ceodigital'`, `name: 'CEODigital'`, `defaultEnabled: true` (é o produto;
  kanban é `false` por ser demonstração).
- `ctx.i18n.register(CEODIGITAL_LOCALES)`.
- `ctx.onDispose(bindApi(ctx.rest, ...))`.
- Contribution points:
  - `ROUTES_AREA` → `/ceodigital/projects` → `<ProjectsPage />`
  - `SIDEBAR_NAV_AREA` → `{ codicon: 'folder', label: 'CEODigital', path: '/ceodigital/projects' }`
  - `PALETTE_AREA` → `ceodigital.openProjects` → host.navigate
  - `STATUSBAR_AREAS` → (W4, opcional) "3 work items abertos"

### 4.3 `apps/desktop/src/plugins/ceodigital/api.ts`

Espelho do `kanban/api.ts`:
- `let rest: Rest = null`, `bindApi(r)` no register.
- query keys scoped: `['ceodigital','workitems']`, `['ceodigital','workitems',id]`.
- `fetchWorkItems()` / `fetchWorkItem(id)` via `call('/workitems')`, `call('/workitems/{id}')`.

### 4.4 `apps/desktop/src/plugins/ceodigital/pages/Projects.tsx`

Página React com React Query (`useQuery`) a listar work items: título, status,
assignee, descrição curta. Sem forms na W3 (só leitura) — formas/editar são W4.

### 4.5 `apps/desktop/src/plugins/ceodigital/i18n/{en,pt,fr}.ts`

Bundles do plugin com as chaves: `nav.label`, `page.title`, `page.empty`,
`workitem.status.*`, `errors.*`. Pt-pt/fr desde o arranque (provam a camada §6).

## 5. Contract de dados (W3 read-only)

```ts
interface WorkItemRow {
  id: string
  title: string
  status: string            // 'backlog' | 'ready' | 'running' | 'done' | ...
  assignee?: string
  summary?: string          // descrição curta
  updated_at?: string
}

interface WorkItemsResponse {
  ok: true
  workitems: WorkItemRow[]
}
interface WorkItemsError {
  ok: false
  error: 'mcp_not_configured' | 'mcp_unreachable' | 'tenant_not_found' | string
}
```

## 6. i18n (W3 já entrega pt/pt/fr — prova do §6 do ownership map)

O plugin tem `&.i18n.register()` com bundles próprios. Por NÃO editarmos o
`en.ts` core — só adicionamos bundles. (Padrão do ownership map §6.) O idioma
segue o `display.language` ativo da app.

## 7. Config & secrets (W3)

- `ceodigital.tenant_slug`, `ceodigital.mcp_token`: lidos no backend via
  `ceodigital_overrides.yaml` / env (nunca hardcoded — §10.3.2/§10.3.7).
- O token MCP é por-tenant, TTL, gerado via `provisionAppAccess` (F3) — o user
  loga o device, o plugin backend recebe o config `{ mcp url, bearer }` como o
  `install ↔ provisionAppAccess` simplificam (§10.1).

## 8. Fuera de scope W3 (waves seguintes)

- W4: formulários de criação/edição de work items (mutação com HITL).
- W5: plugin Aggregate Agents (CEO Agents catalog, run history).
- W4: plugin Leads/CRM (hierarquia seba, pipeline).
- W6: Auth plugin (SSO CE na desktop).
- Statusbar widget em "running items".
- Socket / live events (só polling na W3, como o 60s do kanban).

## 9. Testes (W3)

- **Unit (vitest)** em `apps/desktop/src/plugins/ceodigital/*.test.ts`:
  - `api.ts` — `fetchWorkItems` shape, erros tipados, scoping do query key
    (sem rede; mock `ctx.rest`).
  - `plugin.tsx` — registo contributions (página/sidebar a presente).
- **Backend router (pytest)** `plugins/ceodigital/plugin_api_test.py`:
  - erros → mocks (sem MCP real).
- **Manual (smoke)**: com um token MCP real + tenant slug dev, executar `hermes`
  no modo desktop, abrir `/ceodigital/projects`, ver a lista do CEOD.
  Critério de done: a lista populas + o caminho `renderer→rest→backend→MCP` provado.

## 10. Critério de done W3

- Página `/ceodigital/projects` abre na sidebar, lista work items do tenant
  (MCP real).
- O renderer não tem token/segredos (tudo no backend e `ctx.rest`).
- pt/fr bundles presentes (i18n funcional).
- Tests vitest + pytest passam sem rede (mocks).
- `hermes --version` inalterado.
- Nenhum ficheiro core editado (Layer 0 respeitado).

## 10.1 Status de implementação (2026-08-15)

**Estado: código implementado; smoke com MCP real pendente.**

| Componente | Ficheiros | Estado |
|---|---|---|
| **Backend proxy** | `plugins/ceodigital/dashboard/plugin_api.py` + `manifest.json` | ✅ Implementado. Router montado em `/api/plugins/ceodigital/` (confirmado `web_server.py:17797`) |
| **Backend testes** | `plugins/ceodigital/dashboard/plugin_api_test.py` | ✅ **10 passed** (verificado com `.venv/bin/pytest`) |
| **Desktop plugin** | `apps/desktop/src/plugins/ceodigital/plugin.tsx` | ✅ Escrito, `defaultEnabled: true`, page + sidebar + ⌘K |
| **Desktop data layer** | `apps/desktop/src/plugins/ceodigital/api.ts` + `types.ts` | ✅ Escrito |
| **Projects page** | `apps/desktop/src/plugins/ceodigital/pages/Projects.tsx` | ✅ Escrito (3 estados, erros tipados) |
| **i18n en/pt/fr** | `apps/desktop/src/plugins/ceodigital/i18n/` | ✅ Escrito (prova §6 — pt-pt + fr à esquerda) |
| **Desktop vitest** | `plugin.test.tsx` + `api.test.ts` | ⚠️ Não corrido localmente — rolldown native binding partido (npm #4828), ver abaixo |
| **Certificado done** | — | ⏳ **Smoke com MCP real pendente** (critério §9/§10) |

**Pendências técnicas conhecidas (não bloqueiam ship, precisam de validação no smoke):**

1. **Nomes das MCP tools** — o backend chama `workitems_list` / `workitems_get`.
   Confirmar que são os nomes exatos no `ToolRegistry` do CEODigital (podem ser
   `workitems.list` ou `mcp__ceodigital_*__workitems_list`). Alinhar no smoke.
2. **Transport Streamable HTTP** — o MCP provider pode responder a `httpx.post`
   JSON-RPC com `Accept: application/json, text/event-stream`. Validar headers
   reais no smoke.
3. **vitest local** — a rolldown integra binding `wasm32-wasi` em vez de
   `darwin-arm64` (npm bug #4828), e o `@napi-rs/wasm-runtime` instalado ainda
   resolve errado. `rm -rf node_modules && npm ci` corrigiria, mas destrutivo;
   fica para a wave de branding/typecheck (vitest é transpile-only, não valida
   TS de verdade — o `tsc` pós-wave é o que interessa).

**Commit:** `ac21fc4b9` — `feat(ceodigital): add W3 desktop plugin scaffold`.
**Repo:** `paulojmorais/ceodigital-agent` (privado), branch `ceodigital-branding`.

## 11. Risco / decisões pendentes

1. **Backend Python proxy** vs **renderer→`/api/public/mcp`**. Escolhi proxy
   Python para manter segredos server-side, mas implica escrever rota Python (o
   kanban já prova isto). Alternativa: renderer a pedir signed URL de curta vida
   do backend e depois MCP em direto — mais complexa, same-segredos. **Decidido:
   proxy backend.**
2. Segurar token: em `config.yaml` do Hermes (cheio §3.3) vs no plugin backend
   DB. **Decidido: `ceodigital_overrides.yaml`** (config), gerido pelo
   provisionamento.
3. O plugin precisa de saber o `slug` + token no arranque. **Origem:** o
   provisioningAppAccess & outbox config atomic perspective. Até lá, config
   manual dev.

---

*Reviewed-con :: W3 e do ownership map. 2026-08-15.*