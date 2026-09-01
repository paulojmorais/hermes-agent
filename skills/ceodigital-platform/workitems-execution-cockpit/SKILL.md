---
name: workitems-execution-cockpit
description: "Use when creating, tracking, executing, or approving operational work items — listing open/due tasks, suggesting catalog SOPs, running automations, and submitting outputs."
version: 1.0.0
---

# SOP: Cockpit de Workitems & Execução de Tarefas

## Quando Usar
- Quando o utilizador pedir: "mostra as minhas tarefas", "o que tenho em atraso?", "cria uma tarefa para X", "aprova/responde a este item", "corre esta automação", "sugere um SOP para esta necessidade".

## 1. Mapeamento de Ferramentas Reais (`workitems.*`)
- **Painel "O Meu Dia" (curated view):**
  - `workitems.status` (filtro `mine`, `due_soon` (<3 dias), `awaiting_approval`).
- **Consulta Geral (filtrada):**
  - `workitems.list` com filtros combináveis:
    - `status` (ex: `["todo","ready","running"]`).
    - `subject_type` / `subject_id` (ex: filtrar por projeto/lead).
    - `assignee: "me"`.
    - `due_within_days`.
- **Contexto Completo de um Item:**
  - `workitems.context` (`work_item_id`) — devolve subject, playbook, inputs schema, checklist, artifacts, thread.
- **Sugestão de SOP por Intenção (suggest-lite):**
  - `workitems.suggest` — dados um `intent` em linguagem natural, devolve top-N catalogo SOPs por scoring, com `matched_on`.
- **Criação de Nova Tarefa (HITL — `needsApproval`):**
  - `workitems.create` (campos: `title`, `subject_type`, `catalog_code` para snapshot SOP, `due_at`, `inputs`, `auto_run`).
- **Despacho de Execução / Aprovação (HITL):**
  - `workitems.run` (dispara execução; idempotente via key).
  - `submit_output`, `approve` / `reject` para fluxos de aprovação.

## 2. Procedimento de Atuação
1. **Inspeção do Estado:**
   - `workitems.status({ filter: "due_soon" })` para prioridades imediatas;
   - `workitems.list({ status: ["todo","ready"], assignee: "me" })` para backlog.
2. **Criação Contextual:**
   - Se o item se baseia num SOP do catálogo, passa `catalog_code` para snapshot + checklist automático.
   - Se for ad-hoc AgentFlow, passa `flow_id` (resource_kind=agentflow).
   - Usa `auto_run: true` para itens que devem disparar execução ao ficarem `ready`.
3. **Acompanhamento:**
   - Agrega `workitems.status` para mostrar o resumo "hoje / em atraso / à espera de aprovação".
4. **Projeção no Workspace:**
   - Abre o quadro de tarefas lado a lado com `workspaces.open_pane("route:workitems")`.