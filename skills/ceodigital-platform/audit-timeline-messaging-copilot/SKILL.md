---
name: audit-timeline-messaging-copilot
description: "Use when auditing client/deal interaction histories on timelines, reacting to timeline events, and coordinating internal team communication via messaging threads and notification triage."
version: 1.0.0
---

# SOP: Linha do Tempo de Atividade, Mensagens & Triagem de Notificações

## Quando Usar
- Quando o utilizador pedir: "mostra o histórico completo do cliente X", "afixa este evento na timeline", "envia uma mensagem na thread do projeto Y", "resume as notificações pendentes de hoje".

## 1. Mapeamento de Ferramentas Reais
- **Linha do Tempo (`timeline.*`):**
  - `timeline.events.list`: Histórico cronológico de emails, reuniões, alterações de fase, notas e faturas (`subject_type`, `subject_id`).
  - `timeline.events.get`: Detalhe aprofundado de um evento específico.
  - `timeline.pins.add` / `timeline.pins.remove`: Destaca/desafixa marcos importantes no topo do cliente/negócio.
  - `timeline.reactions.add`: Regista feedback/reação a um evento de atividade.
- **Mensagens & Discussões Internas (`messaging.*`):**
  - `messaging.threads.list` / `messaging.threads.list_by_ref`: Lista conversas internas associadas a uma entidade (`ref_type`, `ref_id`).
  - `messaging.threads.create`: Inicia nova discussão interna entre colaboradores.
  - `messaging.messages.post`: Publica comentário, ata ou decisão na conversa.
  - `messaging.messages.read`: Marca mensagens como lidas.
- **Centro de Notificações (`notifications.*`):**
  - `notifications.list`: Alertas de menções, tarefas atribuídas e pedidos de aprovação.
  - `notifications.unread_count`: Contagem de notificações pendentes.
  - `notifications.mark_read` / `notifications.mark_all_read`: Arquiva notificações processadas.

## 2. Procedimento de Atuação
1. **Auditoria de Histórico:**
   - Inicia com `timeline.events.list` para reconstituir a jornada completa de um negócio ou cliente.
2. **Colaboração em Equipa:**
   - Para registar uma decisão ou instrução interna, invoca `messaging.messages.post` na thread relevante, mantendo o contexto centralizado.
3. **Triagem Rápida matinal:**
   - Verifica `notifications.unread_count` e resume itens prioritários que exigem ação do utilizador.
