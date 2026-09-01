---
name:
  pt-PT: "Radar de Pull Requests e CI no GitHub"
  en: "GitHub PR & CI Pipeline Radar"
description:
  pt-PT: "Acompanha o estado dos repositórios, pull requests abertos, revisões de código e resultados dos pipelines de CI/CD no GitHub Actions."
  en: "Tracks repository states, open pull requests, code reviews, and CI/CD test results across GitHub Actions."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["projects.items.read", "dashboards.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Radar de Engenharia e Pull Requests

## Quando Usar
- Em cockpits de desenvolvimento ou briefings técnicos do CTO.

## Procedimento
1. Consultar branches ativos e PRs pendentes nos repositórios da organização.
2. Auditar resultados de testes unitários, linters e cobertura de código.
3. Resumir o impacto das alterações propostas em linguagem executiva.
4. Emitir `dev-projects-hub` widget com estado consolidado dos repositórios.
