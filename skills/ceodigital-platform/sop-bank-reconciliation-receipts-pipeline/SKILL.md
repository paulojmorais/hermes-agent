---
name: sop-bank-reconciliation-receipts-pipeline
description: "Use when reconciling bank statements with invoices and expenses, detecting discrepancies and matching transactions with receipts."
version: 1.0.0
---

# SOP: Reconciliação Bancária com Recibos e Despesas

## Quando Usar
- Quando o utilizador pedir: "reconcilia o extrato do banco com as faturas", "há diferenças entre o banco e o ERP?", "faz a conciliação do mês".

## 1. Mapeamento de Ferramentas Reais
- `int.bank.*`: Extratos bancários e movimentos.
- `int.moloni.invoices.list` / `int.invoicexpress.invoices.list`: Faturas registadas.
- `crm.organizations.get`: Clientes/Fornecedores associados.
- **Sandbox Python (`scripts/reconcile_data.py`):** Motor de reconciliação que cruza IDs/valores entre duas fontes (banco e faturas) e calcula discrepâncias.

## 2. Procedimento de Reconciliação
1. **Recolha de Dados:**
   - Obtém os movimentos bancários e as faturas/recibos do período.
2. **Reconciliação Automatizada (Sandbox):**
   - Executa o script `scripts/reconcile_data.py` na Sandbox para cruzar os registos e identificar:
     - **Matching**: transações que batem certo.
     - **Discrepâncias**: montantes diferentes para o mesmo identificador.
     - **Pendentes**: registos presentes num lado mas ausentes no outro.
3. **Apresentação do Resultado:**
   - Renderiza o dashboard interativo (`templates/reconciliation-report.html`) como artefacto HTML com Tailwind.
   - Reporta o resumo executivo (total, diferença líquida, taxa de conformidade).