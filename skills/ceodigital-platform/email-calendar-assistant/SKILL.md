---
name: email-calendar-assistant
description: "Use when drafting, sending, searching, or triaging emails (Gmail, Outlook) and scheduling meetings with Google Meet/Teams links directly linked to CRM contacts and timelines."
version: 2.0.0
---

# SOP: Assistente Executivo de Email & Calendário (Gmail & Outlook)

## Quando Usar
- Quando o utilizador pedir: "envia um email ao cliente X", "rascunha uma resposta a esta mensagem", "marca uma reunião com a Maria para quinta-feira às 15h", "consulta a minha agenda de hoje", "procura os emails recebidos sobre a proposta Y".

## 1. Mapeamento de Ferramentas Reais (`int.gmail.*` / `int.outlook.*` / `calendar.*`)
- **Gestão de Email (Gmail & Outlook):**
  - `int.gmail.fetch_emails` / `int.outlook.get_mail_delta`: Pesquisa e leitura de mensagens por remetente, assunto ou intervalo de datas.
  - `int.gmail.create_email_draft` / `int.outlook.create_draft`: Criação de rascunho seguro para revisão prévia.
  - `int.gmail.send_email` / `int.gmail.reply_to_thread`: Envio de mensagens e respostas encadeadas.
  - `int.gmail.batch_modify_messages`: Aplicação de etiquetas ou arquivamento em lote.
- **Gestão de Calendário & Agendamentos:**
  - `int.outlook.calendar_create_event` / criação de eventos Google Calendar com link de videoconferência automático (Google Meet ou Microsoft Teams).
  - `renderWidget({ source: "calendar.upcoming", viz: "feed" })`: Widget visual de compromissos agendados.
- **Projeção no Workspace:**
  - `workspaces.open_pane("app:gmail")` ou `workspaces.open_pane("app:outlook")` ou `workspaces.open_pane("route:calendar")`.

## 2. Regras de Ouro de Comunicação Executiva
1. **Indexação Automática na Timeline do CRM:**
   - Sempre que um email for enviado ou reunião marcada, associar o registo à entidade correspondente (`crm.persons`, `crm.deals`, `crm.organizations`) via `timeline.events` para histórico auditável.
2. **Confirmação HITL em Envios Diretos:**
   - Para emails com impacto comercial ou legal (envio de propostas, notificações de atraso), preferir criar primeiro o rascunho (`create_email_draft`) e apresentar a minuta no chat antes de disparar o envio definitivo.
3. **Tom de Voz Corporativo:**
   - Linguagem clara, cortês e profissional em Português Europeu formal (ou no idioma nativo do contacto).

## 3. Procedimento de Atuação
1. **Identificação dos Destinatários:** Consulta os dados de contacto no CRM (`crm.persons.get` ou pesquisa de email).
2. **Redação & Validação da Minuta:** Redige o corpo do email com assunto conciso e claro.
3. **Envio / Agendamento:** Invoca a respetiva tool de envio ou criação de evento no calendário com link de Meet/Teams.
4. **Registo:** Confirma a ação com sumário no chat e registo na timeline do cliente.
