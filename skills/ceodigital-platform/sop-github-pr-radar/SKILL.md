---
name: sop-github-pr-radar
description: "Use when tracking repository health, open pull requests, code reviews, and CI/CD deployment build pipeline statuses via GitHub integration tools and executive status cards."
version: 2.0.0
---

# SOP: Radar de Repositórios GitHub, Pull Requests & CI/CD Pipelines

## Quando Usar
- Em cockpits de acompanhamento tecnológico, revisões semanais de produto ou quando o utilizador pedir: "como estão os pull requests no GitHub?", "o build de CI/CD passou?", "há algum PR bloqueado à espera de revisão?".

## 1. Mapeamento de Ferramentas Reais (`int.github.*` / `integrations.*`)
- **Consulta de Repositórios e PRs:**
  - `int.github.list_pull_requests` / `int.github.get_pull_request`: Inspeciona PRs abertos, branch base, autor e revisores atribuídos.
  - `int.github.list_workflow_runs`: Verifica o estado dos pipelines do GitHub Actions (sucesso, falha, em execução).
  - `int.github.get_issue`: Consulta tarefas e bugs associados às alterações.
- **Visualização Executiva:**
  - `renderWidget({ source: "dynamic.dataset", viz: "table", ... })`: Tabela interativa de PRs abertos com badges de estado de CI e botões de ação para abrir o link no browser.
- **Projeção no Workspace:**
  - `workspaces.open_pane("app:browser:https://github.com/...")` ou aba dedicada de engenharia.

## 2. Boas Práticas de Monitorização de Código
1. **Foco em Bloqueios (PRs Estagnados):**
   - Identificar PRs abertos há mais de 48h sem revisão ou com revisões pendentes.
2. **Saúde de Pipelines (CI/CD Gates):**
   - Alertar imediatamente se um PR prioritário tiver testes unitários ou linters a falhar no GitHub Actions.
3. **Resumo Não-Técnico para Decisores:**
   - Traduzir alterações técnicas em valor de negócio (ex: *"PR #115: Adiciona 104 skills de sistema e resolução dinâmica de contexto"*).

## 3. Procedimento de Atuação
1. **Recolha de Estado:** Consulta a lista de PRs ativos e os runs mais recentes de CI/CD via tools de integração.
2. **Sintetização Executiva:** Organiza os resultados em três grupos: (a) Prontos a Mergear, (b) Em Revisão, (c) Falhas de CI a Resolver.
3. **Apresentação em Artefacto:** Apresenta o radar no chat com `renderWidget` e links diretos.
