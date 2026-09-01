---
name:
  pt-PT: "Descoberta de Integrações e Apps"
  en: "Integrations & Tools Discovery"
description:
  pt-PT: "Identifica quais as aplicações externas ativas (Gmail, Moloni, InformaDB, Slack, etc.) e guia na conexão de novas ferramentas."
  en: "Identifies active third-party apps and guides connecting new tools."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["integrations.enabled"]
origin: catalog
version: "1.0.0"
---

# SOP: Descoberta e Ligação de Ferramentas Externas

## Procedimento
1. Para listar ligações ativas: usar as tools do namespace `integrations.list` ou inspecionar as ferramentas `int.*` disponíveis no turno.
2. Se o utilizador pedir para executar uma ação em app não conectada: informar claramente que a integração precisa de ser ativada na página `/integrations` e facultar o link direto.
3. Nunca fingir que uma ação externa foi executada se a app correspondente não estiver conectada.
