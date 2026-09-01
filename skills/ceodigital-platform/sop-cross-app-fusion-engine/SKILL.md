---
name:
  pt-PT: "Motor de Fusão Multi-App & Reconciliação em Sandbox"
  en: "Multi-App Fusion Engine & Sandbox Reconciliation"
description:
  pt-PT: "Cruza dados de CRM, Faturação, Gmail e Documentos em Sandbox Python isolada, gerando relatórios de reconciliação, discrepâncias e métricas consolidadas."
  en: "Fuses data from CRM, Invoicing, Gmail, and Documents in an isolated Python Sandbox."
mode: agentic
visibility: tenant
needs_approval: true
required_capabilities: ["chat.conversation.write"]
origin: catalog
version: "1.0.0"
is_bundle: true
entrypoint: "SKILL.md"
---

# SOP: Fusão de Dados Multi-App e Reconciliação em Sandbox

## Quando Usar
- Quando o utilizador pedir: "reconcilia as faturas com o extrato bancário", "cruza os clientes do CRM com as mensagens de email", "gera um relatório consolidado com métricas financeiras e de vendas".

## Recursos Incluídos no Bundle
- `scripts/reconcile_data.py`: Script Python para reconciliação automática e cálculo de discrepâncias numéricas.
- `templates/reconciliation-report.html`: Template visual de dashboard interativo com Tailwind CSS.
- `references/reconciliation-schema.json`: Esquema JSON canónico para validação de dados de entrada.

## Procedimento
1. **Recolha de Dados das Fontes:**
   - Extrai as tabelas de dados do CRM (`crm.deals.list`), Faturação (`invoicing.list`) ou extratos anexados.
2. **Processamento em Sandbox Python:**
   - Executa o script de reconciliação em Sandbox através de `execute_code`.
   - O script cruza valores, identifica saldos pendentes e calcula discrepâncias percentuais.
3. **Renderização do Resultado:**
   - Preenche o template `templates/reconciliation-report.html` com os dados processados.
   - Apresenta o relatório interativo via `chat.createArtifact(kind='html')` ou exporta em PDF/PPTX.
