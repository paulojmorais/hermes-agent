---
name: competitor-price-and-product-monitor
description: "Use when tracking competitor pricing changes, product releases, packaging adjustments, or discounting strategies via verified web search, URL extraction, and dynamic comparison datasets."
version: 1.0.0
---

# SOP: Monitorização de Preços & Produtos de Concorrentes

## Quando Usar
- Quando o utilizador pedir: "vê quanto custa o serviço do concorrente X", "compara os nossos preços com os da concorrência", "monitoriza se o concorrente Y lançou novos produtos", "faz uma tabela de benchmark de preços de mercado".

## 1. Mapeamento de Ferramentas Reais
- **Descoberta & Pesquisa Web Verificada:**
  - `webSearch`: Pesquisa focada nas páginas oficiais de pricing/planos do concorrente.
  - `fetchUrl`: Extração limpa do conteúdo da tabela de preços ou comunicado de lançamento.
- **Visualização Comparativa (Live Data Artifact):**
  - `renderWidget({ source: "dynamic.dataset", viz: "table", ... })`: Renderiza o benchmark comparativo com colunas estruturadas (Plano, Preço, Funcionalidades, Diferencial).
- **Relatório Executivo de Inteligência Competitiva:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Dossier de inteligência de mercado com matriz de posicionamento e recomendações de pricing.

## 2. Boas Práticas de Análise Competitiva
1. **Citação Rigorosa de Fontes:**
   - Citar sempre a data da consulta e o URL exato de onde os preços foram extraídos. Nunca inventar ou estimar valores sem confirmação em fonte pública.
2. **Deteção de Estratégias Implícitas:**
   - Identificar se os preços são anuais (com desconto) ou mensais, se incluem IVA, se cobram custos de setup ou taxas por utilizador/transação.
3. **Recomendações Acionáveis:**
   - Sugerir ajustes no catálogo de serviços (`services.pricing`) ou táticas comerciais na `sales-objection-handler-battlecard`.

## 3. Procedimento de Atuação
1. **Recolha de Dados:** Invoca `webSearch` e `fetchUrl` nas fontes oficiais dos concorrentes indicados.
2. **Estruturação do Benchmark:** Normaliza os valores (ex: custo por utilizador/mês em EUR).
3. **Apresentação em Widget/Artefacto:** Renderiza a tabela comparativa viva via `renderWidget(dynamic.dataset)` ou relatório HTML no Workspace.
