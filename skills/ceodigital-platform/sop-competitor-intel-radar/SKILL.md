---
name: sop-competitor-intel-radar
description: "Use when tracking named competitors (pricing, product releases, marketing campaigns, hiring signals, and social presence), calculating Share of Voice, and generating competitive scorecards."
version: 2.0.0
---

# SOP: Radar de Inteligência Competitiva & Benchmark de Concorrência

## Quando Usar
- Quando o utilizador pedir: "faz um radar sobre o concorrente X", "o que a concorrência anda a publicar nas redes sociais?", "quem estão os concorrentes a recrutar?", "prepara um scorecard comparativo de Share of Voice".

## 1. Mapeamento de Ferramentas Reais
- **Pesquisa & Extração Web Verificada:**
  - `webSearch`: Pesquisa dirigida a notícias recentes, comunicados de imprensa e vagas de emprego do concorrente.
  - `fetchUrl`: Leitura estruturada de landing pages, anúncios e blogs de concorrentes.
- **Visualização de Dados (Live Data Artifacts):**
  - `renderWidget({ source: "dynamic.dataset", viz: "table", ... })`: Matriz comparativa de competidores com colunas de posicionamento, pontos fortes e pontos fracos.
  - `executive-infographic-visualizer`: Bento grids e scorecards visuais com semáforos de ameaça.
- **Relatório de Inteligência:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Relatório executivo de mercado.

## 2. As 4 Dimensões de Monitorização de Concorrentes
1. **Posicionamento de Produto & Pricing:**
   - Comparação de funcionalidades chave, novos lançamentos e tiers de preços públicos (`competitor-price-and-product-monitor`).
2. **Presença Digital & Share of Voice:**
   - Frequência de publicação, temáticas abordadas no LinkedIn/Instagram e parcerias anunciadas.
3. **Sinais de Recrutamento (Hiring Signals):**
   - Áreas onde a concorrência está a contratar (ex: equipa de vendas em Espanha, engenheiros de IA, suporte), revelando a direção estratégica da empresa.
4. **Sentimento de Clientes:**
   - Análise de reviews públicas, menções e principais reclamações de clientes do concorrente.

## 3. Procedimento de Atuação
1. **Mapeamento de Alvos:** Define os 2 a 4 concorrentes a auditar.
2. **Recolha de Evidências:** Executa pesquisas estruturadas na web e extrai dados de fontes oficiais verificadas.
3. **Composição do Scorecard:** Agrega as conclusões em tabela comparativa (`renderWidget`) com destaques de diferenciação para a nossa equipa comercial.
