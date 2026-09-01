---
name: sop-n8n-flow-telemetry
description: "pt-PT: "Monitoriza a execução de nós e automações em instâncias n8n e Flowise, medindo latência, taxas de sucesso e execuções falhadas."
version: 1.0.0
---

# SOP: Telemetria e Monitorização de Automações n8n

## Quando Usar
- Em workspaces de engenharia e automação técnica ou quando um webhook reportar lentidão.

## Procedimento
1. Consultar a API do n8n/Flowise recolhendo o histórico de execuções das últimas 24h.
2. Identificar nós com maior taxa de erro ou latência anormal (>3s).
3. Projetar widget `fleet-status` com indicadores luminosos por instância.
4. Configurar alertas no chat se a taxa de sucesso cair abaixo de 95%.
