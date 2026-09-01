---
name: sop-hr-time-off-approvals
description: "Use when managing employee vacation requests, sick leave, time-off scheduling on the timeline, checking team overlap conflicts, and processing formal manager approvals."
version: 2.0.0
---

# SOP: Gestão de Férias, Ausências & Aprovações de Equipa (RH)

## Quando Usar
- Quando um colaborador submeter um pedido de férias ou ausência, ou quando o utilizador pedir: "aprova as férias do João", "quem vai estar ausente na próxima semana?", "vê se há sobreposição de férias na equipa comercial".

## 1. Mapeamento de Ferramentas Reais (`timeline.*` & `calendar.*`)
- **Linha do Tempo & Registo de Ausências:**
  - `timeline.events.list({ subject_type: "member" })`: Consulta histórico de férias e ausências já registadas.
  - `timeline.events.get`: Detalha datas de início/fim e justificação do pedido.
  - `timeline.pins.add`: Afixa ausências críticas no calendário da equipa.
- **Deteção de Sobreposições no Calendário:**
  - `renderWidget({ source: "calendar.upcoming", viz: "feed" })`: Mostra o mapa visual de ausências do departamento.
- **Tarefas de Validação & Aprovação:**
  - `workitems.status` / `workitems.create`: Gera o item de aprovação formal para o responsável de departamento (HITL).

## 2. Regras de Gestão de Capacidade
1. **Regra de Cobertura Mínima:**
   - Garantir que cada departamento mantém sempre pelo menos 50% da sua capacidade operacional ativa durante o período solicitado.
2. **Deteção de Conflitos na Mesma Equipa:**
   - Se dois colaboradores com a mesma função técnica ou comercial pedirem o mesmo período, alertar imediatamente o gestor com a sobreposição identificada.
3. **Registo Formal & Notificação:**
   - Após aprovação pelo gestor, o evento é sincronizado na timeline pública do departamento e arquivado no histórico de RH.

## 3. Procedimento de Atuação
1. **Inspeção do Pedido:** Verifica as datas solicitadas e o saldo de dias disponíveis do colaborador.
2. **Cruzamento de Calendários:** Consulta as ausências já agendadas para o mesmo departamento.
3. **Parecer & Aprovação:** Se não houver conflitos, sugere a aprovação; se houver sobreposição, apresenta a tabela comparativa ao gestor.
4. **Confirmação:** Atualiza o registo de evento na timeline e notifica o colaborador.
