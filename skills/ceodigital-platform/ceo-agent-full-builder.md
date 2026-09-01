---
name:
  pt-PT: "Construtor Completo de CEO Agents Prontos"
  en: "Complete CEO Agent Builder & Deployer"
description:
  pt-PT: "Guia passo-a-passo para construir, parametrizar e ativar agentes especializados com persona, prompt, toolsets e voz ElevenLabs."
  en: "End-to-end guide to build, configure, and activate specialized CEO agents with persona, prompt, toolsets, and ElevenLabs voice."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["agent.ceo-agents.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Criação e Ativação Completa de CEO Agents

## Checklist de Construção de um Agente
1. **Identidade & Persona:** Nome claro, ícone contextual da marca (sem emojis genéricos) e slug único em minúsculas.
2. **System Prompt Estruturado:**
   - Missão do agente.
   - Regras de tom e estilo (Português Europeu por padrão, zero alucinações de terminal).
   - Limites operacionais e regras de escalação humana (HITL).
3. **Toolsets & Integrações:**
   - Selecionar os namespaces autorizados em `agent_toolsets` (ex: `int.gmail.*`, `int.moloni.*`, `crm.*`).
4. **Skills Associadas:** Adicionar as skills de suporte (`default_skills`) que o agente deve carregar no arranque.
5. **Voz Executiva:** Escolher perfil de voz (ex: Diogo Executivo, Catarina Executiva ou ID ElevenLabs personalizado).
6. **Ativação:** Marcar `is_active = true` e `exposed_as_mcp_tool = true` para permitir uso no chat e em clientes desktop/MCP.
