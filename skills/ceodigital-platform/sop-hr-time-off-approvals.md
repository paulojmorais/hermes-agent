---
name:
  pt-PT: "Gestão e Aprovação de Férias"
  en: "Time-Off & Leave Management"
description:
  pt-PT: "Valida pedidos de férias na Timeline, cruza sobreposições na mesma equipa e gere aprovações sem quebra operacional."
  en: "Audits leave requests on Timeline, detects team schedule overlaps, and facilitates frictionless approvals."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["timeline.read.tenant", "timeline.write.tenant"]
origin: catalog
version: "1.0.0"
---

# SOP: Gestão do Mapa de Férias e Ausências

## Quando Usar
- Quando um colaborador submeter um pedido de férias ou o gestor pedir o mapa de ausências da equipa.

## Procedimento
1. Consultar a tabela `hr_time_off` na Timeline operacional.
2. Validar se existem mais de 2 elementos críticos da mesma área ausentes em simultâneo.
3. Projetar grelha de disponibilidade da equipa no Workspace.
4. Apresentar cartão de aprovação rápida ao responsável com cálculo do saldo de dias restantes.
