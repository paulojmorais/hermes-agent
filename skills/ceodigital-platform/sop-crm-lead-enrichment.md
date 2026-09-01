---
name:
  pt-PT: "Enriquecimento Fiscal e NIF de Leads"
  en: "Company Tax & NIF Enrichment"
description:
  pt-PT: "Consulta dados oficiais via Informa D&B e NIF (CAE, faturação, dimensão e sócios) e atualiza a ficha do CRM automaticamente."
  en: "Fetches official corporate data via Informa D&B/NIF (CAE code, revenue, size, directors) and enriches CRM company records."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["crm.organizations.write", "crm.leads.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Enriquecimento de Leads e Organizações via NIF

## Quando Usar
- Quando uma nova Lead for criada no CRM ou faltarem dados estruturados da empresa.

## Procedimento
1. Extrair NIF ou nome comercial da organização.
2. Consultar ferramenta `int_informadb_company_file` ou `int_informadb_simple_search`.
3. Atualizar campos da organização: CAE Principal, Volume de Negócios estimado, Nº Colaboradores e Sede.
4. Calcular pontuação de ICP (Ideal Customer Profile) e atribuir tag semântica.
