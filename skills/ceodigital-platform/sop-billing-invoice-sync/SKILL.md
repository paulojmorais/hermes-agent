---
name: sop-billing-invoice-sync
description: "Use when synchronizing invoices between CEODigital (CRM/Proposals) and external ERPs (Moloni, InvoiceXpress), reconciling statuses and detecting mismatches."
version: 1.0.0
---

# SOP: Sincronização de Faturas com ERP Externo

## Quando Usar
- Quando o utilizador pedir: "sincroniza as faturas com o Moloni", "porque é que a fatura X não aparece no ERP?", "atualiza o estado das faturas".

## 1. Mapeamento de Ferramentas Reais
- `int.moloni.invoices.list` / `int.invoicexpress.invoices.list`: Lista faturas no ERP.
- `services.proposals.list` / `services.proposals.get`: Obtém propostas convertidas em faturas no CEODigital.
- `int.moloni.invoices.get` / `int.invoicexpress.invoices.get`: Consulta estado de uma fatura específica.

## 2. Procedimento de Sincronização
1. **Comparação de Inventário:**
   - Lista as faturas no ERP e as propostas convertidas no CEODigital.
2. **Deteção de Desfasamentos:**
   - Identifica faturas que existem num lado mas não no outro, ou com estados divergentes (rascunho vs emitida vs paga).
3. **Reconciliação:**
   - Atualiza o estado no CEODigital para refletir o ERP (ex: marca como emitida/paga).
   - Reporta discrepâncias ao utilizador com sugestão de ação (ex: reenviar, corrigir NIF).