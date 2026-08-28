# Sync automático com o upstream (NousResearch/hermes-agent)

O fork (`paulojmorais/ceodigital-agent`, branch `ceodigital-branding`) mantém-se
sincronizado com o **`upstream/main`** através de um GitHub Action
(`.github/workflows/sync-upstream.yml`).

## Como funciona

| | Detalhe |
|---|---|
| Frequência | Diário às **06:00 UTC** (`schedule`) |
| Disparo manual | GitHub → Actions → `sync-upstream` → **Run workflow** |
| Forma | Merge (regra da casa — **nunca rebase**) |
| Saída | Abre um **PR de sync** (nunca push direto) |
| Branch do PR | `sync/upstream-<timestamp>` → base `ceodigital-branding` |

## Regras / proteções

- **Nunca push direto** a `ceodigital-branding` — o PR deixa o CI validar e o
  humano resolver conflitos de branding antes do merge.
- **Conflitos de branding** ficam marcados no PR; resolver manualmente:
  - manter **`CEODigital Agent`** / **`ceodigital.ai`** (strings/headers nossos),
  - **upstream ganha** estrutura/features (regra da casa para merges).
- **Sem auto-merge** (decisão): o humano decide o merge do sync.

## Fluxo diário típico

1. 06:00 — workflow corre; se `ceodigital-branding` está **atrás** de upstream, abre PR.
2. Tu (ou a equipa) revês o PR; se houver conflitos de branding, resolves
   (mantendo o nosso branding). Se doravado limpo, fazes merge.
3. Sem drift → workflow sai "nothing to do".

## Onde está

- Workflow: `.github/workflows/sync-upstream.yml`
- Este runbook: `docs/runbooks/upstream-sync.md`

## Relacionado

- Merge do fork é manual (regra casa: merge não rebase) — ver
  `teamhub-hermes-integration` skill (§ Sync with Upstream).
- `docs/runbooks/cloud-agent-branding-soul.md` — SOUL.md stale (runtime cloud).