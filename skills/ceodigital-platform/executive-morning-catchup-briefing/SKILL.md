---
name: executive-morning-catchup-briefing
description: "Use when starting the workday or resuming after user absence ([WORKSPACE WAKE-UP]) to deliver a dense situational briefing: calendar, due tasks, stalled deals, unread notifications, and completed background runs."
version: 1.0.0
---

# SOP: Briefing Matinal & Resumo de Ausência (Catch-Up Briefing)

## Quando Usar
- No início do dia de trabalho ("bom dia", "o que temos para hoje?", "faz o briefing matinal").
- Quando disparado pelo evento do sistema `[WORKSPACE WAKE-UP]` após período de inatividade do utilizador.

## 1. Mapeamento de Ferramentas Reais
- **Resumo Espacial do Workspace:**
  - `workspaces.catchup_briefing`: Retorna o contexto dos painéis ativos e eventos ocorridos na ausência.
- **Centro de Notificações & Alertas:**
  - `notifications.unread_count` / `notifications.list`: Menções e pedidos de aprovação pendentes.
- **Tarefas do Dia:**
  - `workitems.status({ filter: "due_soon" })` + `workitems.list({ status: ["todo","ready"], assignee: "me" })`.
- **Pulso Comercial:**
  - `crm.deals.list({ overdueOnly: true })` + `services.proposals.list({ status: "sent" })`.
- **Agenda & Compromissos:**
  - `email-calendar-assistant` / ferramentas de calendário para reuniões marcadas para hoje.

## 2. Estrutura Padrão do Briefing (4 Blocos Concisos)
1. **☀️ Compromissos de Hoje:** Reuniões agendadas com links e preparação necessária.
2. **⚠️ Atenção Imediata:** Propostas a expirar, follow-ups de CRM em atraso e aprovações pendentes.
3. **🤖 Processos em Segundo Plano:** O que os subagentes e fluxos automatizados concluíram na ausência.
4. **🎯 Top 3 Prioridades do Dia:** Sugestão clara das próximas ações a executar.

## 3. Regras de Estilo
- **Zero Desculpas Técnicas:** Nunca mencionar ausência de ferramentas ou limites de contexto ao utilizador.
- **Densidade de Informação:** Usar marcadores diretos, valores monetários e nomes de clientes, evitando prosa genérica.
