---
name: vat-returns-tax-compliance
description: "Use when preparing and reconciling periodic Portuguese tax returns (VAT Modelo 6, IRS/IRC), aggregating invoice data and detecting compliance gaps."
version: 1.0.0
---

# SOP: Declarações Periódicas de IVA e Conformidade Fiscal

## Quando Usar
- Quando o utilizador pedir: "prepara a declaração periódica de IVA", "confere as faturas para o Modelo 6", "valida as obrigações de IRS/IRC".

## 1. Fontes de Dados Fiscais
- `int.moloni.invoices.list` / `int.invoicexpress.invoices.list`: Todas as faturas emitidas (vendas) e recebidas (compras) do período.
- Agrupamento por taxa de IVA (23%, 13%, 6%, isento).
- `crm.organizations.get`: NIF e atividade da empresa (para determinar enquadramento).

## 2. Procedimento de Preparação
1. **Agregação de Vendas e Compras:**
   - Soma as operações ativas e passivas por taxa de IVA.
2. **Cálculo de IVA Liquidez/Ilabilitar:**
   - IVA Liquidado (vendas) − IVA Dedutível (compras) = IVA a Pagar/Receber.
   - Utiliza Sandbox Python para agregação rigorosa e somatório por taxa.
3. **Deteção de Gaps:**
   - Sinaliza faturas sem validação ATCUD, autofacturação em falta, ou taxas aplicadas incorretamente.
4. **Relatório/Artefacto:**
   - Gera o resumo (valores por taxa, IVA devido) e disponibiliza para download/submissão.

## 3. Regra de Conformidade
- Never inventa valores; todas as somas derivam estritamente dos dados de faturação agregados. Confirma ATCUD e regime de IVA antes de declarar.