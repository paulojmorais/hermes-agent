---
name: ceo-agent-full-builder
description: "Use when building, configuring, and activating specialized CEO agents with persona, system prompt, toolsets, attached skills, ElevenLabs voice, and MCP exposure."
version: 1.0.0
---

# SOP: Criação e Ativação Completa de CEO Agents

## Checklist de Construção de um Agente
1. **Identidade & Persona:**
   - Nome claro, ícone contextual da marca (sem emojis genéricos) e slug único em minúsculas (`validateAgentFields`).
2. **System Prompt Estruturado:**
   - Missão do agente.
   - Regras de tom e estilo (Português Europeu por padrão, zero alucinações de terminal).
   - Limites operacionais e regras de escalação humana (HITL).
3. **Modelo & Sampling:**
   - `model_code` (padrão `google/gemini-2.5-flash` ou `openrouter/deepseek/deepseek-v4-flash-0731`).
   - `temperature` (0.0–2.0, padrão 0.7) e `max_steps` (1–50, padrão 8).
4. **Toolsets & Integrações:**
   - Selecionar os namespaces autorizados em `agent_toolsets` (ex: `int.gmail.*`, `int.moloni.*`, `crm.*`).
5. **Skills Associadas (`default_skills`):**
   - Adicionar os slugs das skills de suporte que o agente deve carregar no arranque (ex: `crm-pipeline-management`, `invoicing-pt-certified`).
   - Se faltar uma skill específica, criar primeiro via `skills.create_rule`.
6. **Voz Executiva:**
   - Perfil de voz (Diogo Executivo, Catarina Executiva ou ID ElevenLabs personalizado).
7. **Ativação:**
   - `agent.agents.create` com `is_active = true` e opcionalmente `exposed_as_mcp_tool = true` para uso em chat e clientes desktop/MCP.

## Ferramentas Reais
- `agent.agents.create`: Regista o agente + versão v1 (HITL).
- `agent.agents.update`: Ajusta campos pós-criação.
- `agent.agents.list` / `get`: Consulta o catálogo de agentes.
- `agent.ask`: Delega tarefas a outro agente especializado.