---
name: create-pricing-profile
description: "Use when creating or updating custom pricing profiles, markup multipliers, discount bands, and retainer billing models."
version: 1.0.0
---

# SOP: Criação de Perfis de Preço & Tabelas de Cobrança

## Quando Usar
- Quando o utilizador pedir: "cria uma tabela de preços para parceiros", "configura um perfil com 20% de margem", "define um modelo de avença/retainer".

## 1. Estruturação do Perfil de Preço
- **Nome do Perfil:** Identificador do segmento (ex: "Tabela Enterprise", "Parceiros / Agências", "Setor Público").
- **Regras de Margem (Mark-up):** Percentagem de margem sobre o custo base de produção.
- **Taxas de Urgência & Descontos por Volume:** Regras automáticas aplicadas em orçamentos.
- **Modelo de Retainer:** Horas mensais incluídas e valor/hora adicional.

## 2. Procedimento de Configuração
1. **Definição dos Parâmetros Comerciais:**
   - Recolhe as taxas, margens e condições de pagamento.
2. **Simulação de Preços:**
   - Apresenta uma tabela comparativa no chat demonstrando o impacto nos preços de venda.
3. **Registo na Plataforma:**
   - Orienta para a gestão de preçários e propõe navegar para `/pricing/profiles` com `ui.navigate("pricing.profiles")`.
