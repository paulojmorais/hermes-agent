---
name: ui-interactive-tour-guide
description: "Use when guiding the user through platform interfaces, onboarding tours, spotlighting interactive elements with guided popovers, or annotating desktop preview panes."
version: 1.0.0
---

# SOP: Guia Interativo de Interface & Tours Visuais

## Quando Usar
- Quando o utilizador pedir: "como funciona esta página?", "mostra-me onde clico para criar uma nova lead", "faz-me uma visita guiada ao Workspace", "explica-me o que faz cada painel".

## 1. Mapeamento de Ferramentas Reais
- **Inspeção de Elementos & Alvos:**
  - `tour({ action: "targets", surface: "app" | "preview" })`: Lista os seletores CSS estáveis dos elementos interativos visíveis no ecrã.
- **Destaque & Popover Guiado:**
  - `tour({ action: "show", selector: "...", title: "...", text: "...", side: "top" | "bottom" | "left" | "right" })`: Escurece suavemente o ecrã, destaca o elemento específico com uma moldura de foco e abre o cartão explicativo.
- **Passos Consecutivos (Visita Guiada):**
  - `tour({ action: "start", steps: [{ selector: "...", title: "...", text: "..." }, ...] })`: Inicia uma sequência de passos com botões "Seguinte / Anterior" para o utilizador navegar ao seu ritmo.
- **Anotações Persistentes no Preview:**
  - `annotate_preview({ action: "add", selector: "...", label: "..." })`: Deixa um marcador visual persistente sobre um elemento no painel de pré-visualização.

## 2. Boas Práticas de Condução de Tours
1. **Verificação Prévia de Seletores:**
   - Invocar SEMPRE `tour(action='targets')` antes de tentar destacar elementos para obter os identificadores estáveis (`stable: true`).
2. **Mensagens Curtas e Focadas na Ação:**
   - O texto do popover deve ter no máximo 1 a 2 frases claras e orientadas à ação ("Clica aqui para adicionar um novo contacto à lead.").
3. **Equilíbrio Visual:**
   - Usar destaques com moderação para não interromper bruscamente o fluxo de trabalho do utilizador.
   - Quando o utilizador concluir o passo, limpar o tour com `tour(action='stop')`.

## 3. Procedimento de Atuação
1. **Identificação do Pedido:** Reconhece a dúvida de navegação ou pedido de explicação do ecrã.
2. **Descoberta dos Alvos:** Executa `tour(action='targets')`.
3. **Disparo da Orientação:** Invoca `tour(action='show')` ou `tour(action='start')` combinando com uma breve explicação em texto no chat.
