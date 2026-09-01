---
name: sop-playbook-workitems-architect
description: "Use when structuring the operational triad of SOP catalogs, playbooks, and workitems — creating reusable procedures, grouping into phased playbooks, and instantiating executable tasks tied to business entities."
version: 1.0.0
---

# SOP: Arquitetura de Procedimentos (SOPs), Playbooks e Workitems

## Conceitos Fundamentais
1. **Catálogo de Procedimentos (SOPs):** Modelo/receita abstrato reutilizável (ex: "Qualificação B2B", "Emissão de Certidão"). Define inputs necessários e recursos executores.
2. **Playbooks:** Coleções ordenadas de SOPs agrupadas por fases lógicas de um processo de negócio.
3. **Workitems:** As instâncias reais de execução. Cada workitem liga-se a uma entidade concreta (`lead`, `deal`, `organization` ou `project`).

## 1. Mapeamento de Ferramentas Reais (`workitems.*`)
- `workitems.create`: Instancia um workitem. Parâmetros-chave:
  - `subject_type` (`lead`|`deal`|`organization`|`project`) e `subject_id`.
  - `catalog_code` (SOP a snapshot) → preenche checklist automaticamente.
  - `resource_kind` (`manual`|`skill`|`agentflow`|`composio`|`agent`).
  - `flow_id` (aponta para um NativeFlow publicado, resource_kind=agentflow).
  - `auto_run` (dispara execução quando o item fica `ready`).
- `workitems.suggest`: Sugere o SOP do catálogo mais adequado a um `intent`.
- `workitems.run` / `submit_output`: Executa e devolve resultado.

## 2. Procedimento de Criação e Execução
1. **Criar Novo Procedimento Padrão:**
   - Aceder a `/workitems` (tab Procedimentos) e definir inputs/checklists.
   - Como alternativa rápida, usar `workitems.suggest` para encontrar o SOP existente.
2. **Agrupar em Playbook:**
   - Associar os procedimentos às respetivas fases em `/workitems` (tab Playbooks).
3. **Instanciar num Registo de Negócio:**
   - Ao ganhar um Deal ou abrir um Projeto, invocar `workitems.create` com `subject_type` e `subject_id` + `catalog_code`.
4. **Execução Automatizável:**
   - Para tarefas com `resource_kind` = `agent`|`skill`|`agentflow`, garantir estado `ready` para permitir `auto_run`/`auto_execute`.