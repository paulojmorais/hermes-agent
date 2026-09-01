---
name: boardroom-multiagent-debate
description: "Use when running multi-agent executive boardroom debates (CEO, Commercial, Legal, Operations, Financial personas) to stress-test decisions, resolve conflicts, and produce an ExecutiveDecisionCard artifact."
version: 1.0.0
---

# SOP: Mesa Redonda & Debate Multi-Agente (Boardroom)

## Quando Usar
- Quando o utilizador pedir: "vamos fazer uma reunião de administração sobre X", "pede a opinião do diretor financeiro e do advogado sobre esta proposta", "debate entre os agentes", ou quando ativar o modo `chat:default?mode=boardroom`.
- Para decisões estratégicas de alto impacto (expansão, contratações chave, preços, rescisões).

## 1. Mapeamento de Ferramentas Reais & Personas
- **Orquestração de Agentes Especializados:**
  - `agent.agents.list` / `agent.agents.get`: Identifica as personas ativas da empresa.
  - `agent.ask`: Delega a análise e recolha do parecer individual de cada agente especialista:
    - **Diogo (Comercial / Growth):** Foco em receita, conversão e expansão de mercado.
    - **Duarte (Legal / Risco):** Foco em conformidade regulatória, RGPD e mitigação de risco contratual.
    - **Teresa (Operações / Delivery):** Foco em capacidade técnica, SLAs e phase gates.
    - **Sofia / Financeiro:** Foco em margens, tesouraria e retorno do investimento (ROI).
- **Projeção de Artefacto:**
  - `chat.createArtifact(kind='html')` ou `renderWidget`: Renderiza o **ExecutiveDecisionCard** com o sumário de votos e recomendações.

## 2. Procedimento de Condução do Debate
1. **Enquadramento do Dilema:**
   - Define com clareza o problema estratégico, os dados disponíveis e os objetivos da decisão.
2. **Consulta aos Especialistas:**
   - Consulta sequencial ou paralela aos agentes relevantes através de `agent.ask`.
   - Cada especialista apresenta: **Argumento Principal**, **Ponto Cego Identificado** e **Condição de Aprovação**.
3. **Síntese de Convergência:**
   - Cruza os pareceres e aponta os pontos de consenso e de atrito.
4. **Entrega do `ExecutiveDecisionCard`:**
   - Gera um artefacto visual interativo contendo:
     - Resumo da Decisão Recomendada.
     - Prós & Contras ponderados por área.
     - Ações imediatas a delegar via `workitems.create`.
