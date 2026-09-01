---
name: sop-billing-invoice-sync
description: "Use when synchronizing invoices between CEODigital (Proposals/Services) and certified Portuguese ERPs (Moloni, InvoiceXpress, Primavera), reconciling document statuses, validating ATCUD/QR codes, and detecting sync mismatches."
version: 2.0.0
---

# SOP: Sincronização & Reconciliação de Faturas com ERPs Certificados (Moloni / InvoiceXpress)

## Quando Usar
- Ao adjudicar uma proposta comercial e pretender emitir a respetiva fatura ou recibo.
- Quando o utilizador pedir: "sincroniza as faturas com o Moloni", "verifica se a fatura da proposta X já foi emitida no ERP", "reconcilia os estados de pagamento entre a plataforma e o software de faturação", "deteta faturas em falta".

## 1. Mapeamento de Ferramentas Reais (`int.moloni.*` / `services.proposals.*`)
- **Consulta no Software de Faturação ERP:**
  - `int.moloni.invoices.list` / `int.invoicexpress.invoices.list`: Lista documentos fiscais emitidos (Faturas, Faturas-Recibo, Notas de Crédito).
  - `int.moloni.invoices.get`: Obtém detalhes completos de uma fatura específica (número, série fiscal, ATCUD, QR code, linhas e valores de IVA).
- **Consulta no CEODigital:**
  - `services.proposals.list` / `services.proposals.get`: Identifica propostas ganhas (`accepted`) e respetivas tranches a faturar.
- **Deteção de Discrepâncias:**
  - `execute_code`: Script Python em sandbox para cruzar listas de NIFs, valores brutos e números de documento, gerando relatório de reconciliação.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:invoicing")` ou visualização lado a lado de propostas e faturas.

## 2. Regras de Ouro de Conformidade Fiscal Portuguesa
1. **Certificação AT & ATCUD Obrigatório:**
   - Todo o documento emitido deve ser processado por software certificado pela Autoridade Tributária (ex: Moloni nº 2860/AT) e conter o código único de documento (ATCUD) e QR code.
2. **Imutabilidade Documental:**
   - Faturas emitidas não podem ser editadas ou eliminadas; correções exigem a emissão de Nota de Crédito associada.
3. **Mapeamento Estrito de Entidades:**
   - Validar NIF, morada fiscal e país do cliente no CRM (`crm.organizations`) antes de invocar a criação no ERP para evitar erros de validação da AT.

## 3. Procedimento de Atuação
1. **Cruzamento de Registos:** Consulta as propostas ganhas no CEODigital e as faturas emitidas no ERP para o período.
2. **Deteção de Mismatches:** Identifica tranches aprovadas sem fatura emitida correspondente ou divergências de valores.
3. **Apresentação do Relatório:** Projeta tabela comparativa interativa no chat com `renderWidget` (`dynamic.dataset`).
4. **Resolução:** Orienta a emissão da fatura em 1-clique para os registos pendentes.
