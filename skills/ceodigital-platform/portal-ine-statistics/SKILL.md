---
name: portal-ine-statistics
description: "Use when retrieving Portuguese official statistical and macroeconomic indicators (INE, Pordata, Banco de Portugal / BPstat) for market sizing, inflation indexes (IPC), sector turnover benchmarks, and cited demographic studies."
version: 2.0.0
---

# SOP: Consulta de Indicadores Estatísticos & Setoriais (INE & BPstat)

## Quando Usar
- Quando o utilizador pedir: "qual é a taxa de inflação / IPC atual em Portugal?", "obtém estatísticas do INE sobre o setor de hotelaria/construção/TI", "qual o volume de negócios médio das PMEs no distrito do Porto?", "preciso de dados demográficos oficiais para um estudo de mercado".

## 1. Mapeamento de Ferramentas & Camadas de Acesso (Camada 2 / 3)
- **Consulta via API / MCP (Camada 3 — Preferencial):**
  - Endpoints oficiais da API do INE (Instituto Nacional de Estatística) e BPstat (Banco de Portugal) para extração de séries temporais estruturadas.
- **Automação Web / Playwright (Camada 2 — Relatórios Complexos):**
  - `browser.launch({ initialUrl: "https://www.ine.pt" })` via CEODigital Companion Desktop.
  - `fetchUrl` / `webSearch`: Leitura direta de comunicados de imprensa e destaques estatísticos.
- **Visualização de Dados (Live Data Artifacts):**
  - `renderWidget({ source: "dynamic.dataset", viz: "line-chart" | "bar-chart", ... })`: Gráficos de séries cronológicas e comparações setoriais.
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Relatório de estudo de mercado com dados citados.

## 2. Principais Indicadores Económicos Monitorizados
1. **Índice de Preços no Consumidor (IPC / Inflação):**
   - Variação homóloga e mensal oficial utilizada para atualização de contratos e rendas.
2. **Estatísticas Setoriais por Código CAE:**
   - Número de empresas ativas, volume de negócios agregado, valor acrescentado bruto (VAB) e pessoal ao serviço por setor.
3. **Indicadores de Emprego & Remunerações:**
   - Taxa de desemprego regional, remuneração bruta média mensal por setor e escalões etários.
4. **Taxas de Juro & Câmbios (BPstat):**
   - Taxas Euribor (3M, 6M, 12M), spreads médios de crédito a empresas e indicadores de endividamento do setor não financeiro.

## 3. Regra de Ouro: Citação Obrigatória de Fontes
- **NUNCA inventar ou estimar estatísticas governamentais.**
- Toda a resposta deve incluir explicitamente: (a) Nome da entidade emissora (*INE / Banco de Portugal / Pordata*), (b) Período de referência (*ex: 2º Trimestre 2026*), (c) Data de publicação oficial e URL da fonte.

## 4. Procedimento de Atuação
1. **Identificação do Indicador:** Isola o código CAE, métrica ou região geográfica solicitada.
2. **Extração:** Consulta os dados estruturados via API ou extração verificada.
3. **Apresentação:** Renderiza o gráfico ou scorecard visual no chat e cita a fonte oficial.
