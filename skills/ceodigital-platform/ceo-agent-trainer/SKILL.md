---
name: ceo-agent-trainer
description: "Use when creating, refining, parametrizing, or training specialized CEO Agent personas, defining system prompts, assigning authorized toolsets, and testing executive tone and performance."
version: 2.0.0
---

# SOP: Treino & Parametrização de CEO Agents

## Quando Usar
- Quando o utilizador pedir: "treina um novo agente para a área comercial", "ajusta as regras e prompt do Marcus (CFO)", "restringe as ferramentas a que o agente tem acesso", "testa as respostas deste agente antes de o ativar para a equipa".

## 1. Mapeamento de Ferramentas Reais (`agent.agents.*`)
- **Gestão de Agentes:**
  - `agent.agents.list`: Lista os agentes e personas registados no tenant.
  - `agent.agents.get({ id: "..." })`: Obtém a definição completa de um agente (system prompt, modelo, toolsets autorizados, default_skills, voz ElevenLabs).
  - `agent.agents.create`: Cria uma nova persona executiva com versão inicial v1.
  - `agent.agents.update`: Atualiza instruções de sistema, modelo ou competências associadas.
- **Delegação e Teste de Persona:**
  - `agent.ask({ targetAgentSlug: "...", prompt: "..." })`: Testa a resposta do agente num cenário simulado.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:agents")` ou `workspaces.open_pane("chat:<agentId>")`.

## 2. Anatomia de um CEO Agent de Alta Performance
1. **Identidade & Missão:**
   - Nome próprio executivo, cargo claro (ex: *Gonçalo · Diretor Comercial & Crescimento*, *Duarte · Assuntos Jurídicos & DPO*), slug único em minúsculas e ícone contextual.
2. **System Prompt Estruturado (Os 4 Blocos Obrigatórios):**
   - **(a) Papel & Autoridade:** Âmbito de decisão e responsabilidades da persona.
   - **(b) Tom de Voz & Estilo:** Linguagem direta, técnica e executiva em Português Europeu.
   - **(c) Limites & Portões HITL:** Ações que exigem sempre confirmação do utilizador antes de executar (ex: envio de propostas >10k€, exclusão de dados).
   - **(d) Ferramentas & Fontes de Verdade:** Quais as tools e bases de conhecimento a consultar.
3. **Restrição de Toolsets (`agent_toolsets`):**
   - Atribuir apenas os namespaces estritamente necessários à função (ex: o agente Legal tem `governance.*`, `documents.*`; o Financeiro tem `invoices.*`, `banking.*`).
4. **Skills Canónicas Associadas (`default_skills`):**
   - Declarar os slugs das skills de suporte que o agente deve carregar no arranque (ex: `crm-pipeline-management`, `invoicing-pt-certified`).

## 3. Procedimento de Treino
1. **Diagnóstico do Perfil:** Define o papel e o conjunto de responsabilidades com o utilizador.
2. **Redação do Prompt e Configuração:** Compõe o `system_prompt` estruturado e seleciona o modelo ideal (Flash vs. Raciocínio).
3. **Persistência & Ativação:** Invoca `agent.agents.create` ou `agent.agents.update` com `is_active: true`.
4. **Validação:** Dispara um teste prático via `agent.ask` e abre o painel de agentes no Workspace.
