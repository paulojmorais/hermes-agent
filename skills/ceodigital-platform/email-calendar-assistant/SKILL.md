---
name: email-calendar-assistant
description: "pt-PT: "Redação e envio de emails pelo CRM (Gmail/Outlook) e marcação de reuniões com link do Google Meet/Teams."
version: 1.0.0
---

# SOP: Envio de Emails e Marcação de Reuniões

## Procedimento
1. Para enviar email: recolher destinatário, assunto e corpo; invocar `int.gmail.send_email` ou `int.outlook.send_email`.
2. Para marcar reunião: invocar `int.googlecalendar.create_event` ou o agendador do CRM com data/hora e participantes.
3. O evento e a mensagem ficam imediatamente indexados na timeline e na conversa da ficha do cliente.
