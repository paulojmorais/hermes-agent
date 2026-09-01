---
name: adaptive-workspace-layout-morpher
description: "Use when rearranging, splitting, focusing, morphing, or customizing workspace panel layouts (workspaces.morph_layout, workspaces.open_pane, workspaces.focus_pane) for optimal spatial co-working."
version: 1.0.0
---

# SOP: Reorganização Espacial & Morphing Adaptativo de Workspaces

## Quando Usar
- Quando o utilizador pedir: "organiza o ecrã para focar nas vendas", "põe o CRM e a Faturação lado a lado", "foca o painel de documentos", "fecha esta aba", "arruma os painéis deste espaço de trabalho".

## 1. Mapeamento de Ferramentas Reais (`workspaces.*`)
- **Morphing de Layout Completo:**
  - `workspaces.morph_layout({ layoutTree: { ... } })`: Altera a árvore de grupos e splits (linhas e colunas) sem recarregar a página.
- **Abertura & Foco de Painéis Específicos:**
  - `workspaces.open_pane("route:leads" | "route:invoicing" | "route:documents" | "app:browser:<url>" | "artifact:<id>")`: Adiciona uma nova aba ao Workspace.
  - `workspaces.focus_pane("route:leads")`: Traz um painel já aberto para o primeiro plano.
  - `workspaces.close_pane("route:leads")`: Fecha uma aba desnecessária para despoluir o ecrã.

## 2. Padrões de Disposição Espacial (Layout Trees)
1. **Split Duplo (Lado a Lado — 50/50 ou 60/40):**
   - Ideal para comparar ou executar tarefas coordenadas (ex: Faturação à esquerda + Extratos/Bancos à direita + Chat).
2. **Layout em Trio de Foco (Cockpit Comercial):**
   - Coluna 1: Leads/CRM (1.4x) | Coluna 2: Performance/Métricas (1.0x) | Coluna 3: Chat/Copiloto (1.0x).
3. **Layout de Auditoria Documental:**
   - Coluna 1: Visualizador do Documento/Contrato (1.2x) | Coluna 2: Radar de Extração/Compliance (1.0x) | Coluna 3: Chat.

## 3. Procedimento de Atuação
1. **Identificar a Intenção Espacial:** Determina quais os painéis que devem estar visíveis em conjunto.
2. **Executar a Mudança:**
   - Para abrir ou focar abas simples ➔ invoca `workspaces.open_pane` ou `workspaces.focus_pane`.
   - Para reconfigurar a disposição geral ➔ invoca `workspaces.morph_layout`.
3. **Confirmar com Linguagem Natural:** Responde concisamente confirmando a nova disposição espacial.
