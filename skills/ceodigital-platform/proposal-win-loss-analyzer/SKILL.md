---
name: proposal-win-loss-analyzer
description: "Use when analyzing the outcome of closed sales deals (won or lost), logging success/failure reasons, and driving the transition to implementation projects or refining pricing."
version: 1.0.0
---

# SOP: Análise Pós-Fecho de Negócios (Win/Loss)

## Quando Usar
- Quando um negócio for fechado como ganho (`won`) ou perdido (`lost`), ou quando o utilizador pedir "analisa o porquê de termos perdido/ganho este negócio".

## 1. Cenário: Negócio Ganho (Win)
1. **Registo do Fator de Sucesso:** Invoca `crm.deals.add_note` anotando o motivo do fecho (preço, relação, solução).
2. **Transição para Implementação:**
   - Se o negócio envolver implementação, invoca `action.createProject` para criar o projeto inicial e fará o `workitems.create` das principais entregas.
3. **Abertura do Projeto no Workspace:** Proposta ativa no Workspace via `workspaces.open_pane("route:implementation:<id>")`.

## 2. Cenário: Negócio Perdido (Loss)
1. **Registo do Motivo de Perda:** Invoca `crm.deals.close_lost` com o `reason` estruturado (preço, concorrência, timing, sem autoridade).
2. **Análise de Tendências:** Seja analisadas as perdas recentes para identificar padrões (ex: perdas frequentes por preço em segmento X).
3. **Recomendação de Ajuste:** Sugere ajustes no catálogo de preços ou abordagem; documenta no chat para revisão do gestor comercial.