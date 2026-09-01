---
name: executive-weekly-review
description: "Use when running a weekly executive reset and planning session: auditing the sales pipeline, pending tasks, expiring proposals, and drafting the weekly action plan."
version: 1.0.0
---

# SOP: Reset Executivo Semanal & Planeamento

## Quando Usar
- À segunda-feira de manhã ou sexta-feira à tarde, quando o utilizador pedir: "faz o resumo da semana", "planeia a próxima semana", "o que temos pendente?".

## 1. Fontes de Dados para o Resumo
- **Pipeline de Vendas:** `crm.deals.list`, `crm.leads.list` (com `overdueOnly: true` para follow-ups em atraso).
- **Propostas:** `services.proposals.list` (propostas enviadas que expiram em breve).
- **Tarefas:** `workitems.status({ filter: "due_soon" })` + `workitems.list({ status: ["todo","ready","awaiting_approval"] })`.
- **Projetos:** `implementations.projects.list` (estado das entregas ativas).

## 2. Estrutura do Relatório Semanal
1. **📈 Estado Comercial:**
   - Volume de negócios em aberto por etapa.
   - Leads/deals em atraso e propostas a expirar nos próximos 7 dias.
2. **✅ Execução Operacional:**
   - Tarefas concluídas na semana anterior.
   - Pendentes prioritárias e itens em espera de aprovação.
   - Marcos de projetos entregues/em risco.
3. **🎯 Plano de Ação da Próxima Semana:**
   - Top 3 prioridades com responsável e prazo.
   - Recomendações proativas (ex: reativar negócio parado, acelerar proposta X).

## 3. Procedimento
1. **Recolha Paralela:** Invoca as tools de CRM, propostas, workitems e projetos.
2. **Síntese Executiva:** Agrega num resumo claro e denso (não um despejo de dados).
3. **Criação de Prioridades:** Para as ações da semana, invoca `workitems.create` com prazos e responsáveis.
4. **Artefacto/Widget:** Opcionalmente renderiza um dashboard semanal (`renderWidget`/`chat.createArtifact`) com KPIs.