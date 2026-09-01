---
name: portal-certidao-nao-divida
description: "Use when obtaining the Portuguese tax and social security non-debt certificates (Certidão de Não Dívida) for tenders, financing, or due diligence."
version: 1.0.0
---

# SOP: Certidão de Não Dívida (AT + Segurança Social)

## Quando Usar
- Quando o utilizador pedir: "obtém a certidão de não dívida", "preciso da certidão para o concurso", "verifica se a empresa tem dívidas à AT ou SS".

## 1. Camada de Acesso (Camada 2 — Playwright)
- As certidões de não dívida são emitidas nos portais da AT e da Segurança Social. Usar automação de navegador via Connector Companion.

## 2. Procedimento (Agregação de 2 Fontes)
1. **Pré-condição:** Connector Companion conectado.
2. **Certidão AT:**
   - `browser.launch({ initialUrl: "https://www.portaldasfinancas.gov.pt/" })`.
   - Autenticar com credenciais do cofre + HITL.
   - Navegar para "Certidões" → "Certidão de Não Dívida" e gerar.
3. **Certidão SS:**
   - `browser.launch({ initialUrl: "https://www.seg-social.pt/" })`.
   - Autenticar e gerar a certidão de situação contributiva.
4. **Consolidação:**
   - Apresenta o estado de ambas (regularizada / com dívidas) num resumo executivo.
   - Se houver dívidas, indica o montante e a entidade.

## 3. Guardrail
- NUNCA expor credenciais; HITL para download/emissão das certidões.