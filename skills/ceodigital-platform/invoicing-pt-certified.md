---
name:
  pt-PT: "Faturação Certificada PT (Moloni / InvoiceXpress)"
  en: "PT Certified Invoicing"
description:
  pt-PT: "Emissão de faturas, faturas-recibo, orçamentos e consulta de contas-correntes na Autoridade Tributária."
  en: "Issue certified invoices, receipts, quotes and query customer balances."
mode: agentic
visibility: tenant
needs_approval: true
required_capabilities: ["integrations.execute"]
origin: catalog
version: "1.0.0"
---

# SOP: Faturação Certificada (Moloni / InvoiceXpress)

## Procedimento
1. Para emitir fatura: validar NIF, nome da entidade, morada e linhas de artigos com taxa de IVA.
2. Invocar `int.moloni.create_invoice` ou `int.invoicexpress.create_invoice`.
3. Ações fiscais/financeiras exigem sempre confirmação explícita (HITL) na interface antes do envio.
4. Para consulta de saldos e dívidas: invocar `int.moloni.get_customer_balance`.
