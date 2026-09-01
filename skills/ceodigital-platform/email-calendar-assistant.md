---
name:
  pt-PT: "Assistente de Email e Reuniões"
  en: "Email & Calendar Assistant"
description:
  pt-PT: "Redação e envio de emails pelo CRM (Gmail/Outlook) e marcação de reuniões com link do Google Meet/Teams."
  en: "Compose/send emails via CRM and schedule calendar meetings with Google Meet/Teams links."
mode: agentic
visibility: tenant
needs_approval: true
required_capabilities: ["integrations.execute"]
origin: catalog
version: "1.0.0"
---

# SOP: Envio de Emails e Marcação de Reuniões

## Procedimento
1. Para enviar email: recolher destinatário, assunto e corpo; invocar `int.gmail.send_email` ou `int.outlook.send_email`.
2. Para marcar reunião: invocar `int.googlecalendar.create_event` ou o agendador do CRM com data/hora e participantes.
3. O evento e a mensagem ficam imediatamente indexados na timeline e na conversa da ficha do cliente.
