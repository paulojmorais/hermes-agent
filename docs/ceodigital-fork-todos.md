# Fork CEODigital — Pendências / Follow-up

> Repo: `paulojmorais/ceodigital-agent` (privado) · Branch: `ceodigital-branding`
> Estado das waves: Sec.8 do `ceodigital-fork-ownership-map.md` (tabela viva).
> Este doc é o rasto de trabalho pendente cruzado com olhar de review. Datado por entrada.
> **Última atualização: 2026-08-16** — após o merge `upstream/main` (ad390a2938) e W6/W8/CW hot.

---

## 1. Pendências que bloqueiam critérios de done (nem code, ambiente)

### 1.1 Smoke MCP real (W3) — ⏳
**Bloqueia:** o critério de done do plugin (provar o caminho
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

### 1.2 vitest / typecheck desktop — ⚠️
**Bloqueia:** validação dos testes TS (`languages.test.ts`, `plugin.test.tsx`,
`api.test.ts`) e da UI W3/W4/W5/W5+/W1/W2.
**Causa:** npm bug #4828 — a rolldown integra binding `wasm32-wasi` em vez de
`darwin-arm64`; o binário nativo já estava corrompido (`ERR_DLOPEN_FAILED`,
`segment '__TEXT' extends beyond end of file`, diagnosticado 2026-08-16).
**Correção (destrutiva, requer OK):** `rm -rf node_modules && npm ci` (a partir
do lock versionado, não regenera). Depois:
```bash
cd apps/desktop && npx vitest run src/plugins/ceodigital src/i18n
```
**Decisão atual:** adiado — a correção precisa de executar `npm ci`, que exige
aprovação explícita (destrutivo). Não executado ainda. Todo o TS/TSX foi validado
por LSP durante o desenvolvimento; ninguém correu o vitest localmente (rolldown).

---

## 2. Melhorias de quality (não bloqueiam, baixo risco)

### 2.1 Cobertura i18n pt/fr desktop (W1b) — ✅ (feito nesta sessão)
Expandido `pt/fr` a `settings.*`, `notifications.*`, `keybinds.*` no desktop
(commit `c2684d272`). Ainda por expandir: `profiles.*`, `messaging.*`, e a
surface Python já está em pt (W7). Expandir gradualmente se desejado.

### 2.2 Frontend W3–W5+/W2 — revisão deep durante a wave de typecheck
O plugin frontend foi validado por leitura + LSP, não por vitest (bloqueado).
Na wave de branding/typecheck, rever com vitest verdes + `tsc` real.

---

## 3. Distribuição / OPS (do ownership map §10)

- [x] **Build pipeline que emita wheel** do fork, com SHA-256 — criado
      `.github/workflows/release-wheel.yml` (triggers `ceodigital-v*` + `workflow_dispatch`,
      commit fork `6db271bbb`; workflow_dispatch adicionado nesta sessão).
- [x] **Admin Build no ceodigital** — `agent-builds.functions` (dispatch/list/detail),
      `agent-artifact.functions` (import wheel→bucket→upsert `local_app_releases`),
      UI `/admin/connector/agent-builds` (commit ceodigital `5bf63d9b9`).
- [x] **installLocalApp + installPip com SHA-256** — já implementado no ceodigital
      (o fix do bloco `pip` do `apps.functions.ts` foi corrigido nesta sessão,
      commit `3b3ca4b48` — o pip não devia correr o bloco binary de release resolution).
- [ ] **Disparar um build real + importar o wheel** — OPS: criar a migração F3b
      (ver ceodigital `supabase/migrations/20260815090000_connector_f3b_ceodigital_agent_catalog.sql`),
      aplicar no Lovable, disparar `ceodigital-v0.1.0`, importar wheel no admin.
- [ ] **Code signing / notarization (F6c)** para o desktop — sem Developer ID,
      users precisam "botão direito → Abrir" no Gatekeeper.
- [ ] **Wheel por arquitetura** (arm64/amd64) ou confirmar `py3-none-any` como
      suficiente.

---

## 4. Merge upstream (2026-08-16)

- **Feito:** `git merge upstream/main` → commit `ad390a2938` (771 commits upstream),
  0 conflitos. Backup tag `backup-before-upstream-merge-20260816-101507`.
- **Validado pós-merge:** pytest plugin 29✓, `test_i18n.py` 38✓, i18n pt resolve,
  `release-wheel.yml` íntegro, ficheiros aditivos intactos.
- ⚠️ **Não corrido:** typecheck TS do full desktop/web/TUI (upstream mudou muita
  assinatura) — ver Sec.1.2. Os nossos ficheiros provão @ intactos nos 7 auto-mergeados.

---

## 5. Pendentes por prioridade (2026-08-16)

1. **Aprovar `npm ci`** → fechar vitest + typecheck desktop (destrava toda a validação).
2. **Go-live distribuição**: migração F3b + disparar `ceodigital-v0.1.0` + import wheel.
3. **Smoke MCP real (W3)** — ambiente dev CEODigital.
4. **W6 — Auth plugin (CEODigital SSO no desktop)** — não iniciado.
5. **W8 — Website/Docusaurus pt** — não tocado.