---
name: portal-base-gov-tenders
description: "Use when scouting Portuguese public procurement tenders (Base.gov.pt), searching by CPV/sector/value, analyzing tender notices, auditing mandatory eligibility criteria, and tracking bid submission deadlines."
version: 2.0.0
---

# SOP: Radar de Concursos Públicos & Contratação Pública (Base.gov.pt)

## Quando Usar
- Quando o utilizador pedir: "procura concursos públicos de software / consultoria no Base.gov", "vê os novos anúncios de contratação pública", "qual o prazo limite para este concurso?", "audita os requisitos de elegibilidade para concorrer ao concurso X".

## 1. Mapeamento de Ferramentas & Camadas de Acesso (Camada 2 / 3)
- **Consulta via Agregação MCP / API (Camada 3 — Preferencial):**
  - `mcp_tool` / endpoints agregadores do Base.gov para pesquisa estruturada por CPV (Common Procurement Vocabulary), entidade adjudicante, valor base e distrito.
- **Acesso via Automação Web / Playwright (Camada 2 — Fallback / Detalhes):**
  - `browser.launch({ initialUrl: "https://www.base.gov.pt/Base4/pt/pesquisa/" })` via CEODigital Companion Desktop.
  - `browser.navigate` + `browser.screenshot`: Inspeção visual da ficha detalhada do concurso e download de peças do procedimento.
- **Cruzamento de Conformidade & Certidões:**
  - `portal-certidao-nao-divida`: Validação de regularidade fiscal (AT) e contributiva (Segurança Social).
  - `sop-tender-compliance-check`: Scorecard de requisitos técnicos e cadernos de encargos.
- **Projeção no Workspace:**
  - `workspaces.open_pane("app:browser:https://www.base.gov.pt/...")` ou `workspaces.open_pane("route:documents")`.

## 2. Dimensões de Avaliação de Concursos Públicos
1. **Enquadramento Técnico por Código CPV:**
   - Filtrar anúncios pelo ramo de atividade da empresa (ex: 72000000-5 Serviços TI, 79400000-8 Consultoria de Gestão).
2. **Valor Base & Tipologia de Procedimento:**
   - Ajuste Direto (<20k€), Consulta Prévia (<75k€) ou Concurso Público (>75k€).
3. **Prazos Críticos & Pedidos de Esclarecimento:**
   - Data limite para apresentação de propostas e período legal para apresentação de pedidos de esclarecimento sobre o caderno de encargos.
4. **Habilitação Jurídico-Fiscal Obrigatória:**
   - Certidões de não dívida atualizadas (<6 meses), declaração de inexistência de impedimentos (art. 55º do CCP) e alvarás setoriais.

## 3. Procedimento de Atuação
1. **Pesquisa Estruturada:** Executa a consulta no Base.gov por palavras-chave ou código CPV.
2. **Triagem de Oportunidades:** Apresenta a lista de concursos em tabela interativa (`renderWidget` com `dynamic.dataset`) com Entidade, Objeto, Preço Base e Data Limite.
3. **Dossier de Candidatura:** Se o utilizador decidir avançar, cria a pasta de documentação em `/documents` e instancia o deal no CRM (`crm.deals.create`).
