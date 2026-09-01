---
name: portal-bank-transaction-access
description: "Use when accessing banking portals (Millennium, BCP, Novo Banco, etc.) via browser automation to consult statements, balances, and transaction history."
version: 1.0.0
---

# SOP: Acesso a Bancos Nacionais (Extratos & Reconciliação)

## Quando Usar
- Quando o utilizador pedir: "consulta o extrato do Millennium", "vê os movimentos do BCP", "exporta a lista de transações para reconciliar", "confirma o saldo".

## 1. Camada de Acesso (Camada 2 — Playwright)
- Os bancos nacionais não expõem APIs públicas de consulta de saldo. Usar automação de navegador via Connector Companion com sessão segura.

## 2. Procedimento Seguro
1. **Pré-condição:** Connector Companion conectado com capability `browser` (`connector.relay.use`).
2. **Credenciais & 2FA:**
   - Chaves de acesso e tokens de autenticação digitam-se no cofre de credenciais.
   - O **2FA via SMS/APP** é SEMPRE completado pelo utilizador (HITL inviolável).
3. **Abertura:** `browser.launch({ initialUrl: "https://www.millenniumbcp.pt/" })` (ou portal correspondente).
4. **Navegação & Extrato:**
   - Usa `browser.click_and_fill` para aceder à conta e gerar o extrato do período.
   - `browser.screenshot` guarda o comprovativo visual.
5. **Exportação para Análise:**
   - Converte os movimentos em dados estruturados e alimenta a skill `sop-bank-reconciliation-receipts-pipeline` para reconciliação cruzada com faturas.

## 3. Guardrails
- **Segurança máxima:** NUNCA expor credenciais ou tokens no chat; criar sessão via Connector Companion e manter HITL.
- **Reconciliação:** Os dados bancários só se cruzam com as skills de reconciliação após exportação segura.