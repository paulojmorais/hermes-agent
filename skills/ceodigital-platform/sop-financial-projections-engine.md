---
name:
  pt-PT: "Motor de Projeções Financeiras VAL e TIR"
  en: "Financial Projections Engine (NPV / IRR)"
description:
  pt-PT: "Modela a demonstração de resultados previsional a 5 anos, calcula o VAL, a Taxa Interna de Rentabilidade (TIR) e o período de Payback em Sandbox."
  en: "Models 5-year forecast P&L, computing Net Present Value (NPV), Internal Rate of Return (IRR), and Payback period in Python Sandbox."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["dashboards.read", "chat.conversation.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Modelação Financeira e Cálculo de Viabilidade

## Quando Usar
- Em dossiers de investimento, planos de negócio e candidaturas que exigem estudo de viabilidade económica.

## Procedimento
1. Recolher premissas de investimento (Capex, Opex, projeção de vendas e custo de capital WACC).
2. Executar script Python na Sandbox com a biblioteca `numpy-financial` para cálculo exato de fluxos descontados.
3. Projetar o widget `metric-grid` no Workspace com VAL, TIR, Payback e EBITDA previsional.
4. Gerar folha de cálculo Excel (.xlsx) completa com fórmulas dinâmicas para validação do banco/analista.
