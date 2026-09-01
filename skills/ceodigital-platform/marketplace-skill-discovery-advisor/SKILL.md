---
name: marketplace-skill-discovery-advisor
description: "Use when the user requests an operation or integration that the agent lacks knowledge of — searches the Marketplace, recommends specialized skills/packs, and guides 1-click installation."
version: 1.0.0
---

# SOP: Descoberta & Recomendação de Skills no Marketplace

## Quando Usar
- Quando o utilizador pedir uma capacidade, processo ou integração que o sistema não possui no momento (ex: "como integro com o software de faturação X?", "tens um procedimento para gerir contratos de arrendamento?", "como faço propostas para o mercado espanhol?").
- Quando o agente detetar uma lacuna operacional e pretender sugerir proativamente a ativação de uma skill ou Solution Pack do Marketplace.

## 1. Mapeamento de Ferramentas Reais & Rotas
- **Catálogo & Gestão de Skills:**
  - `skills.catalog.list`: Consulta as skills já ativas ou instaladas no tenant.
  - `skills.create_rule`: Cria uma regra/skill customizada quando não existir no marketplace.
- **Navegação no Workspace:**
  - `workspaces.open_pane("route:marketplace")`: Abre o catálogo visual do Marketplace numa aba ao lado.
  - `workspaces.activate_starter_pack`: Instancia um pacote completo (agentes + fluxos + skills).

## 2. Princípios de Descoberta Proativa (Anti-Bloqueio)
1. **Nunca Dizer Apenas "Não Sei Fazer":**
   - Se o utilizador pedir algo fora do catálogo ativo, o agente deve orientar para a solução em vez de emitir uma resposta morta ou alucinar desculpas de orçamento.
2. **Ciclo de Sugestão e Ativação em 3 Passos:**
   - **(a) Diagnóstico:** Reconhece a intenção de negócio do utilizador.
   - **(b) Proposta de Marketplace:** Explica que existe (ou pode ser ativado) um Solution Pack ou Skill no Marketplace para resolver o problema.
   - **(c) Ação Imediata (1-Click):** Abre o painel do Marketplace (`workspaces.open_pane("route:marketplace")`) ou convida a criar a regra através de `skills.create_rule`.

## 3. Procedimento de Atuação
1. **Deteção da Intenção:** O utilizador faz um pedido complexo sem skill ativa correspondente.
2. **Verificação no Catálogo:** Executa `skills.catalog.list({ search: "..." })` para confirmar se a skill já existe inativa.
3. **Recomendação Acionável:**
   - Apresenta uma sugestão em linguagem natural clara e objetiva.
   - Projeta o Marketplace no Workspace com `workspaces.open_pane("route:marketplace")`.
   - Se for uma regra de negócio específica da empresa, propõe registar uma nova regra imediatamente com `skills.create_rule`.
