---
name: nativeflow-workflow-builder
description: "Use when designing, explaining, drafting, or applying automated NativeFlow workflows with event triggers, AI nodes, conditional logic branches, and spatial workspace actions."
version: 2.0.0
---

# SOP: Construção & Engenharia de Automações no NativeFlow

## Quando Usar
- Quando o utilizador pedir: "desenha um fluxo de trabalho", "como funciona este fluxo?", "adiciona uma condição de validação de faturação a este processo", "transforma este procedimento manual numa automação".

## 1. Mapeamento de Ferramentas Reais (`agentflow.*`)
- **Listagem e Inspeção:**
  - `agentflow.list`: Lista os fluxos existentes no tenant, versões e estado (`active`, `draft`, `paused`).
  - `agentflow.explain({ flowId: "..." })`: Devolve uma explicação em linguagem natural do grafo de nós, entradas e saídas de um fluxo.
  - `agentflow.canvas.read`: Lê o snapshot do grafo de nós atualmente aberto no editor visual.
- **Desenho & Rascunho de Fluxos:**
  - `agentflow.draft`: Cria ou atualiza a estrutura de `nodes` e `edges` em JSON (compatível com os 35+ tipos de nós do motor).
- **Aplicação no Canvas & Execução:**
  - `agentflow.apply` / `agentflow.canvas.apply`: Aplica o rascunho diretamente no editor visual.
  - `agentflow.run({ flowId: "...", inputs: { ... } })`: Dispara a execução assíncrona do fluxo com telemetria.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:agentflow")` ou `workspaces.open_pane("flow:<flowId>")`.

## 2. Princípios de Desenho de Fluxos
1. **Ponto de Entrada Claro:** Todo o fluxo deve começar com um nó de gatilho explícito (`webhook_trigger`, `schedule_trigger`, `db_event_trigger` ou `start`).
2. **Resiliência & Tratamento de Erros:** Fluxos que comunicam com APIs externas devem incluir nós de `try_catch` ou caminhos de `fallback`.
3. **Ações Espaciais no Final:** Quando o fluxo terminar uma operação que exige atenção humana, incluir um nó `workspace_open_pane` ou `render_widget` para projetar os resultados imediatamente no Workspace do utilizador.

## 3. Protocolo de Atuação Imersiva no Workspace
1. **Compreensão do Processo:** Mapeia a sequência lógica: Gatilho ➔ Processamento (LLM / Informa D&B / RAG) ➔ Condições (If/Else) ➔ Saída (Email / Slack / CRM).
2. **Invocação Imediata & Abertura do Canvas:** Executa `agentflow.draft` no primeiro turno e projeta o editor visual no Workspace com `workspaces.open_pane("route:agentflow")` para que o utilizador veja o fluxo a nascer em tempo real.
3. **Execução com Cartão Vivo:** Ao correr o fluxo via `agentflow.run`, o progresso de cada passo é transmitido no chat através de um cartão de execução vivo com formulários de aprovação humana (HITL) integrados.
4. **Aplicação:** Propõe aplicar alterações diretamente no canvas via `agentflow.apply` / `agentflow.canvas.apply`.
