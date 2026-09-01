---
name: portal-registo-comercial
description: "Use when accessing the Portuguese Commercial Registry (Registo Comercial) to consult company legal status, shareholders, managers, share capital, and permanent certificates."
version: 1.0.0
---

# SOP: Acesso ao Registo Comercial (Certidões & Situação Legal)

## Quando Usar
- Quando o utilizador pedir: "obtém a certidão permanente desta empresa", "quem são os sócios e gerentes?", "qual é o capital social?", "verifica a situação legal da empresa".

## 1. Camada de Acesso (Camada 2 — Playwright)
- O Registo Comercial (via portal das Conservatórias / ePortugal) não tem API pública estável para consulta de certidões. Usar automação de navegador via Connector Companion.

## 2. Procedimento
1. **Pré-condição:** Connector Companion conectado (`connector.relay.use`).
2. **Credenciais:** Chaves de acesso no cofre (`/admin/settings/credentials`), nunca no chat.
3. **Abertura:** `browser.launch({ initialUrl: "https://eportugal.gov.pt/" })` ou portal da conservatória.
4. **Consulta por NIF:** Preencher o NIF da empresa com `browser.click_and_fill`.
5. **Extração de Dados:**
   - Situação legal (ativa, encerrada, insolvência).
   - Sócios e gerentes (nome, participação).
   - Capital social e sede.
   - Certidão permanente (se aplicável).
6. **Registo:** Apresenta o resumo executivo e anexa screenshot.

## 3. Guardrail
- NUNCA expor credenciais no chat; HITL para download de certidões pagas.