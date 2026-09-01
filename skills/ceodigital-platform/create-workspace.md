---
name:
  pt-PT: "Criador de Workspaces & Layouts"
  en: "Workspace & Layout Builder"
description:
  pt-PT: "Guia o utilizador na criação e instanciação de novos workspaces vivos, seleção de painéis (CRM, Tarefas, Documentos) e abertura imediata sem sair do fluxo."
  en: "Guides creating and instantiating living workspaces with zero-exit panel layout."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["workspaces.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Criação de Workspaces no CEODigital

## Quando Usar
- Quando o utilizador disser: "cria um workspace", "configura um espaço de trabalho", "quero um workspace para vendas/financeiro/marketing".

## Procedimento
1. **Entrevista de Foco (1 Pergunta):** Pergunta o nome do espaço e o foco pretendido (Vendas/CRM, Financeiro/Cobranças, Projetos/Operações, Marketing, Estratégia/Geral).
2. **Composição Inteligente de Painéis:**
   - **Vendas / Comercial:** `route:leads`, `route:deals`, `route:documents`
   - **Financeiro & Cobranças:** `route:proposals`, `route:inbox`, `route:intelligence`
   - **Projetos & Operações:** `route:workitems`, `route:documents`, `route:calendar`
   - **Marketing & Social:** `route:social`, `route:documents`, `route:chat-widgets`
   - **Estratégia & CEO:** `route:intelligence`, `route:agents`, `route:memory`
3. **Execução Espacial:**
   - Cria o workspace e projeta o layout utilizando `workspaces.open_pane` ou `workspaces.activate_starter_pack`.
   - **Regra de Ouro:** Nunca uses `ui.navigate` para sair da sessão de trabalho atual; abre as abas diretamente no Workspace.
