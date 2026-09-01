---
name: sop-crm-lead-enrichment
description: "Use when enriching newly created CRM leads with official company data (NIF, CAE, headcount, turnover, key decision makers) and assigning ICP scores."
version: 1.0.0
---

# SOP: Enriquecimento Automático de Leads e Organizações

## Quando Usar
- Quando uma nova Lead for criada no CRM, quando faltarem dados cadastrais de uma empresa ou quando o utilizador disser "enriquece os dados desta lead".

## 1. Mapeamento de Ferramentas Reais
- `crm.leads.get` / `crm.organizations.get`: Obtém a ficha atual da lead/empresa.
- `int.informadb.simple_search` / `int.informadb.company_file`: Consulta dados oficiais de registo comercial e CAE.
- `crm.leads.update` / `crm.organizations.update`: Regista os dados enriquecidos.
- `crm.leads.add_note`: Adiciona nota com resumo executivo do perfil da empresa.

## 2. Procedimento de Atuação
1. **Identificação da Empresa:**
   - Lê a designação da empresa ou NIF na ficha da Lead (`crm.leads.get`).
2. **Enriquecimento Estruturado:**
   - Invoca `int.informadb.company_file` e extrai: CAE Principal, Volume de Negócios estimado, Nº de Colaboradores e Cidade da Sede.
3. **Cálculo de ICP (Ideal Customer Profile):**
   - Compara a dimensão e setor com os critérios ideais do negócio e atribui pontuação (Tier A, B ou C).
   - Atualiza a Lead (`crm.leads.update`) e notifica o comercial responsável.
