---
name:
  pt-PT: "Validação de Phase Gates em Projetos"
  en: "Project Phase Gate Acceptance Audit"
description:
  pt-PT: "Audita a conclusão de tarefas e entregáveis obrigatórios antes de permitir o avanço de fase ou faturação de tranches do projeto."
  en: "Audits completion of mandatory deliverables and acceptance criteria before transitioning project phases or unlocking billing milestones."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["projects.items.read", "projects.items.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Validação de Critérios de Phase Gate

## Quando Usar
- Ao concluir uma etapa num projeto de prestação de serviços ou implementação tecnológica.

## Procedimento
1. Inspecionar a checklist da fase ativa no módulo Projects/Workitems.
2. Verificar se todos os ficheiros e relatórios obrigatórios estão anexados.
3. Projetar widget `checklist` interativo com o estado de cada critério.
4. Ao aprovar com Teresa (Ops), avançar a fase e disparar notificação ao cliente no Portal.
