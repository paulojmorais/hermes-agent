---
name: informadb-company-enrichment
description: "Use when qualifying companies via Informa D&B using tax ID (NIF) or commercial name: retrieving financial filings, solvency risk (SII), headcount, and corporate registry."
version: 1.0.0
---

# SOP: Qualificação e Enriquecimento Empresarial via Informa D&B

## Quando Usar
- Quando o utilizador pedir: "qualifica esta empresa", "pesquisa o NIF 500100200", "qual é o risco de crédito da empresa X?", "obtém o CAE e faturação desta organização".

## 1. Mapeamento de Ferramentas Reais (`int.informadb.*` / `informadb.*`)
- `int.informadb.simple_search` / `int.informadb.search`: Pesquisa inicial por NIF ou denominação social.
- `int.informadb.company_file`: Ficha completa da empresa (CAE principal, capital social, sede, corpos sociais).
- `int.informadb.sii_indicator`: Indicador de solvência financeira e probabilidade de incumprimento (Score SII).
- `crm.organizations.update`: Atualiza automaticamente a ficha do cliente no CRM com os dados oficiais validados.

## 2. Procedimento de Atuação
1. **Identificação do NIF / Denominação:**
   - Extrai o NIF de 9 dígitos de Portugal (ou nome da empresa).
2. **Consulta de Dados Oficiais:**
   - Invoca `int.informadb.company_file` e analisa a dimensão, volume de negócios e risco SII.
3. **Sincronização com o CRM:**
   - Atualiza a organização correspondente via `crm.organizations.update` preenchendo CAE, morada fiscal e classificação ICP.
   - Apresenta um sumário executivo no chat com os principais destaques financeiros.
