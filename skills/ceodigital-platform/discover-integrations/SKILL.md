---
name: discover-integrations
description: "Use when identifying, testing, connecting, or troubleshooting external application integrations (200+ apps via Composio, Nango, MCP) including Gmail, Outlook, Slack, HubSpot, Stripe, Moloni, and Google Drive."
version: 2.0.0
---

# SOP: Descoberta, Conexão & Gestão de Integrações Externas

## Quando Usar
- Quando o utilizador pedir: "que integrações temos ativas?", "liga o meu Gmail / Outlook", "conecta o Slack à plataforma", "testa se a ligação ao HubSpot está a funcionar", "como integro com o software de faturação Moloni?".

## 1. Mapeamento de Ferramentas Reais (`integrations.*` & `setup_mcp`)
- **Consulta de Estado & Catálogo:**
  - `integrations.list`: Lista todas as integrações disponíveis e o seu estado atual (`connected`, `disconnected`, `error`, `needs_reauth`).
  - `integrations.get({ id: "..." })`: Obtém detalhes técnicos, contas autorizadas e permissões de uma integração.
- **Teste de Conectividade:**
  - `integrations.test({ id: "..." })`: Valida o token de acesso e a saúde da API externa em tempo real.
- **Conexão & Autorização:**
  - `integrations.connect({ provider: "gmail" | "outlook" | "slack" | "hubspot" | "stripe" | "moloni" })`: Inicia o fluxo seguro de autorização OAuth.
  - `setup_mcp({ server: "..." })`: Apresenta cartão de consentimento inline no chat para ativar MCP servers ou ferramentas.
- **Desconexão:**
  - `integrations.disconnect({ id: "..." })`: Revoga o acesso e remove tokens em segurança.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:integrations")` ou `workspaces.open_pane("app:<service>")` (ex: `app:gmail`, `app:slack`).

## 2. Catálogo de Integrações Suportadas (200+ Apps)
1. **Comunicação & Produtividade:** Google Workspace (Gmail, Calendar, Drive), Microsoft 365 (Outlook, Teams, OneDrive), Slack, Notion, Discord.
2. **CRM & Vendas:** HubSpot, Salesforce, Pipedrive, Informa D&B, WhatsApp Business (Meta).
3. **Finanças & Pagamentos:** Stripe, Moloni, InvoiceXpress, PayPal, Revolut Business.
4. **Dev & Automações:** GitHub, GitLab, n8n, Flowise, Webhooks customizados.

## 3. Protocolo de Ação (Zero Falsas Ausências)
- **Regra de Ouro:** Se uma aplicação fizer parte do ecossistema suportado (200+ apps), o agente **NUNCA** deve dizer que a integração não existe.
- Se a app estiver desconectada: confirmar o suporte oficial e fornecer imediatamente o link/ação de conexão em 1-clique (`integrations.connect` ou `setup_mcp`).
- Para consultar dados de uma app já ligada: invocar diretamente as respetivas tools de namespace `int.<app>.*` (ex: `int.gmail.fetch_emails`, `int.slack.list_channels`).

## 4. Procedimento de Atuação
1. **Verificação de Estado:** Executa `integrations.list` para verificar se a app já está autorizada.
2. **Se Desconectada:** Dispara `integrations.connect` ou projeta `workspaces.open_pane("route:integrations")`.
3. **Se Conectada:** Abre a aba de co-working correspondente (`workspaces.open_pane("app:gmail")`) e opera as tools `int.<app>.*`.
