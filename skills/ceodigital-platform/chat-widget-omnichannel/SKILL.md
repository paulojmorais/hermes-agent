---
name: chat-widget-omnichannel
description: "Use when creating, configuring, customizing, or embedding public website chat widgets, WhatsApp Meta bridges, lead capture bots, and human handoff routing."
version: 2.0.0
---

# SOP: Configuração & Gestão de Chat Widgets Omnicanal (Web & WhatsApp)

## Quando Usar
- Quando o utilizador pedir: "cria um widget de chat para o meu site", "configura o assistente do WhatsApp", "ajusta as cores e mensagem inicial do chat do site", "como incorporo o chat no WordPress/Next.js/HTML?", "define regras de encaminhamento para a equipa".

## 1. Mapeamento de Ferramentas & Rotas
- **Navegação & Gestão no Workspace:**
  - `workspaces.open_pane("route:chat-widgets")`: Abre o painel de gestão de widgets de chat lado a lado.
- **Configuração de Canais & Redes:**
  - `/chat-widgets`: Definição de origens autorizadas (CORS/Allowed Domains), cores da marca, avatar do bot, mensagem de boas-vindas e gatilhos de captura de lead.
- **Criação Rápida de Assistente de Captura:**
  - `create-chat-widget-assistant`: Gera o prompt especializado do bot (qualificação B2B, suporte nível 1, agendamento de chamadas).

## 2. Parâmetros Canónicos de Configuração
1. **Domínios Autorizados (Security Gate):**
   - Restringir aos domínios oficiais da empresa (ex: `empresa.pt`, `app.empresa.pt`) para prevenir incorporação não autorizada.
2. **Encaminhamento Humano (Human Handoff):**
   - Definir regras de transição para operadores reais (`attendance.inbox` / Central de Atendimento) quando o cliente manifestar intenção de compra imediata ou insatisfação.
3. **Ponte WhatsApp Business (Meta API):**
   - Configuração do Webhook oficial e chave de API para receção e envio bidirecional de mensagens no WhatsApp corporativo.

## 3. Snippet de Incorporação Web (Embed Code)
Ao fornecer o código de integração ao utilizador, gerar o script padrão limpo:
```html
<script 
  src="https://cdn.ceodigital.pt/widget/v2/ceodigital-chat.js"
  data-widget-id="{{WIDGET_ID}}"
  data-tenant="{{TENANT_SLUG}}"
  data-primary-color="#0f172a"
  defer>
</script>
```

## 4. Procedimento de Atuação
1. **Diagnóstico do Canal:** Identifica se o objetivo é Web Widget, WhatsApp ou Híbrido.
2. **Parametrização:** Orienta os campos de personalização (cores, persona do bot, formulário de captura de NIF/email).
3. **Projeção:** Abre `workspaces.open_pane("route:chat-widgets")` para revisão visual pelo utilizador.
