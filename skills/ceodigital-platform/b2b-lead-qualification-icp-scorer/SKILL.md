---
name: b2b-lead-qualification-icp-scorer
description: "Use when scoring and qualifying B2B leads against the Ideal Customer Profile, combining Informa D&B data, headcount, turnover, and industry fit to assign A/B/C tiers and recommend sales approach."
version: 1.0.0
---

# SOP: Scoring & Qualificação Avançada de Leads B2B (ICP)

## Quando Usar
- Quando uma nova lead entra no CRM, quando o utilizador diz "qualifica esta lead", "quão boa é esta oportunidade?", ou "faz o scoring desta empresa".

## 1. Fontes de Dados para o Score
- `crm.leads.get`: Dados atuais do registo e origem.
- `int.informadb.company_file` / `int.informadb.simple_search`: Dados oficiais (CAE, faturação, dimensão).
- Critérios de ICP definidos pelo tenant (tamanho da empresa, setor, localização, uso de tecnologia).

## 2. Escala de Pontuação (Tiers)
- **Tier A (Hot):** Empresa de 15-200 colaboradores, CAE em setores-alvo (serviços, tech, indústria), faturação >1M€, decisor identificado.
- **Tier B (Warm):** Empresa de 5-14 colaboradores ou setor parcialmente alinhado; requer mais dados ou um contacto de referência.
- **Tier C (Cold):** Microempresa (<5), setor fora do ICP, orçamento limitado. Requer nurture automatizada.

## 3. Procedimento de Atuação
1. **Recolha e Análise:** Invoca `crm.leads.get` e `int.informadb.company_file`.
2. **Cálculo do Score:** Pontua com base nos critérios (dimensão, setor, localização, orçamento estimado).
3. **Atualização e Ação:** Invoca `crm.leads.update` para registar o score/Tier. Recomenda abordagem (SDR ativo, email automático ou nurture).