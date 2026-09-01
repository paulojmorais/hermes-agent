---
name: cashflow-forecast-simulator
description: "Use when building 12-month cash flow forecasts with scenario simulation, sandboxed Python computation, and live interactive rendering."
version: 1.0.0
---

# SOP: Simulador de Fluxo de Caixa a 12 Meses

## Quando Usar
- Quando o utilizador pedir: "simula o fluxo de caixa do próximo ano", "cria um cenário otimista/pessimista de caixa", "como vamos estar de tesouraria em dezembro?".

## 1. Recolha de Dados
- Entradas: receitas esperadas (propostas em aberto, incoming), despesas, CAPEX.
- `crm.deals.list`: Oportunidades com valor esperado por mês.
- `services.proposals.list`: Pagamentos agendados.
- `int.moloni.invoices.list`: Faturas emitidas e prazos.

## 2. Sandbox Python — Motor Cénico
```python
def cashflow_forecast(inflows, outflows, months=12):
    """Gera série de fluxo de caixa mensal com cenário base."""
    cumulative = []
    balance = 0
    for t in range(months):
        net = (inflows[t] if t < len(inflows) else 0) - (outflows[t] if t < len(outflows) else 0)
        balance += net
        cumulative.append(balance)
    return cumulative
```

## 3. Rendering no Widget de Artefactos Vivos
1. **Cálculo em Sandbox:** Executa o script com cenários base, otimista (+15% receitas) e pessimista (−20% receitas).
2. **Renderização Interativa:** Gera artefacto HTML com gráfico de linha dos 3 cenários e tabela mensal.
3. **Análise:** Apresenta os meses crítissos de tesouraria (pico negativo) e recomendações (adiantar tranches, renunciar CAPEX).