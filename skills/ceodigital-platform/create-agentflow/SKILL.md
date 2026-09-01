---
name: create-agentflow
description: "Use when creating, editing or drafting visual AgentFlow workflows, automated node graphs, triggers and integrations."
version: 1.0.0
---

# SOP: Criação de Fluxos e Automações no AgentFlow

## Quando Usar
- Quando o utilizador pedir: "cria um fluxo", "quero automatizar X", "faz um agentflow que recebe um webhook e envia um email/avisa no Slack".

## 1. Tipologia de Nós Disponíveis no Motor
- **Triggers (Gatilhos):** `webhook` (HTTP POST), `schedule` (cron periódica), `manual` (botão no chat).
- **Ações:** `httpRequest` (APIs externas), `llm` (processamento de texto), `agent` (sub-agente), `integration` (Composio/Nango).
- **Lógica:** `condition` (If/Else), `loop` (iteração), `conditionAgent` (classificação com IA).
- **Saídas:** `sendEmail` (Gmail/Outlook), `slack` (canais), `notification` (in-app).

## 2. Protocolo de Criação Imediata (Zero-Procrastinação)
1. **Interpretação e Construção do Grafo:**
   - Mapeia o gatilho inicial, nós de processamento intermédios e ação de saída final.
2. **Invocação Imediata:**
   - **Invoca a tool `agentflow.draft` no primeiro turno** passando a estrutura de `nodes` e `edges`.
   - **Regra de Ouro:** Nunca peças confirmações antes de gerar o rascunho. Apresenta o rascunho visual logo no chat.
3. **Aplicação no Canvas:**
   - Propõe aplicar o rascunho ao editor visual com `agentflow.canvas.apply`.
   - Se o utilizador quiser acompanhar visualmente, abre a aba no Workspace com `workspaces.open_pane("route:agentflow")`.
