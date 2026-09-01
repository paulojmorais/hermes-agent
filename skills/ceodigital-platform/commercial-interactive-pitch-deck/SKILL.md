---
name: commercial-interactive-pitch-deck
description: "Use when creating interactive sales proposals, live pitch decks, dynamic pricing simulators, or client presentations in responsive HTML5 with Tailwind CSS."
version: 1.0.0
---

# SOP: Criação de Propostas e Pitches Comerciais Interativos (HTML5)

## Quando Usar
- Quando o utilizador pedir: "cria uma proposta interativa para o cliente", "faz um pitch deck em HTML com simulador", "cria uma página de apresentação comercial que o cliente possa interagir".

## 1. Estrutura Canónica do Artefacto Comercial
1. **Capa & Proposta de Valor:** Identificação do cliente, branding da empresa e sumário executivo.
2. **Diagnóstico & Dores do Cliente:** Resumo do problema identificado e objetivos de transformação.
3. **Solução & Âmbito dos Serviços:** Fases de entrega, deliverables e metodologia.
4. **Simulador de Investimento Dinâmico:** Seletor interativo de módulos/utilizadores com cálculo automático de ROI.
5. **Botões de Ação Contínua (`data-ceodigital-send`):**
   - `<button data-ceodigital-send="Adjudicar proposta com 50% de entrada">Aprovar Proposta</button>`
   - `<button data-ceodigital-send="Simular plano anual com 15% de desconto">Simular Desconto</button>`

## 2. Procedimento de Criação
1. **Recolha de Dados do Negócio:**
   - Inspeciona os detalhes da oportunidade (`crm.deals.get`) e serviços do catálogo (`services.catalog.list`).
2. **Geração do Artefacto:**
   - Invoca a tool `chat.createArtifact` com `kind: "html"`, `title: "Proposta Comercial · <Nome Cliente>"`.
   - Utiliza Tailwind CSS utilitário para um design escuro e profissional (Dark/Executive).
3. **Apresentação no Workspace:**
   - Abre o painel do artefacto gerado no Workspace via `workspaces.open_pane("artifact:<id>")`.
