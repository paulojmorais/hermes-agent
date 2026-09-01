---
name: crm-pipeline-management
description: "Use when managing the CRM sales pipeline: creating or updating leads, moving deal stages, qualifying contacts, listing overdue follow-ups, and winning/losing opportunities."
version: 1.0.0
---

# SOP: Gestão do Funil de Vendas & Pipeline CRM

## Quando Usar
- Quando o utilizador pedir: "mostra o pipeline de vendas", "quais são as leads em atraso?", "cria uma nova lead para o cliente X", "move o negócio Y para a fase de proposta", "fecha o negócio como ganho/perdido".

## 1. Mapeamento de Ferramentas Reais (`crm.*`)
- **Listagem & Consulta:**
  - `crm.leads.list` (filtros: `status`, `priority`, `search`, `overdueOnly: true`, `assignedToId`).
  - `crm.deals.list` (filtros: `stageId`, `pipelineId`, `status: 'open'|'won'|'lost'`).
  - `crm.persons.list` / `crm.organizations.list` (consulta de contactos e empresas).
- **Criação & Atualização (HITL nas mutações):**
  - `crm.leads.create` (campos: `personId`, `organizationId`, `estimatedValue`, `currency`, `source`, `priority`).
  - `crm.deals.create` (campos: `title`, `leadId`, `pipelineId`, `stageId`, `value`, `currency`, `expectedCloseAt`).
  - `crm.leads.update` / `crm.deals.update` (atualização de notas, follow-ups e valores).
  - `crm.leads.change_stage` / `crm.deals.change_stage` (transição entre etapas do funil).
  - `crm.leads.close_won` / `crm.deals.close_won` ou `close_lost` (conclusão com registo de motivo).

## 2. Procedimento de Atuação
1. **Inspeção e Resumo Imediato:**
   - Quando o utilizador pedir o estado das vendas, invoca `crm.deals.list` e apresenta o volume monetário por etapa e os 3 maiores negócios em risco.
2. **Triagem de Follow-ups em Atraso:**
   - Invoca `crm.leads.list(overdueOnly: true)`. Apresenta lista formatada com contacto, valor e dias em atraso.
3. **Ações no Workspace (Workspace-First):**
   - Se o utilizador quiser ver o quadro Kanban, projeta no ecrã com `workspaces.open_pane("route:leads")` ou `workspaces.open_pane("route:deals")`.
