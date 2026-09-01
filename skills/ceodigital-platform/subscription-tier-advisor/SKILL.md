---
name: subscription-tier-advisor
description: "Use when advising on subscription plans, Work Unit (WUs) consumption, dedicated instances, and upgrade recommendations."
version: 1.0.0
---

# SOP: Acompanhamento de Planos e Recomendação de Upgrade

## Quando Usar
- Quando o utilizador pedir: "qual é o meu plano?", "como está o consumo de WUs?", "devo fazer upgrade?", "quanto custa subir de plano".

## 1. Mapeamento de Ferramentas Reais
- `billing.getPlan` / `billing.getWallet`: Plano ativo, saldo de WUs e limites.
- `platform.tenants.get`: Instância dedicada e módulos licenciados.
- `subscription-tier-advisor`: Regras de multiplicadores de WUs por plano.

## 2. Multiplicadores de Plano (por referência)
- **Free:** 1.4x custo de WUs.
- **Pro:** 1.0x (base).
- **Business:** 0.7x.
- **Enterprise:** 0.6x (com instância dedicada).

## 3. Procedimento de Atuação
1. **Consulta do Estado:** Invoca `billing.getPlan` e `billing.getWallet`.
2. **Análise de Consumo:** Calcula o ritmo de consumo e projeta quando esgota.
3. **Recomendação:** Compara o plano atual com o nível seguinte; apresenta economia potencial e benefícios (instância dedicada, WUs mais baratos).