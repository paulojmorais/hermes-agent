---
name: architecture-and-flow-diagrammer
description: "Use when creating dark-themed SVG architecture diagrams, Mermaid flowcharts, decision trees, sequence diagrams, cloud topology schematics, and system maps."
version: 1.0.0
---

# SOP: Diagramas de Arquitetura, Fluxogramas & Topologias de Sistema

## Quando Usar
- Quando o utilizador pedir: "desenha um diagrama da arquitetura", "faz um fluxograma deste processo de aprovação", "mostra a sequência de eventos entre o CRM e o ERP", "cria um esquema de integração em SVG/Mermaid".

## 1. Mapeamento de Ferramentas Reais
- **Geração de Diagrama SVG / HTML5:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Renderiza o diagrama visual diretamente no chat e numa aba do Workspace (`workspaces.open_pane("artifact:<id>")`).
- **Geração de Fluxogramas Mermaid:**
  - `chat.createArtifact({ kind: "markdown", title: "...", content: "```mermaid\n...\n```" })`: Suportado nativamente no renderizador Markdown do chat.

## 2. Padrões Gráficos para Diagramas
1. **Estética Dark-Theme Corporativa:**
   - Fundo escuro elegante (`#0f172a` ou `#0b0f19`), caixas com cantos arredondados (`rx="8"`), bordas subtis (`stroke="#334155"`).
   - Tipografia de sistema limpa: `font-family="system-ui, -apple-system, sans-serif"`.
2. **Código de Cores Funcional para Nós:**
   - 🔵 **Azul (`#3b82f6` / `#1d4ed8`):** Componentes de interface e clientes (Frontend / Mobile / Webhooks).
   - 🟢 **Verde (`#10b981` / `#047857`):** Serviços centrais, APIs e motores de inteligência.
   - 🟣 **Roxo (`#8b5cf6` / `#6d28d9`):** Automações, nós NativeFlow e conectores externos.
   - 🟡 **Âmbar (`#f59e0b` / `#b45309`):** Bases de dados, cofres de segredos e filas de eventos.
3. **Setas & Conexões Vetoriais:**
   - Conexões vetoriais claras com marcadores de ponta de seta (`marker-end="url(#arrow)"`), rótulos explicativos nas ligações.

## 3. Procedimento de Criação
1. **Mapeamento de Componentes:** Identifica os nós (origens, processadores, destinos) e os fluxos de dados.
2. **Construção Vetorial:** Gera o código SVG completo e responsivo (usando `viewBox` para adaptação fluida a qualquer ecrã).
3. **Entrega Visual:** Invoca `chat.createArtifact(kind='html')`, permitindo que o utilizador visualize, amplie e guarde o diagrama.
