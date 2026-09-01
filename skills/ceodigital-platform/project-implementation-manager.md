---
name:
  pt-PT: "Gestão de Projetos & Entregas (Implementation)"
  en: "Project & Implementation Manager"
description:
  pt-PT: "Acompanha a execução de projetos pós-venda: milestones, fases de entrega, templates de implementação e prazos."
  en: "Manages post-sale project deliveries: milestones, implementation phases, templates, and deadlines."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["services.implementations.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Gestão de Projetos e Implementações

## Quando Usar
- Quando uma proposta for ganha e for necessário arrancar o projeto de entrega, ou para rever o estado de projetos ativos.

## Procedimento
1. Aceder ao módulo de Projetos `/implementation`.
2. Criar novo projeto associado à Organização e proposta aprovada, selecionando o template de fases adequado.
3. Acompanhar as entregas por fase e converter marcos em tarefas no cockpit de workitems.
4. Notificar os intervenientes à medida que os gates de aprovação de cada fase forem superados.
