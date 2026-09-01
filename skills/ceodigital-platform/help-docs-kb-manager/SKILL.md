---
name: help-docs-kb-manager
description: "Use when authoring, structuring, categorizing, and publishing Help Center articles, onboarding guides, technical FAQs, and knowledge base documentation for clients and internal staff."
version: 2.0.0
---

# SOP: Gestão da Base de Conhecimento & Central de Ajuda (Help Docs KB)

## Quando Usar
- Quando o utilizador pedir: "escreve um artigo de ajuda sobre como emitir faturas", "adiciona um guia de onboarding ao Help Center", "organiza os manuais da empresa por categorias", "cria uma FAQ para responder a dúvidas de clientes".

## 1. Mapeamento de Ferramentas & Rotas
- **Navegação & Gestão no Workspace:**
  - `workspaces.open_pane("route:help_docs")`: Abre a gestão de artigos do Help Center lado a lado.
- **Ferramentas de Descoberta e Ajuda do Copiloto:**
  - `help.page`: Consulta documentação contextual do ecrã atualmente aberto.
  - `help.search({ query: "..." })`: Pesquisa semântica em todos os manuais e cartões de ajuda da plataforma.
- **Criação & Edição de Conteúdos:**
  - `chat.createArtifact({ kind: "markdown", title: "...", content: "..." })`: Elaboração do rascunho estruturado do artigo antes da publicação.

## 2. Padrões de Estruturação de Artigos de Ajuda
1. **Hierarquia Clara (Problema ➔ Resolução ➔ FAQ):**
   - **Título Orientado ao Objetivo:** (ex: *"Como Configurar a Integração com o Software de Faturação Moloni"*).
   - **Resumo de 1 Parágrafo:** O que o leitor vai conseguir fazer no final do guia.
   - **Passo a Passo Numerado:** Instruções sequenciais com indicação clara dos botões e menus a clicar.
   - **Secção de Resolução de Problemas (Troubleshooting):** Resposta aos 2 ou 3 erros mais comuns.
2. **Taxonomia & Categorização:**
   - Agrupar os artigos nas categorias oficiais: *Primeiros Passos (Onboarding)*, *Vendas & CRM*, *Faturação & Finanças*, *Gestão de Projetos*, *Integrações & Segurança*.
3. **Duplo Alcance (Público vs. Interno):**
   - Definir se o artigo é público (visível no Portal do Cliente `/help`) ou de uso interno exclusivo da equipa.

## 3. Procedimento de Atuação
1. **Levantamento de Requisitos:** Identifica o tópico, público-alvo e regras operacionais.
2. **Redação Estruturada:** Redige o artigo em Markdown com formatação limpa (callouts de aviso, tabelas de parâmetros e passos numerados).
3. **Revisão no Workspace:** Apresenta o rascunho e projeta `workspaces.open_pane("route:help_docs")` para publicação e indexação no RAG da plataforma.
