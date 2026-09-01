---
name: meeting-action-extractor
description: "Use when processing meeting transcripts (Google Meet, Teams, Zoom) to synthesize decisions, commitments, and automatically create follow-up work items linked to CRM entities."
version: 1.0.0
---

# SOP: Extração de Ações & Decisões de Reuniões

## Quando Usar
- Após reuniões comerciais, alinhamentos de equipa ou chamadas com clientes gravadas no CRM, ou quando o utilizador fornecer uma transcrição/ata.

## 1. Mapeamento de Ferramentas Reais
- **Transcrições:** O motor `meeting-transcripts/ingest.server.ts` processa Google Meet / Teams / Zoom.
- **Criação de Tarefas:** `workitems.create` (com `subject_type: "deal"`/`"organization"` e `subject_id`).
- **Registo no CRM:** `crm.deals.add_note` / `crm.leads.add_note` para anexar o resumo.
- **Avanço de Etapa:** `crm.deals.change_stage` quando houver compromisso formal.

## 2. Procedimento de Extração
1. **Acesso à Transcrição:**
   - Lê a transcrição da reunião (via ingestão automática ou upload do utilizador).
2. **Síntese Estruturada em 3 Secções:**
   - **(a) Resumo Executivo:** O que foi discutido e o contexto.
   - **(b) Decisões Tomadas:** Com citação de quem aprovou e o que foi decidido.
   - **(c) Próximos Passos:** Ações acordadas, responsáveis e prazos.
3. **Criação de Workitems:**
   - Para cada próximo passo, invoca `workitems.create` com:
     - `title` (ação), `subject_type` (deal/organization), `subject_id`, `due_at` (prazo).
4. **Registo no CRM:**
   - Invoca `crm.deals.add_note` para anexar o resumo executivo à oportunidade.
   - Se acordado envio de proposta, avança a etapa com `crm.deals.change_stage`.
5. **Projeção no Workspace:**
   - Abre o painel de tarefas com `workspaces.open_pane("route:workitems")`.