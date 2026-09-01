---
name: sop-financial-projections-engine
description: "Use when building financial projections (VAN, TIR, Payback, cash flow) using sandboxed Python computations and rendering dynamic results."
version: 1.0.0
---

# SOP: Motor de Projeções Financeiras (VAN, TIR, Payback)

## Quando Usar
- Quando o utilizador pedir: "faz a projeção de retorno deste projeto", "calcula o VAL e a TIR", "quanto tempo demora o payback?", "projeta o fluxo de caixa a 12 meses".

## 1. Mapeamento de Ferramentas Reais
- **Sandbox Python (`execute_code`):** Calcula métricas financeiras complexas.
- `crm.deals.get`: Valor e termos comerciais do negócio.
- `services.proposals.list`: Estrutura de pagamentos e tranches.
- `renderWidget` / `chat.createArtifact(kind='html')`: Renderização visual dos KPIs.

## 2. Fórmulas Financeiras Utilitárias
```python
def npv(rate, cashflows):
    """Valor Atual Líquido (VAN)"""
    return sum(cf / (1 + rate) ** t for t, cf in enumerate(cashflows))

def irr(cashflows, guess=0.1):
    """Taxa Interna de Rentabilidade (TIR) por bisseção"""
    lo, hi = -0.99, 10.0
    for _ in range(200):
        mid = (lo + hi) / 2
        if npv(mid, cashflows) > 0: lo = mid
        else: hi = mid
    return (lo + hi) / 2

def payback(cashflows):
    """Período de Retorno (Payback) em anos"""
    acc = 0
    for t, cf in enumerate(cashflows):
        acc += cf
        if acc >= 0: return t + (acc - cf) / cf if cf else t
    return None
```

## 3. Procedimento de Atuação
1. **Recolha de Dados:** Valores de investimento, custos e receitas projetadas.
2. **Cálculo em Sandbox:** Executa os cálculos de VAN, TIR, Payback e fluxo de caixa.
3. **Renderização Visual:** Gera painel de KPIs (`renderWidget` / artefacto HTML) e apresenta resumo executivo.