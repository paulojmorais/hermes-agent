---
name:
  pt-PT: "Criador de CEO Agents & Personas"
  en: "CEO Agent & Persona Builder"
description:
  pt-PT: "Ajuda a desenhar personas executivas (CFO, CMO, CTO, SDR), redigir System Prompts estruturados e registar agentes ativos na base de dados."
  en: "Designs executive personas, authors structured system prompts, and registers active CEO agents."
mode: agentic
visibility: tenant
needs_approval: true
required_capabilities: ["agent.ceo-agents.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Criação de CEO Agents & Personas

## Quando Usar
- Quando o utilizador pedir: "cria um CEO agent", "quero uma persona para suporte/vendas", "adiciona um agente especialista".

## Procedimento
1. **Identificar o Papel Executivo:**
   - Pergunta o cargo ou especialidade (ex: Diretor Financeiro, Gestor de Contratos, Analista de Dados B2B).
   - Sugere um nome profissional e define um identificador único (slug).
2. **Redação do System Prompt Especializado:**
   - Define a missão primordial do agente.
   - Escreve 3 a 4 Princípios Operacionais inegociáveis.
   - Define o tom de comunicação (executivo, pragmático, orientado a resultados).
3. **Registo na Base de Dados:**
   - Invoca a tool `agent.agents.create` com `name`, `slug`, `system_prompt`, `model_code` e `default_skills`.
   - Propõe abrir o painel de agentes no Workspace com `workspaces.open_pane("route:agents")`.
