---
name: sop-n8n-flow-telemetry
description: "Use when monitoring execution health, node run telemetry, latency, error rates, and retry policies across connected n8n, Flowise, or NativeFlow automation instances."
version: 2.0.0
---

# SOP: Telemetria de Execuções n8n, Flowise & NativeFlow

## Quando Usar
- Em revisões técnicas de automação ou quando o utilizador pedir: "como está o desempenho das nossas automações?", "quantos fluxos falharam hoje no n8n?", "qual o tempo médio de resposta dos webhooks?", "mede a taxa de sucesso das integrações".

## 1. Mapeamento de Ferramentas Reais
- **Consulta de Execuções e Telemetria:**
  - `agentflow.runs.list`: Devolve lista de corridas com timestamp, duração (ms), passos executados e estado final (`completed`, `failed`, `running`).
  - `renderWidget({ source: "agentflow.runsByStatus", viz: "pie-chart" })`: Gráfico de distribuição de execuções por estado (Sucesso vs. Falhas).
- **Métricas de Infraestrutura & Custos:**
  - `wu-cost-telemetry-and-optimization-advisor`: Medição do impacto das execuções em Workspace Units (WUs).
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:agentflow")`: Painel de automações com métricas de execução em tempo real.

## 2. Indicadores-Chave de Desempenho (SLAs de Automação)
1. **Taxa de Sucesso (Success Rate):** Meta > 99.0% para fluxos críticos de faturação e CRM.
2. **Latência Média por Execução:** Alerta se o tempo de resposta exceder 5.000ms em fluxos síncronos.
3. **Erros Recorrentes (Top Failures):** Agrupamento por código de erro (401 Auth, 429 Rate Limit, 500 External Service).

## 3. Procedimento de Atuação
1. **Recolha de Métricas:** Extrai os dados das execuções das últimas 24h/7d via `agentflow.runs.list`.
2. **Cálculo dos Rácios:** Identifica a percentagem de sucesso e os fluxos com maior número de reenvios.
3. **Visualização:** Apresenta o gráfico de status via `renderWidget` e aponta recomendações preventivas (ex: aumentar timeouts ou ativar filas).
