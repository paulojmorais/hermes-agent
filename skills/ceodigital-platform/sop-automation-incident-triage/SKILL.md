---
name: sop-automation-incident-triage
description: "pt-PT: "Analisa payloads JSON com erro no n8n/Webhooks, diagnostica a causa raiz (schema, auth, rate limit) e prepara o reenvio corrigido."
version: 1.0.0
---

# SOP: Diagnóstico e Resolução de Falhas de Automação

## Quando Usar
- Quando uma execução do n8n, Stripe webhook ou API externa falhar com código 4xx ou 5xx.

## Procedimento
1. Inspecionar o payload de entrada e o log de erro do nó que quebrou.
2. Identificar a causa raiz com Alexandre (CTO): campos nulos, tokens revogados ou alterações de schema.
3. Gerar payload corrigido e explicar a solução em linguagem executiva clara.
4. Apresentar botão de reexecução assistida (Retry Flow) no Chat/Workspace.
