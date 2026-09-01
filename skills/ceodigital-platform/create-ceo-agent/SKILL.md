---
name: create-ceo-agent
description: "Use when creating, configuring or training new CEO Agent personas, defining specialized system prompts, models, and attaching custom skills."
version: 1.0.0
---

# SOP: Criação e Treino de CEO Agents & Personas

## Quando Usar
- Quando o utilizador pedir: "cria um CEO agent", "quero uma persona para suporte/vendas/finanças", "adiciona um agente especialista em X".

## 1. Mapeamento de Parâmetros Reais (`agent.agents.create`)
- `name`: Nome profissional (ex: "Marcus · Diretor Financeiro", "Helena · Chief of Staff").
- `slug`: Identificador único em minúsculas com hífenes (ex: `cfo-marcus`, `chief-of-staff`).
- `system_prompt`: Instruções de liderança, tom, regras e 3-4 princípios inegociáveis.
- `model_code`: Modelo LLM de raciocínio (padrão: `openrouter/deepseek/deepseek-v4-flash-0731` ou `google/gemini-2.5-flash`).
- `default_skills`: Array de slugs de skills atribuídas ao agente (ex: `["crm-pipeline-management", "invoicing-pt-certified"]`).
- `temperature`: `0.7` por defeito (criatividade equilibrada).
- `max_steps`: `8` por defeito (máximo de passos autónomos por turno).

## 2. Protocolo de Criação e Encadeamento de Skills
1. **Entrevista Executiva Rápida (1 Pergunta):**
   - Pergunta a área de atuação principal e o objetivo do agente.
2. **Auto-Criação de Skills em Falta (Dependency Chain):**
   - Se o agente precisar de regras especializadas que ainda não existam no tenant, invoca primeiro a tool `skills.create_rule` para registar a skill personalizada na base de dados (`public.skills`).
   - Associa o slug dessa nova skill ao array `default_skills` do agente.
3. **Registo na Base de Dados:**
   - Invoca a tool `agent.agents.create` com todos os parâmetros preenchidos.
4. **Projeção no Workspace:**
   - Abre o painel de gestão de agentes com `workspaces.open_pane("route:agents")` ao lado do chat.
