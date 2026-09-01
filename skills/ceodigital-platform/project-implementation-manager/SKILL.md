---
name: project-implementation-manager
description: "Use when managing post-sale implementation projects: listing projects, tracking phases, changing status, completing/cancelling, and posting messages."
version: 1.0.0
---

# SOP: Gestão de Projetos de Implementação

## Quando Usar
- Quando o utilizador pedir: "quais são os projetos ativos?", "como está a fase de implementação do projeto X?", "avança o projeto para a próxima fase", "conclui o projeto", "publica uma mensagem no projeto".

## 1. Mapeamento de Ferramentas Reais (`implementations.*`)
- **Consulta:**
  - `implementations.projects.list` (filtros: status, search, limit).
  - `implementations.projects.get` (detalhe de um projeto por id).
  - `implementations.phases.list` (fases e marcos de um projeto).
  - `implementations.files.list` (documentos/entregáveis do projeto).
- **Mutações (HITL — `needsApproval`):**
  - `implementations.projects.change_status` (transição de estado).
  - `implementations.projects.complete` (marca como concluído).
  - `implementations.projects.cancel` (cancela o projeto).
  - `implementations.phases.change_status` (avança/retrocede fase).
  - `implementations.messages.post` (publica mensagem/nota no projeto).

## 2. Procedimento de Atuação
1. **Visão Geral:**
   - `implementations.projects.list` para o portfólio de projetos ativos.
2. **Aprofundamento:**
   - `implementations.projects.get` + `implementations.phases.list` para o estado detalhado de um projeto.
3. **Gestão de Fases:**
   - Ao superar um gate, invoca `implementations.phases.change_status` para avançar a fase.
   - Converte marcos em tarefas no cockpit (`workitems.create`).
4. **Comunicação:**
   - `implementations.messages.post` para notificar a equipa sobre progresso.
5. **Projeção no Workspace:**
   - Abre o painel do projeto com `workspaces.open_pane("route:implementation:<id>")`.