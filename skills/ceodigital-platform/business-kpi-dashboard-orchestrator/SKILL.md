---
name: business-kpi-dashboard-orchestrator
description: "Use when rendering executive business KPI dashboards, aggregating telemetry metrics (pipeline value, MRR, proposals value, overdue workitems, revenue trend) using native dashboard datasources in renderWidget."
version: 1.0.0
---

# SOP: Orquestração de Dashboards Executivos & KPIs de Negócio

## Quando Usar
- Quando o utilizador pedir: "mostra o estado geral do negócio", "gera um dashboard com os indicadores comerciais e financeiros", "qual é o valor do nosso pipeline?", "mostra as propostas e faturas recentes num painel".

## 1. Mapeamento das Datasources Nativas do Sistema (`renderWidget`)
O sistema possui 30+ datasources registadas e pré-integradas prontas para uso:

| Domínio de Negócio | Datasource Nativa (`source`) | Formatos de Visualização (`viz`) |
| :--- | :--- | :--- |
| **Pipeline & Vendas** | `crm.pipelineValue`, `crm.dealsByStage`, `crm.leadsByStage`, `crm.leadsTrend`, `crm.followUpsDue` | `stat`, `bar-chart`, `pie-chart`, `line-chart`, `table` |
| **Propostas & Serviços** | `services.proposalsValue`, `services.recentProposals`, `services.proposalsByStatus` | `stat`, `table`, `pie-chart` |
| **Faturação & Receita** | `commerce.revenueTrend`, `commerce.ordersByStatus`, `wallet.balance` | `line-chart`, `stat`, `pie-chart` |
| **Tarefas & Operações** | `workitems.byStatus`, `workitems.dueSoon`, `workitems.overdue`, `workitems.byAssignee` | `scorecard`, `table`, `bar-chart`, `checklist` |
| **Projetos** | `projects.byStatus`, `projects.openPhases` | `table`, `progress`, `stat` |
| **Documentos & Ficheiros**| `documents.storageUsage`, `documents.recentFiles` | `stat`, `feed`, `table` |
| **Equipa & Colaboração** | `members.count`, `timeline.recentEvents`, `chat.recentConversations` | `stat`, `feed`, `list` |

## 2. Padrões de Construção de Dashboards Multi-Indicador
1. **Quadro Resumo de Desempenho (KPI Cockpit):**
   - Invoca `renderWidget` sequencialmente com métricas complementares (ex: `crm.pipelineValue` + `services.proposalsValue` + `workitems.overdue`).
2. **Uso de Agregações Dinâmicas (`dynamic.aggregate` / `dynamic.timeseries`):**
   - Quando for necessário agregar dados de tabelas específicas com agrupamentos customizados (`groupBy`, `dateRange`).

## 3. Procedimento de Atuação
1. **Identificar os Indicadores Pedidos:** Mapeia a pergunta do utilizador para as datasources correspondentes na tabela acima.
2. **Executar a Invocação:** Invoca `renderWidget` com a `source`, `viz` e `title` adequados.
3. **Comentário Executivo:** Fornece 2 a 3 pontos de análise acionável sobre o que os números revelam.
