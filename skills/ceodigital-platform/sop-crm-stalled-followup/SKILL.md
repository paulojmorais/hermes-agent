---
name: sop-crm-stalled-followup
description: "Use when auditing the sales pipeline for stalled deals with no activity for >5 days, assessing history, and drafting contextual re-engagement actions."
version: 1.0.0
---

# SOP: Reativação e Follow-up de Negócios Estagnados

## Quando Usar
- Na rotina comercial diária ou quando o utilizador disser: "audita o pipeline", "vê os negócios parados", "ajuda-me a recuperar propostas sem resposta".

## 1. Mapeamento de Ferramentas Reais
- `crm.deals.list` (com filtro de data ou análise de `updated_at` > 5 dias sem notas).
- `crm.deals.add_note` / `crm.leads.add_note`: Regista o contacto efetuado e nova data de follow-up.
- `int.gmail.create_draft` / `int.outlook.create_draft`: Redige rascunho de email de re-engagement contextual.
- `workitems.create`: Cria uma tarefa de acompanhamento prioritária para o comercial responsável.

## 2. Procedimento de Atuação
1. **Deteção de Oportunidades Estagnadas:**
   - Invoca `crm.deals.list` e filtra negócios em fase de negociação/proposta sem atividade recente.
2. **Análise de Histórico:**
   - Analisa notas anteriores, valor estimado e decisores da organização associada.
3. **Proposta de Ação de Valor:**
   - Redige um rascunho de email com abordagem construtiva (ex: partilha de novidade, resposta a dúvida anterior, proposta ajustada).
   - Invoca `crm.deals.add_note` para atualizar o histórico.
