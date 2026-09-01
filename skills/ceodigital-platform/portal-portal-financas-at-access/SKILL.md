---
name: portal-portal-financas-at-access
description: "Use when accessing the Portuguese Tax Authority (Portal das Finanças / AT) via browser automation to consult tax status, invoices, or declarations."
version: 1.0.0
---

# SOP: Acesso ao Portal das Finanças (AT)

## Quando Usar
- Quando o utilizador pedir: "consulta o meu estado fiscal na AT", "valida uma fatura certificada", "vê as minhas declarações de IVA", "obtém a certidão de não dívida".

## 1. Camada de Acesso (Camada 2 — Playwright)
- O Portal das Finanças NÃO tem API pública estável. Usar automação de navegador via Connector Companion.
- **Tools:** `browser.navigate` (URL de login), `browser.click_and_fill` (NIF/senha), `browser.screenshot` (confirmação).

## 2. Procedimento
1. **Pré-condição:** Verificar que há Connector Companion conectado (`connector.relay.use`).
2. **Credenciais:** Usar credenciais do cofre (`/admin/settings/credentials`), nunca pedir a senha ao utilizador em texto no chat.
3. **Abertura:** `browser.launch({ initialUrl: "https://www.portaldasfinancas.gov.pt/" })`.
4. **Autenticação + HITL:** Preencher NIF/senha com `browser.click_and_fill`; se houver 2FA/confirmação, o utilizador completa manualmente (HITL obrigatório).
5. **Consulta:** Navegar para a área desejada (IVA, Faturas, Linha Verde) com `browser.click_and_fill`.
6. **Registo:** Apresentar o resultado extraído e anexar screenshot.

## 3. Guardrail
- NUNCA expor credenciais no chat.
- Requerer HITL para qualquer ação de submissão/declaração.