---
name:
  pt-PT: "Elaboração de Propostas Comerciais"
  en: "Sales Proposals Builder"
description:
  pt-PT: "Criação de propostas a partir do catálogo de serviços, cálculo de descontos, condições de pagamento e link público."
  en: "Build sales proposals with service catalog items, discounts, payment terms and public signing links."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["services.proposals.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Elaboração de Propostas Comerciais

## Procedimento
1. Consultar serviços disponíveis no catálogo via `services.catalog.list`.
2. Criar ou editar a proposta com os itens selecionados, aplicando descontos e taxas de IVA.
3. O cálculo financeiro é validado pelo pricing adapter em Euros com paridade decimal.
4. Gerar o link público de assinatura (`/p/$token`) para envio ao cliente.
