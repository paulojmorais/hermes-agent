---
name:
  pt-PT: "Reconciliação Bancária, Recibos e Despesas"
  en: "Bank Reconciliation, Receipts & Expenses Pipeline"
description:
  pt-PT: "Cruza extratos bancários (Open Banking ou PDF/CSV) com o software de faturação (Moloni/ERP), gera lista de recibos a emitir para clientes e extrai despesas para agentes de compras/contabilidade."
  en: "Reconciles bank statements (Open Banking or PDF/CSV) against billing software (Moloni/ERP), generates client receipt issuance queues, and produces categorized expense feeds for accountant/procurement agents."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["payments.read", "payments.write", "documents.files.read", "dashboards.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Reconciliação Bancária, Recibos e Classificação de Despesas

## Quando Usar
- No fecho diário/mensal de tesouraria, ou quando o utilizador anexar extratos bancários e pedir para conciliar movimentos com o programa de faturação.

## Procedimento
1. **Ingestão de Movimentos Bancários:** Ler transações via Open Banking/SIBS ou extrair linhas de extratos anexados (PDF, CSV, OFX ou Excel) através do motor de documentos/Python.
2. **Cruzamento com Faturação (Moloni/ERP):** Obter faturas emitidas e pendentes de pagamento. Comparar por valor exato, referência de pagamento (Multibanco/MBWay/Transferência) ou NIF da entidade.
3. **Geração da Lista de Recibos a Emitir (Entradas):** Identificar pagamentos de clientes validados e gerar a fila de emissão de recibos oficiais com respetivos links no ERP.
4. **Classificação & Extração de Despesas (Saídas):** Categorizar débitos bancários (Fornecedores, Rendas, Energia, Software, Impostos AT/SS) e estruturar lista normalizada em JSON/Excel para consumo pelo agente de Contabilidade e Compras.
5. **Projeção no Workspace:** Renderizar Live Data Artifacts no Workspace:
   - Widget de Reconciliação com semáforo de match e divergências.
   - Scorecard de Tesouraria e Fila de Ações Rápidas [Emitir Recibo no Moloni] / [Classificar Despesa].
6. **Watchdog de Divergências:** Emitir alerta caso existam movimentos sem correspondência fiscal há mais de 5 dias.
