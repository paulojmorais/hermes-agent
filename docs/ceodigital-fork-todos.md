# Fork CEODigital — Pendências / Follow-up

> Repo: `paulojmorais/ceodigital-agent` (privado) · Branch: `ceodigital-branding`
> Estado das waves: véase Sec.8 do `ceodigital-fork-ownership-map.md`.
> Este doc é o rasto de trabalho pendente cruzado com olhar de review. Datado por entrada.

---

## 1. Pendências que bloqueiam critérios de done (nem code, ambiente)

### 1.1 Smoke MCP real (W3) — ⏳
**Bloqueia:** o critério de done §9/§10 da W3 (provar o caminho
`renderer → ctx.rest → backend → MCP → dados`).
**Blocker:** precisa do ambiente dev CEODigital (token MCP + tenant slug + app_url).
**Valida:**
- Nomes reais das MCP tools no `ToolRegistry` do CEODigital. O backend chama
  `workitems_list` / `workitems_get` — confirmar se são esses ou
  `mcp__ceodigital_*__workitems_list` (alinhar se necessário).
- Transport **Streamable HTTP**: validar se o `httpx.post` JSON-RPC precisa de
  `Accept: application/json, text/event-stream` nas headers.
- Config: criar `ceodigital_overrides.yaml` de dev com `app_url`, `tenant_slug`,
  `mcp_token` (nunca hardcoded).

### 1.2 vitest / typecheck desktop — ⚠️
**Bloqueia:** validação dos testes TS (`languages.test.ts`, `plugin.test.tsx`,
`api.test.ts`).
**Causa:** npm bug #4828 — a rolldown integra binding `wasm32-wasi` em vez de
`darwin-arm64`; o `@napi-rs/wasm-runtime` instalado ainda resolve
`rolldown-binding.wasi.cjs` truncado.
**Correção (destrutiva, requer OK):** `rm -rf node_modules && npm ci` (a partir
do lock versionado, não regenera). Depois correr:
```bash
cd apps/desktop && npx vitest run src/plugins/ceodigital src/i18n
```
**Decisão atual:** adiado para a wave de branding/typecheck (vitest é
transpile-only; o `tsc` é a validação que interessa e é a wave devida).

---

## 2. Melhorias de quality (não bloqueiam, baixo risco)

### 2.1 i18n pt/fr — cobrir mais do core (W1b)
W1a cobriu o chrome (`common`, `fileMenu`, `boot`, `titlebar`, `language`,
`sidebar.nav`, `composer`). Expandir gradualmente para `settings.*`,
`notifications.*`, `keybinds.*`, `profiles.*`, `messaging.*`, etc. Usar
`defineLocale()` (merge parcial sobre `en`), nunca tocar em `en.ts`.

### 2.2 Frontend W3 — revisão deep do código TS/TSX
O plugin frontend foi validado por leitura manual, não por vitest (bloqueado).
Na wave de branding/typecheck, rever com `tsc` real e os vitest verdes.

---

## 3. Distribuição / OPS (do ownership map §10)

- [ ] Build pipeline que emita **wheel** do fork, com SHA-256, para `local_app_releases`.
- [ ] Decisão de **code signing/notarization** (F6c) para o desktop — sem Developer
      ID, users precisam "botão direito → Abrir" no Gatekeeper.