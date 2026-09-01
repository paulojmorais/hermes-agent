---
name: dynamic-dataset-visualizer
description: "Use when the agent needs to present, compare, aggregate, or visualize ad-hoc data using the universal dynamic.dataset engine (renderWidget with tables, charts, scorecards, checklists, and action buttons)."
version: 1.0.0
---

# SOP: Visualização & Comparação de Dados com Dynamic Datasets (Live Data Artifacts)

## Quando Usar
- Quando o utilizador pedir para: "compara estes valores", "mostra uma tabela interativa", "faz um gráfico de barras com estes resultados", "apresenta os dados calculados", "cria um scorecard visual com botões de ação".
- Quando o agente calcular dados ad-hoc em memória ou via Python (`execute_code`) e precisar de apresentá-los com **Generative UI** de alta fidelidade em vez de despejar tabelas Markdown estáticas e feias.

## 1. Mapeamento de Ferramentas Reais (`renderWidget`)
- **A Ferramenta Central:** `renderWidget`
  - `source`: `"dynamic.dataset"` (ou `"dynamic.aggregate"`, `"dynamic.timeseries"`, `"dynamic.filteredList"`)
  - `viz`: `"table"` | `"bar-chart"` | `"line-chart"` | `"pie-chart"` | `"stat"` | `"checklist"` | `"scorecard"` | `"metric-grid"` | `"feed"` | `"progress"`
  - `title`: Título claro do widget.
  - `params`: Payload estruturado com `kind` discriminado.

## 2. Padrões de Estruturação do `dynamic.dataset`

### A. Tabelas Comparativas & Dados Estruturados (`kind: "rows"`)
Ideal para comparações de fornecedores, extratos reconciliados, listas filtradas e auditorias:
```json
{
  "source": "dynamic.dataset",
  "viz": "table",
  "title": "Comparativo de Propostas Comerciais",
  "params": {
    "kind": "rows",
    "columns": [
      { "key": "fornecedor", "label": "Fornecedor / Parceiro" },
      { "key": "valor", "label": "Valor Proposto (€)" },
      { "key": "prazo", "label": "Prazo de Entrega" },
      { "key": "score", "label": "Pontuação Técnica" }
    ],
    "rows": [
      { "fornecedor": "Fornecedor Alfa", "valor": "12.500 €", "prazo": "15 dias", "score": "9.4 / 10" },
      { "fornecedor": "Fornecedor Beta", "valor": "14.200 €", "prazo": "10 dias", "score": "8.8 / 10" }
    ],
    "actions": [
      {
        "id": "aprovar_alfa",
        "label": "Adjudicar ao Fornecedor Alfa",
        "variant": "default",
        "prompt": "Gera a minuta de contrato para o Fornecedor Alfa no valor de 12.500€"
      }
    ]
  }
}
```

### B. Gráficos de Barras / Linhas / Séries Temporais (`kind: "series"`)
Ideal para tendências de vendas, evolução de despesas ou previsões:
```json
{
  "source": "dynamic.dataset",
  "viz": "bar-chart",
  "title": "Evolução Mensal de Faturação",
  "params": {
    "kind": "series",
    "points": [
      { "label": "Jan", "value": 15400 },
      { "label": "Fev", "value": 18200 },
      { "label": "Mar", "value": 22500 }
    ]
  }
}
```

### C. Cartões de Métricas & Indicadores Rápidos (`kind: "number"`)
Ideal para resumos financeiros e KPIs imediatos:
```json
{
  "source": "dynamic.dataset",
  "viz": "stat",
  "title": "Margem Bruta Média",
  "params": {
    "kind": "number",
    "value": 38.5,
    "unit": "%",
    "delta": 4.2
  }
}
```

## 3. Botões de Ação Interativos (`actions`)
- Cada tabela ou scorecard pode incluir `actions[]` com `label`, `variant` (`default`, `outline`, `destructive`, `secondary`) e `prompt`.
- Clicar no botão aciona imediatamente o prompt de volta para o agente no chat.

## 4. Regras Não-Negociáveis
1. **Zero Markdown Dump:** Nunca despejar tabelas de mais de 5 linhas em Markdown bruto quando o utilizador pede visualização/comparação; usar SEMPRE `renderWidget` com `dynamic.dataset`.
2. **Invocação Imediata:** Invocar a tool no mesmo turno em que os dados são processados.
