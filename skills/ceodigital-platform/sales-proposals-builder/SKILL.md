---
name: sales-proposals-builder
description: "Use when creating, structuring, pricing, or managing sales proposals, adding service catalog items, configuring payment tranches, and generating signing links."
version: 1.0.0
---

# SOP: Elaboração e Gestão de Propostas Comerciais

## Quando Usar
- Quando o utilizador pedir: "cria uma proposta comercial para o cliente X", "adiciona o serviço de consultoria à proposta", "configura tranches de pagamento (50/50)", "envia a proposta para aprovação".

## 1. Mapeamento de Ferramentas Reais (`services.*`)
- **Catálogo de Serviços Base:**
  - `services.catalog.list`: Consulta serviços disponíveis (código, nome, preçário padrão, horas).
  - `services.catalog.get`: Obtém detalhes técnicos e margens de um item.
- **Gestão de Propostas:**
  - `services.proposals.create`: Cria proposta em estado rascunho (associada a `organizationId` ou `dealId`).
  - `services.proposals.items.add`: Adiciona linhas de serviço com quantidade, preço unitário e desconto.
  - `services.proposals.tranches.add`: Define o faseamento de pagamentos (ex: 50% adjudicação, 50% entrega).
  - `services.proposals.send`: Altera estado para enviada e gera o token de assinatura pública (`/p/$token`).
  - `services.proposals.accept` / `reject` / `cancel`: Gestão do ciclo de vida da proposta.

## 2. Procedimento de Atuação
1. **Consulta Prévia do Catálogo:**
   - Invoca `services.catalog.list` para selecionar os serviços corretos e preços vigentes.
2. **Composição Financeira com Paridade:**
   - Calcula subtotais, taxas de IVA e valor final em Euros.
   - Invoca `services.proposals.items.add` e `services.proposals.tranches.add` para estruturar a proposta.
3. **Projeção Visual no Workspace:**
   - Abre o editor da proposta lado a lado no Workspace usando `workspaces.open_pane("doc:proposal:<id>")` ou `workspaces.open_pane("route:proposals")`.
