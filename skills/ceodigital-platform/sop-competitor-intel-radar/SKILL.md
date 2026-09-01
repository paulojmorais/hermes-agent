---
name: sop-competitor-intel-radar
description: "pt-PT: "Monitoriza concorrentes designados (preços, novos produtos, presença social e contratações), calculando Share of Voice e gerando scorecards."
version: 1.0.0
---

# SOP: Radar de Concorrência e Benchmark de Mercado

## Quando Usar
- Em workspaces de Estratégia, Vendas ou Marketing quando o utilizador pedir para mapear ou comparar concorrentes.

## Procedimento
1. Recolher lista de domínios e redes sociais dos concorrentes.
2. Executar recolha de dados via `webSearch` e Playwright Browser Co-Working em páginas públicas.
3. Processar métricas em Sandbox Python calculando Share of Voice, variação de preços e tópicos em alta.
4. Projetar Live Data Artifact (`scorecard` e `bar-chart`) e registar conclusões no dossiê de mercado.
