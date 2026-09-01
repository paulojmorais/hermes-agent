---
name: sop-project-phase-gate
description: "Use when validating that all mandatory tasks and deliverables of an implementation phase are complete before advancing the phase or invoicing."
version: 1.0.0
---

# SOP: Validação de Phase Gates em Projetos

## Quando Usar
- Ao concluir uma etapa num projeto de implementação ou prestação de serviços, quando o utilizador pedir para "avançar a fase" ou "validar o gate".

## 1. Mapeamento de Ferramentas Reais
- `implementations.phases.list`: Checklist da fase ativa.
- `implementations.files.list`: Entregáveis/ficheiros anexados à fase.
- `implementations.phases.change_status`: Avanço da fase (HITL).
- `workitems.list`: Verificação de tarefas obrigatórias pendentes.
- `renderWidget` / `chat.createArtifact`: Widget interativo de checklist.

## 2. Procedimento de Validação
1. **Inspeção da Fase Ativa:**
   - `implementations.phases.list` para obter a checklist de critérios (`is_required`).
2. **Confirmação de Deliverables:**
   - `implementations.files.list` para garantir que reportes/entregáveis estão anexados.
   - `workitems.list` para confirmar tarefas obrigatórias concluídas.
3. **Renderização do Estado:**
   - Projeta um widget `checklist` interativo (`renderWidget`/artefacto HTML) com o estado de cada critério (verde = cumprido, vermelho = em falta).
4. **Decisão & Aprovação:**
   - Se todos os critérios estiverem cumpridos: avança a fase com `implementations.phases.change_status` e notifica no Portal do Cliente.
   - Se faltar algo: apresenta claramente o que falta e não avança.