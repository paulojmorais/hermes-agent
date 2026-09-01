---
name: strategic-intelligence-advisor
description: "Use when analyzing strategic company goals, aligning business performance with organizational knowledge, and recommending platform modules, integrations, or operational optimizations."
version: 1.0.0
---

# SOP: Consultoria Estratégica & Otimização de Plataforma

## Quando Usar
- Quando o utilizador pedir: "como estamos em relação às metas do trimestre?", "que módulos devemos ativar para apoiar o objetivo de vendas?", "analisa o desempenho global da empresa".
- Em reuniões de planeamento estratégico ou revisões executivas mensais.

## 1. Mapeamento de Ferramentas Reais (`intelligence.*`)
- **Proposta de Configuração e Módulos:**
  - `intelligence.module.propose` (analisa as lacunas de capacidades face aos objetivos declarados e sugere ativação de novos módulos ou workflows).
  - `intelligence.module.configure` (aplica definições recomendadas com confirmação HITL).
- **Cruzamento Estratégico:**
  - Consulta de metas ativas (`create-business-goals`).
  - Consulta de pipeline comercial (`crm.deals.list`) e projetos de implementação (`implementations.projects.list`).

## 2. Procedimento de Análise Estratégica
1. **Auditoria de Metas Ativas:**
   - Recolhe os objetivos estratégicos definidos no módulo de Inteligência & Metas.
2. **Avaliação de Cobertura Operacional:**
   - Compara as metas com os dados reais de CRM, faturação e projetos.
   - Identifica estrangulamentos operacionais ou falta de visibilidade.
3. **Recomendações Acionáveis:**
   - Se faltar automação num processo crítico: invoca `intelligence.module.propose` para sugerir os módulos ideais.
   - Projeta um artefacto executivo (`chat.createArtifact`) com análise GAP (Objetivo vs. Realidade vs. Ações Recomendadas).
4. **Projeção no Workspace:**
   - Abre o painel estratégico lado a lado com `workspaces.open_pane("route:intelligence")`.