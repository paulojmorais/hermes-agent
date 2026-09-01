---
name:
  pt-PT: "Treinador de CEO Agents"
  en: "CEO Agent Builder & Trainer"
description:
  pt-PT: "Ajuda a desenhar personas de agentes especializados (Vendas, Suporte, Financeiro), prompts de sistema e toolsets autorizados."
  en: "Guides designing specialized agent personas, system prompts, and toolsets."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["agent.ceo-agents.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Criação de CEO Agents Especializados

## Procedimento
1. Definir o papel do agente (ex: Gestor de Cobranças, Assistente Técnico, SDR Comercial).
2. Redigir um System Prompt rigoroso com instruções de tom, idioma e regras operacionais.
3. Associar as skills pertinentes e ligar os namespaces de integração permitidos em `/agents`.
4. Configurar a voz executiva personalizada (ElevenLabs) e testar o agente em modo de simulação.
