---
name:
  pt-PT: "Gestão de Pipeline Comercial & CRM"
  en: "CRM & Sales Pipeline Management"
description:
  pt-PT: "Gestão completa do pipeline de vendas: criar leads, negociar deals, qualificar contactos e follow-ups em atraso."
  en: "Complete sales pipeline management: leads, deals, contacts, notes and overdue follow-ups."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["crm.leads.read", "crm.deals.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Gestão Comercial & CRM

## Procedimento
1. Para listar oportunidades ou contactos: invocar `crm.leads.list`, `crm.deals.list`, `crm.persons.list` ou `crm.organizations.list`.
2. Para criar novo lead/deal: invocar `crm.leads.create` ou `crm.deals.create` com título, valor previsto e contacto associado.
3. Para follow-ups em atraso: filtrar leads com `overdueOnly: true` e apresentar resumo prioritário com próximo passo claro.
