---
name: portal-seguranca-social-access
description: "Use when accessing the Portuguese Social Security portal via browser automation to consult contribution status, certificates, and employer obligations."
version: 1.0.0
---

# SOP: Acesso à Segurança Social (Portal SS)

## Quando Usar
- Quando o utilizador pedir: "consulta a minha situação contributiva", "obtém a certidão da Segurança Social", "vê as declarações de remunerações".

## 1. Camada de Acesso (Camada 2 — Playwright)
- O Portal da Segurança Social não tem API pública estável; usar automação de navegador via Connector Companion.
- **Tools:** `browser.navigate` (segmento de login), `browser.click_and_fill` (NISS e senha), `browser.screenshot`.

## 2. Procedimento
1. **Pré-condição:** Verificar Connector Companion conectado (`connector.relay.use`).
2. **Credenciais:** Usar chaves no cofre (`/admin/settings/credentials`), nunca capturar senha no chat.
3. **Abertura:** `browser.launch({ initialUrl: "https://www.seg-social.pt/" })`.
4. **Autenticação + HITL:** Preencher NISS/senha; 2FA/confirmação é completada manualmente pelo utilizador.
5. **Consulta:** Navegar para situação contributiva, certidão ou declarações de remunerações.

## 3. Guardrail
- NUNCA registar senhas no histórico do chat; requerer HITL para ações de submissão.