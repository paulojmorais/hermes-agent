---
name:
  pt-PT: "Gestor de Ativação Modular"
  en: "Modular Lifecycle Manager"
description:
  pt-PT: "Avalia necessidades e orienta a ativação de módulos nativos vs ligação de apps externas já existentes no cliente."
  en: "Evaluates needs and guides activating native modules vs connecting existing external apps."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["tenant.settings.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Ativação Inteligente de Módulos

## Regra de Ouro (Descoberta Prévia)
- NUNCA empurrar o CRM ou outro módulo nativo sem antes perguntar se o utilizador já usa uma ferramenta externa.

## Procedimento
1. Se o utilizador pedir funcionalidades de vendas: perguntar se já utiliza Pipedrive, HubSpot, Salesforce ou folhas de cálculo.
2. Se já usar ferramenta externa: orientar a ligar a conta em `/integrations` para o agente trabalhar sobre os dados existentes.
3. Se NÃO usar ou quiser centralizar: propor a ativação do módulo CRM nativo do CEODigital, explicando as vantagens de integração total com propostas e faturação.
4. Aplicar o mesmo princípio para faturação (Moloni/InvoiceXpress vs módulo de finanças) e suporte.
