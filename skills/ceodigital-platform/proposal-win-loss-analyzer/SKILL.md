---
name: proposal-win-loss-analyzer
description: "Use when analyzing closed commercial proposals (won or lost), diagnosing deal conversion drivers, logging loss reasons, adjusting service catalog pricing, and transitioning won deals to implementation projects."
version: 2.0.0
---

# SOP: Análise de Win/Loss de Propostas Comerciais & Transição Operacional

## Quando Usar
- Quando uma proposta for ganha (`won`) ou perdida (`lost`), ou quando o utilizador pedir: "analisa porque perdemos a proposta X", "qual a taxa de conversão das nossas propostas este mês?", "passa a proposta ganha para projeto de implementação", "resume os principais motivos de perda".

## 1. Mapeamento de Ferramentas Reais (`services.proposals.*` & `implementations.*`)
- **Consulta & Auditoria de Propostas:**
  - `services.proposals.list({ status: "accepted" | "rejected" | "sent" })`: Lista propostas com filtros de estado, valor e datas.
  - `services.proposals.get({ id: "..." })`: Inspeciona linhas de serviço, tranches de pagamento, margens e histórico de negociação.
- **Gestão de Ciclo de Vida & Motivos de Fecho:**
  - `services.proposals.accept({ id: "..." })`: Marca como ganha/adjudicada.
  - `services.proposals.reject({ id: "...", reason: "price" | "competitor" | "timing" | "scope" | "budget" })`: Regista a perda com taxonomia estruturada.
- **Transição para Projeto de Implementação:**
  - `implementations.projects.list`: Valida a criação do projeto pós-venda para entrega dos serviços acordados.
  - `workitems.create`: Instancia as tarefas de kickoff e phase gates baseados nas tranches aprovadas.
- **Visualização de Desempenho:**
  - `renderWidget({ source: "services.proposalsByStatus", viz: "pie-chart" })`: Gráfico de taxa de conversão e motivos de fecho.

## 2. As 4 Etapas da Análise de Win/Loss
1. **Diarização dos Motivos de Perda (Loss Taxonomy):**
   - Preço elevado / Fora de orçamento (`price`).
   - Concorrência com solução alternativa (`competitor`).
   - Adiamento da decisão / Falta de urgência (`timing`).
   - Desalinhamento técnico do âmbito (`scope`).
2. **Avaliação dos Fatores de Sucesso (Win Drivers):**
   - Prazos de entrega competitivos, diferenciação técnica ou estrutura flexível de tranches (`services.proposals.tranches`).
3. **Recomendações para o Catálogo de Serviços:**
   - Sugere revisões de preços em `create-pricing-profile` ou ajustes na `sales-objection-handler-battlecard`.
4. **Kickoff Automático da Entrega (Handover para Ops):**
   - Ao ganhar a proposta, orienta a criação do projeto de implementação e abertura do painel no Workspace (`workspaces.open_pane("route:implementation")`).

## 3. Procedimento de Atuação
1. **Inspeção:** Lê a proposta via `services.proposals.get` e o histórico do deal.
2. **Registo do Desfecho:** Executa `services.proposals.accept` ou `services.proposals.reject` com o motivo categorizado.
3. **Relatório & Próximos Passos:** Apresenta a síntese executiva no chat e agenda o follow-up operacional.
