---
name:
  pt-PT: "Extração de Decisões & Tarefas de Reuniões"
  en: "Meeting Action Items & Decisions Extractor"
description:
  pt-PT: "Lê transcrições de reuniões (Meet/Teams), sintetiza decisões tomadas, compromissos e cria automaticamente os Workitems no CRM."
  en: "Parses meeting transcripts (Meet/Teams), extracts decisions and automatically creates actionable CRM Workitems."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["workitems.items.create", "crm.deals.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Extração de Ações & Decisões de Reuniões

## Quando Usar
- Após a realização de reuniões comerciais, alinhamentos de equipa ou chamadas com clientes gravadas no CRM.

## Procedimento
1. Aceder ao histórico da reunião na ficha do contacto/deal ou carregar a transcrição do Google Meet / Microsoft Teams.
2. Sintetizar em 3 secções claras: (a) Resumo Executivo, (b) Decisões Tomadas com citação de quem aprovou, (c) Próximos Passos.
3. Para cada próximo passo acordado: invocar `workitems.create` associando o responsável, data limite e `subject_id` do Deal ou Organização.
4. Publicar as notas na timeline do CRM com a ferramenta de atividade.
