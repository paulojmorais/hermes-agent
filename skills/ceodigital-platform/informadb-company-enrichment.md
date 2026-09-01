---
name:
  pt-PT: "Qualificação Empresarial Informa D&B"
  en: "Informa D&B Company Qualification"
description:
  pt-PT: "Consulta de relatórios financeiros, balanços, risco de crédito, dívidas fiscais e corpos sociais na Informa D&B."
  en: "Fetch financial reports, credit rating, tax debts and executive board from Informa D&B."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["integrations.execute"]
origin: catalog
version: "1.0.0"
---

# SOP: Qualificação e Enriquecimento Informa D&B

## Procedimento
1. Pesquisar empresa por nome ou NIF usando `int.informadb.search`.
2. Obter a ficha completa da empresa via `int.informadb.company_file` ou indicador de solvência `int.informadb.sii`.
3. Verificar histórico de dívidas na Segurança Social e Finanças via `int.informadb.debts`.
4. Atualizar os dados e campos personalizados da Organização no CRM.
