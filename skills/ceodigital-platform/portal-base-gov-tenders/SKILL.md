---
name: portal-base-gov-tenders
description: "Use when accessing Portuguese public procurement tenders (Base.gov.pt) via MCP/API aggregation to scout opportunities and check compliance."
version: 1.0.0
---

# SOP: Radar de Concursos Públicos (Base.gov.pt)

## Quando Usar
- Quando o utilizador pedir: "procura concursos públicos na nossa área", "vê os avisos de abertura no Base.gov", "monitoriza licitações para a nossa empresa".

## 1. Camada de Acesso (Camada 3 — MCP/API Preferida)
- O Base.gov.pt disponibiliza dados de concursos públicos. Preferir acesso via MCP/API agregador (`int.basegov.*`) quando disponível.
- **Fallback (Camada 2):** Se não houver MCP, usar `browser.launch` para consultar o portal.

## 2. Procedimento
1. **Consulta de Avisos:** Invoca `int.basegov.*` (ou `browser.launch` no portal) para listar concursos por CAE, região ou entidade adjudicante.
2. **Filtragem por Relevância:** Aplica filtros de setor, valor e prazo de candidatura.
3. **Análise de Conformidade:** Cruza com a skill `sop-tender-compliance-check` para validar requisitos de elegibilidade.
4. **Criação de Oportunidade:** Se relevante, cria uma lead/deal no CRM (`crm.deals.create`) e agenda follow-up.

## 3. Guardrail
- Indicar sempre a referência do concurso (ID Base.gov) e prazo de candidatura.