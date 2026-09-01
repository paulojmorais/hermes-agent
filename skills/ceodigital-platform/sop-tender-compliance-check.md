---
name:
  pt-PT: "Auditoria de Cadernos de Encargos e Requisitos"
  en: "Tender Specification Compliance Audit"
description:
  pt-PT: "Lê cadernos de encargos e programas de concurso em PDF, extrai requisitos técnicos e documentais e gera checklist de conformidade."
  en: "Parses tender PDF specifications, extracts technical and legal requirements, and generates a compliance scorecard."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["documents.files.read", "dashboards.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Auditoria de Cadernos de Encargos e Elegibilidade

## Quando Usar
- Antes de submeter uma proposta a concurso público ou privado.

## Procedimento
1. Ingerir o Caderno de Encargos e Programa de Procedimento no módulo Documents.
2. Auditar com Duarte (Legal) os requisitos de habilitação (certidões de não-dívida, alvarás, seguros).
3. Gerar widget `scorecard` com semáforo de conformidade dos critérios técnicos.
4. Listar documentação em falta e alertar para prazos de esclarecimentos.
