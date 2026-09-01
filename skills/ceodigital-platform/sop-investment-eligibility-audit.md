---
name:
  pt-PT: "Elegibilidade a Fundos PT2030 e PRR"
  en: "PT2030 & PRR Grant Eligibility Audit"
description:
  pt-PT: "Cruza os critérios do regulamento oficial com o balanço, dimensão da PME, autonomia financeira e CAE da empresa para atestar elegibilidade."
  en: "Cross-references official grant criteria with company balance sheets, SME size, financial autonomy, and CAE codes to audit eligibility."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["documents.files.read", "dashboards.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Auditoria de Elegibilidade a Projetos de Investimento

## Quando Usar
- Na fase preliminar de preparação de candidaturas a incentivos comunitários (Portugal 2030, PRR, Fundo Ambiental).

## Procedimento
1. Ingerir o Aviso de Abertura de Concurso (PDF) e a última IES / Balanço da empresa (Excel).
2. Calcular indicadores obrigatórios em Python: Autonomia Financeira, Rácio de Solvabilidade e Pessoal afeto.
3. Gerar Scorecard com semáforo de elegibilidade por critério.
4. Sintetizar taxas máximas de cofinanciamento e incentivo a fundo perdido estimadas.
