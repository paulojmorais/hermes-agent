---
name:
  pt-PT: "Sincronização de Faturas Moloni e ERP"
  en: "Moloni & ERP Invoice Automation"
description:
  pt-PT: "Converte propostas ganhas no CRM em faturas/recibos rascunho no Moloni com certificação AT e dados fiscais validados."
  en: "Converts won CRM deals and proposals into draft Moloni/ERP invoices with certified tax lines."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["payments.write", "crm.deals.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Emissão e Sincronização de Faturação no ERP

## Quando Usar
- Ao fechar um negócio (Deal Ganho) ou quando o utilizador solicitar emissão de fatura/adiantamento.

## Procedimento
1. Validar NIF e morada fiscal do cliente no CRM.
2. Obter as tranches de pagamento e itens da proposta aprovada.
3. Criar rascunho de fatura no Moloni com taxas de IVA adequadas (Isenção Art. 53º, 6%, 13% ou 23%).
4. Apresentar cartão de aprovação (HITL) ao CFO Marcus antes de finalizar a emissão certificada.
