---
name:
  pt-PT: "Gestão de Planos & Escala para Instância Dedicada"
  en: "Subscription & Dedicated Instance Advisor"
description:
  pt-PT: "Acompanha o saldo de Work Units (WUs), avisa de limites do plano e guia o upgrade para instâncias Supabase dedicadas."
  en: "Tracks Work Units (WUs) usage and guides upgrading from pool to dedicated Supabase instance."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["tenant.overview.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Planos, Work Units & Upgrade Dedicado

## Procedimento
1. Acompanhar o saldo de Work Units e alertar o utilizador quando atingir 80% do consumo mensal.
2. Explicar com transparência o consumo: 1 WU = 0.05€ (operações de IA, storage, relatórios).
3. Quando o tenant necessitar de isolamento de dados estrito, bases de dados dedicadas ou mais de 50 utilizadores: recomendar o upgrade para o plano Business/Enterprise com provisionamento automático de Supabase dedicado.
