---
name: client-meeting-sales-briefing
description: "Use when preparing executive briefings before sales calls or client meetings, synthesizing CRM history, Informa D&B financials, past emails, and discussion points."
version: 1.0.0
---

# SOP: Preparação & Briefing Pré-Reunião Comercial

## Quando Usar
- Quando o utilizador disser: "tenho uma reunião com o cliente X, prepara o briefing", "faz o sumário da empresa Y antes da call", "o que preciso de saber para a reunião de logo?".

## 1. Mapeamento de Fontes de Dados
- **CRM & Oportunidades:** `crm.deals.get` / `crm.leads.get` (valor do deal, decisores, histórico de notas).
- **Dados Oficiais da Empresa:** `int.informadb.company_file` (CAE, volume de negócios, dimensão, risco SII).
- **Comunicações Recentes:** `int.gmail.fetch_emails` / `int.outlook.get_mail_delta` (últimos emails trocados).
- **Propostas em Aberto:** `services.proposals.list` (estado de orçamentos pendentes).

## 2. Estrutura da Ficha Executiva de 1 Página
1. **Fotografia da Conta:** Nome, NIF, Faturação estimada, Nº de Colaboradores e Decisores chave.
2. **Histórico da Oportunidade:** Fase atual no funil, valor em discussão e principais dores manifestadas.
3. **Últimas Interações:** Resumo em 3 linhas dos tópicos abordados nos emails recentes.
4. **Perguntas Estratégicas Recomendadas:** 3 perguntas abertas para descobrir orçamento, decisores e prazos.
5. **Objetivo Claro da Reunião:** Definição do compromisso a obter no final da chamada (ex: validação de proposta, agendamento de demo).
