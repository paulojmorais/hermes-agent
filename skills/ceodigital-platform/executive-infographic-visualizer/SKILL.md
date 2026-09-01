---
name: executive-infographic-visualizer
description: "Use when creating high-density executive infographics, visual KPI summaries, comparison matrices, funnel charts, and scorecard cards using Live Data Artifacts and HTML5."
version: 1.0.0
---

# SOP: Infografias Executivas & Visualização de Dados

## Quando Usar
- Quando o utilizador pedir: "faz uma infografia com estes resultados", "cria um scorecard visual comparativo entre fornecedores", "mostra o funil de conversão num gráfico elegante", "resume estes dados num card visual de alto impacto".

## 1. Mapeamento de Ferramentas Reais
- **Widget de Dados Vivos (Live Data Artifact):**
  - `renderWidget({ source: "dynamic.dataset", spec: { ... } })`: Renderiza widgets nativos (tabelas ordenáveis, cartões de métricas, semáforos, gráficos de barra ou rosca).
- **Infografia Completa Customizada:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Infografia rica com Tailwind CSS, badges de percentagens, barras de progresso e grelhas de impacto.

## 2. Padrões de Design para Infografias
1. **Composição em Grelha (Bento Grid):**
   - Disposição visual tipo "Bento Box": cartões de diferentes dimensões para destacar a métrica principal (ex: Total Faturado) rodeada por métricas secundárias.
2. **Semáforos de Desempenho & Risco:**
   - 🟢 Verde: Acima da meta / Baixo risco (`bg-emerald-500/10 text-emerald-400 border-emerald-500/20`).
   - 🟡 Amarelo: Atenção / Em análise (`bg-amber-500/10 text-amber-400 border-amber-500/20`).
   - 🔴 Vermelho: Desvio crítico / Ação imediata (`bg-rose-500/10 text-rose-400 border-rose-500/20`).
3. **Micro-Visualizações Embutidas:**
   - Barras de progresso horizontais, mini-gráficos de tendência e tags contextuais.

## 3. Procedimento de Atuação
1. **Hierarquização dos Dados:** Isola as 3 a 5 conclusões mais impactantes dos números fornecidos.
2. **Escolha da Ferramenta:**
   - Se for para interagir com filtros e dados brutos ➔ `renderWidget`.
   - Se for uma peça gráfica para apresentação ou partilha executiva ➔ `chat.createArtifact(kind='html')`.
3. **Apresentação:** Projeta a infografia no chat para visualização imediata pelo utilizador.
