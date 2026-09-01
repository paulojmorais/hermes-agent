---
name:
  pt-PT: "Cobrança Amigável de Faturas Vencidas"
  en: "Overdue Invoices & Aging Recovery"
description:
  pt-PT: "Analisa a antiguidade de saldos no ERP (Aging 30/60/90 dias), gera links de pagamento MBWay/Multibanco e redige lembretes amigáveis."
  en: "Analyzes accounts receivable aging (30/60/90 days), creates instant MBWay/ATM payment links, and drafts polite collection reminders."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["payments.read", "payments.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Plano de Cobrança Amigável e Aging

## Quando Usar
- Semanalmente na rotina de tesouraria do CFO ou quando existirem faturas com data limite ultrapassada.

## Procedimento
1. Consultar faturas pendentes no Moloni/ERP agrupando por escalão de antiguidade.
2. Para faturas até 15 dias de atraso: redigir lembrete amigável de cortesia.
3. Gerar link de pagamento direto (Multibanco / MBWay) com a ferramenta de pagamentos.
4. Projetar tabela de aging no Workspace e criar tarefa de acompanhamento no CRM.
