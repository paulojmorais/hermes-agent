---
name: sales-meeting-transcript-to-crm
description: "Use when processing meeting transcripts, extracting customer pain points, agreed action items, objections, and automatically updating CRM stages and tasks."
version: 1.0.0
---

# SOP: Extração de Decisões de Reunião para o CRM

## Quando Usar
- Quando o utilizador fornecer a transcrição ou resumo de uma reunião comercial, ou pedir: "processa a ata desta reunião e atualiza o CRM", "extrai as tarefas e o próximo passo desta chamada".

## 1. Mapeamento de Ferramentas Reais
- `crm.deals.add_note` / `crm.leads.add_note`: Registo da ata e resumo estruturado na oportunidade.
- `crm.deals.change_stage`: Avanço da etapa do negócio quando houver compromisso formal (ex: passar a "Proposta").
- `workitems.create`: Criação de tarefas de follow-up com prazos e responsáveis.
- `int.gmail.create_draft`: Rascunho de email de agradecimento e alinhamento pós-reunião.

## 2. Procedimento de Extração
1. **Identificação de Entidades Chave:**
   - Extrai: Necessidades declaradas pelo cliente, Objeções levantadas, Prazos pretendidos e Decisores presentes.
2. **Atualização Imediata do CRM:**
   - Invoca `crm.deals.add_note` para anexar o resumo executivo.
   - Se acordado envio de proposta: invoca `crm.deals.change_stage` para mover a etapa do funil.
3. **Criação de Próximos Passos:**
   - Invoca `workitems.create` para cada ação prometida ao cliente.
   - Prepara o rascunho de email de recap para envio pelo comercial.
