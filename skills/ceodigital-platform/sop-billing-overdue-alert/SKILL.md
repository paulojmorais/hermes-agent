---
name: sop-billing-overdue-alert
description: "Use when monitoring overdue invoices, generating staggered dunning alerts, and scheduling follow-ups for late payments."
version: 1.0.0
---

# SOP: Gestão e Cobrança de Faturas Vencidas

## Quando Usar
- Quando o utilizador disser: "quais faturas estão em atraso?", "inicia as cobranças das dívidas", "envia lembretes de pagamento".

## 1. Mapeamento de Ferramentas Reais
- `int.moloni.invoices.list` (com filtro de estado "pago" vs "emitida" e data de vencimento).
- `services.proposals.list` / `services.proposals.get`.
- `int.gmail.create_draft` / `int.outlook.create_draft`: Rascunhos de emails de cobrança.
- `workitems.create`: Criação de tarefa de follow-up de cobrança para o comercial/responsável.

## 2. Procedimento de Cobrança Escalonada (Dunning)
1. **Deteção de Vencidas:** Filtra as faturas com vencimento ultrapassado e valor por liquidar.
2. **Fase 1 — Aviso Amigável (até 7d):** Redige rascunho de email educado a relembrar o vencimento.
3. **Fase 2 — Alerta Formal (7-21d):** Contacto mais formal com detalhe do valor, juros se aplicável e nova data.
4. **Fase 3 — Última Notificação (>21d):** Se aplicável, menciona possível impacto no credit score e escalada.
5. **Registo e Follow-up:** Cria o `workitems` de acompanhamento com prazo e responsável.