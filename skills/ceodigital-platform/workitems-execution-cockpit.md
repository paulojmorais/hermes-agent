---
name:
  pt-PT: "Cockpit de Tarefas & Execução de SOPs"
  en: "Workitems & SOP Execution"
description:
  pt-PT: "Criação, checklist e acompanhamento de tarefas operacionais com despacho de execução autónoma."
  en: "Creation, assignment and monitoring of operational workitems and checklists."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["workitems.items.read", "workitems.items.create"]
origin: catalog
version: "1.0.0"
---

# SOP: Cockpit de Tarefas & Workitems

## Procedimento
1. Para listar tarefas pendentes: invocar `workitems.list` com filtros por estado (`ready`, `todo`, `running`).
2. Para criar nova tarefa: invocar `workitems.create` com título, responsável e checklist de passos.
3. Para despoletar tarefas automatizáveis: garantir que o estado está em `ready` para permitir `auto_execute`.
