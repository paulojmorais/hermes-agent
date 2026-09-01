---
name: automated-meeting-transcripts-pipeline
description: "Use when processing continuous meeting recordings and transcript pipelines (Google Meet, Microsoft Teams, Zoom), extracting structured decisions, customer pain points, and auto-routing tasks to CRM entities and Workitems."
version: 1.0.0
---

# SOP: Pipeline Automatizado de Transcrições de Reuniões (Meet / Teams / Zoom)

## Quando Usar
- Quando uma chamada for concluída e a transcrição for enviada pelo webhook/integração do Google Meet, Teams ou Zoom.
- Quando o utilizador carregar o ficheiro VTT/TXT de uma reunião gravada ou pedir: "processa a transcrição desta reunião", "extrai os compromissos da call com o cliente X", "cria as tarefas e atualiza a oportunidade".

## 1. Mapeamento de Ferramentas Reais
- **Ingestão de Transcrições:**
  - O motor do backend `meeting-transcripts/ingest.server.ts` processa e diariza os intervenientes da conversa.
- **Criação de Tarefas & Compromissos:**
  - `workitems.create({ title: "...", subject_type: "deal" | "organization" | "project", subject_id: "...", due_at: "...", assignee: "..." })`.
- **Registo e Atualização no CRM:**
  - `crm.deals.add_note` / `crm.leads.add_note`: Anexa a ata executiva à timeline da entidade.
  - `crm.deals.change_stage`: Avança o estado do negócio quando o cliente confirmar interesse ou pedir proposta.
- **Comunicação por Email:**
  - `email-calendar-assistant`: Rascunho de email de follow-up pronto para envio ao cliente com os pontos acordados.

## 2. Estrutura Padrão da Síntese (Diarização & Ações)
1. **Identificação dos Participantes:** Mapeamento de quem falou (ex: *Cliente*, *Gestor Comercial*, *Engenheiro de Soluções*).
2. **Sumário Executivo (3-5 Parágrafos):** Contexto da conversa, necessidades manifestadas pelo cliente e objeções colocadas.
3. **Matriz de Decisões Tomadas:** Lista numerada de decisões formais com indicação explícita de quem aprovou.
4. **Tabela de Próximos Passos (Action Items):** Quem faz o quê, até quando e com que prioridade.

## 3. Procedimento de Atuação
1. **Processamento do Texto:** Analisa a transcrição e identifica as entidades CRM associadas.
2. **Atualização Imediata:** Anexa as notas no CRM (`crm.deals.add_note`) e avança a etapa se aplicável.
3. **Geração dos Workitems:** Invoca `workitems.create` para cada ação com data limite.
4. **Minuta de Follow-up:** Gera o rascunho de email de agradecimento e resumo para o cliente.
