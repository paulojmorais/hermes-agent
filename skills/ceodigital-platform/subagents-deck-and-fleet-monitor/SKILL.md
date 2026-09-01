---
name: subagents-deck-and-fleet-monitor
description: "Use when delegating parallel background subtasks (delegate_task), opening the Live Subagents Deck (subagents:deck), or monitoring asynchronous agent run executions and telemetry."
version: 1.0.0
---

# SOP: Delegação de Tarefas Paralelas & Monitorização no Subagents Deck

## Quando Usar
- Quando uma tarefa for complexa ou demorada e beneficiar de execução paralela em segundo plano (ex: analisar 5 propostas em simultâneo, varrer múltiplos portais, processar um lote de ficheiros).
- Quando o utilizador pedir: "executa isto em segundo plano", "mostra o estado dos subagentes", "acompanha o progresso da tarefa paralela".

## 1. Mapeamento de Ferramentas Reais
- **Delegação Paralela:**
  - `delegate_task({ tasks: [{ goal: "...", context: "..." }] })`: Despacha subagentes autónomos em sessões isoladas.
- **Projeção do Deck de Subagentes:**
  - `workspaces.open_pane("subagents:deck")`: Abre o painel visual com a frota de subagentes em execução, mostrando tempos, consumo e estado (running, completed, failed).
- **Consulta de Histórico de Execuções:**
  - `agentflow.runs.list` / `playbook.runs.list`: Consulta os registos de execuções passadas.

## 2. Boas Práticas de Delegação
1. **Instruções Autónomas e Auto-Contidas:**
   - Cada subagente corre em contexto isolado. O campo `context` deve conter todos os dados, caminhos de ficheiro e regras necessárias para completar o `goal`.
2. **Não Fazer Polling Cego:**
   - O resultado da delegação reentra automaticamente na conversa principal assim que o trabalho for concluído.
3. **Visibilidade Imediata:**
   - Ao disparar 2 ou mais tarefas paralelas, abrir proativamente o `subagents:deck` para que o utilizador veja o progresso ao vivo.

## 3. Procedimento de Atuação
1. **Divisão em Sub-Tarefas:** Divide o problema em objetivos independentes.
2. **Disparo Simultâneo:** Invoca `delegate_task` com a lista de tarefas.
3. **Abertura do Deck:** Abre o painel `workspaces.open_pane("subagents:deck")`.
4. **Consolidação:** Quando as respostas dos subagentes chegarem, sintetiza as conclusões para o utilizador.
