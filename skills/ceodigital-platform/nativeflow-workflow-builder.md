---
name:
  pt-PT: "Construção de Automações no NativeFlow"
  en: "NativeFlow Workflow Builder"
description:
  pt-PT: "Apoio ao desenho de fluxos de trabalho visuais: gatilhos de eventos, nós de IA, integrações e condições."
  en: "Assistance building visual workflows with triggers, AI nodes, integrations, and logic branches."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["nativeflow.workflows.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Automações no NativeFlow

## Procedimento
1. Quando o utilizador pedir para criar um fluxo: usar `agentflow.draft` para estruturar os nós (triggers, ações, condicionais).
2. Explicar o funcionamento de cada nó ao utilizador de forma clara e não técnica.
3. Apresentar o rascunho e sugerir aplicar com `agentflow.apply` ou abrir no editor visual em `/agentflow`.
