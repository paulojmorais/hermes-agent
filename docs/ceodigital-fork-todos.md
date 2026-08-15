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

**Fonte de produção — CONFIRMADA (main do ceodigital, 2026-08-15):** o config
NÃO é manual. O `ceodigital-agent` é instalado como **app do catálogo F3b** via
**App Manager no Connector Companion**:

```
tenant user → menu Connector → descarrega Connector Companion (Tauri)
  → parear device
  → tab App Manager (platform.local_apps): hermes / cowork / opencode / ceodigital-agent
      → "Instalar ceodigital-agent"
          installLocalApp (resolves release+sha256) → device_outbox kind='app.install'
          daemon → pip/binary (install.go)  ·  PC pessoal OU servidor (kind=desktop/server)
      → "Ligar (MCP token)" → provisionAppAccess → gera MCP token + config pronto
          { mcp: { url, header: Bearer } }  → mostrado 1× ao user
```

**Como o config chega hoje (semi-manual, AppsTab.tsx):** após "Ligar", o UI mostra
o JSON de config **uma única vez** com o botão "Copiar config" e a dica de colar em
`~/.ceodigital/…`. O token NÃO volta a ser apresentado. **Não existe ainda um
`config.push` automático que escreva o token em disco para o plugin ler** — isso é
**evolução futura**, não blocker.

Portanto no smoke real: `Instalar` → `Ligar` → **copiar o JSON** para o config da
app — e o `/ceodigital/projects` lê aí. O overrides.yaml fica como **dev/fallback**.

**O que smoke valida:**
- Nomes reais das MCP tools no `ToolRegistry` (o backend chama `workitems_list` /
  `workitems_get` — confirmar vs. `mcp__ceodigital_*__workitems_list`).
- Transport **Streamable HTTP**: `httpx.post` JSON-RPC talvez precise de
  `Accept: application/json, text/event-stream`.
- Onde o daemon grava o config MCP por-app (`config.push`) — peça a fechar no ceodigital.

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