---
name:
  pt-PT: "Gerador de Apresentações Executivas PPTX"
  en: "Executive PPTX Presentation Generator"
description:
  pt-PT: "Gera apresentações profissionais completas em ficheiro PowerPoint (.pptx) com múltiplos slides, bullets e notas de orador a partir dos dados do workspace."
  en: "Generates professional PowerPoint (.pptx) decks from workspace data."
mode: agentic
visibility: tenant
needs_approval: true
required_capabilities: ["chat.artifact.write"]
origin: catalog
version: "1.0.0"
is_bundle: true
entrypoint: "SKILL.md"
---

# SOP: Geração de Apresentações PPTX

## Quando Usar
- Quando o utilizador pedir: "faz uma apresentação", "cria um deck de slides", "resume os conteúdos deste workspace em PowerPoint".

## Recursos Incluídos no Bundle
- `scripts/validate_deck.py`: Validador de consistência de tópicos, limites de caracteres por slide e contraste visual.
- `templates/executive-deck-structure.json`: Estrutura canónica de 6 slides executivos (Capa, Situação Atual, Análise, Solução, Métricas, Ações).

## Procedimento
1. **Recolha e Estruturação de Dados:**
   - Sintetiza as métricas e dados de projetos, propostas ou documentos abertos.
2. **Validação do Deck:**
   - Utiliza a estrutura de `templates/executive-deck-structure.json` como base.
3. **Invocação Direta:**
   - Invoca imediatamente a tool `chat.generatePptx` passando os slides formatados.
