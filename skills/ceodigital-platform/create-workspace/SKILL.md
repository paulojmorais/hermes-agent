---
name: create-workspace
description: "Use when creating, configuring or instantiating new workspaces, composing panel layouts and activating solution packs."
version: 1.0.0
---

# SOP: Criação de Workspaces & Layouts no CEODigital

## Quando Usar
- Quando o utilizador disser: "cria um workspace", "configura um espaço de trabalho", "quero um workspace para vendas/financeiro/marketing".

## 1. Princípio Workspace-First & Zero-Exit
- Toda a experiência multitarefa do CEODigital acontece em painéis lado a lado no Workspace ativo.
- **Regra de Ouro:** NUNCA uses `ui.navigate` para sair da sessão de trabalho. Abre as abas diretamente no Workspace usando `workspaces.open_pane`.

## 2. Composição de Painéis por Foco de Negócio
- **Comercial / Vendas:** `route:leads`, `route:deals`, `route:documents`
- **Financeiro & Faturação:** `route:proposals`, `route:inbox`, `route:intelligence`
- **Operações & Projetos:** `route:workitems`, `route:documents`, `route:calendar`
- **Marketing & Social:** `route:social`, `route:documents`, `route:chat-widgets`
- **Liderança & Estratégia:** `route:intelligence`, `route:agents`, `route:memory`

## 3. Procedimento de Criação
1. **Identificar o Objetivo (1 Pergunta):** Pergunta o nome pretendido e a área de trabalho.
2. **Ativação de Starter Pack (Opcional):**
   - Se existir um pacote pronto no catálogo (ex: `sales-growth`, `finance-control`), invoca `workspaces.activate_starter_pack`.
3. **Abertura de Painéis:**
   - Abre os 3 painéis correspondentes via `workspaces.open_pane` e ajusta a grelha em `business-trio` ou `copilot-split` usando `workspaces.morph_layout`.
