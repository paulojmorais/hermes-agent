---
name: create-agentflow
description: "Use when creating, editing, architecting, or drafting visual NativeFlow workflows, multi-node automation graphs, AI agent pipelines, triggers, and spatial workspace actions."
version: 2.0.0
---

# SOP: Criação & Arquitetura de Fluxos Visuais no AgentFlow (NativeFlow Engine)

## Quando Usar
- Quando o utilizador pedir: "cria um fluxo de automação", "automatiza o processo de qualificação de leads", "faz um agentflow que recebe um webhook, enriquece na Informa D&B e pede aprovação", "desenha um fluxo multi-agente com o CFO e o Legal".
- Para orquestrar sequências complexas de IA, integrações e ações espaciais no Workspace.

---

## 1. Catálogo Completo de Nós do NativeFlow (35+ Tipos Reais)

O motor NativeFlow organiza os nós em 7 categorias funcionais:

### 1.1. Gatilhos (Triggers / Arranque)
- **`webhook_trigger`**: Arranca quando um webhook externo envia um payload HTTP POST (com validação de headers e rota dedicada).
- **`schedule_trigger`**: Execução periódica com expressão Cron ou intervalo (ex: `0 9 * * 1-5`).
- **`db_event_trigger`**: Dispara mediante mutações em tabelas do Supabase (ex: nova lead inserida, proposta alterada para `won`).
- **`conversation_trigger`**: Arranca a partir de palavras-chave ou intenções detetadas no chat.
- **`channel_trigger`**: Arranca com mensagens recebidas no WhatsApp, Slack, Telegram ou canais sociais.
- **`start`** / **`end`**: Nós canónicos de entrada manual e fecho do fluxo.

### 1.2. Inteligência Artificial & Multi-Agente
- **`llm`**: Invocação direta de LLM com prompt template, variáveis interpoladas `{{input.campo}}`, temperatura e escolha de modelo (Flash vs. Raciocínio).
- **`agent`**: Executa um agente autónomo com acesso a ferramentas autorizadas e objetivo específico.
- **`ceo_agent`**: Invoca uma Persona executiva específica do tenant (ex: *Gonçalo / Comercial*, *Marcus / CFO*, *Duarte / Legal*).
- **`subagent_dispatch`**: Lança um sub-agente em background com limite de passos para tarefas pesadas, reportando assincronamente.
- **`boardroom_debate`**: Executa uma deliberação executiva cruzada entre múltiplos CEO Agents (multi-turn debate), produzindo uma decisão consensual.
- **`condition_agent`**: Classificador semântico que avalia a intenção ou sentimento do texto e bifurca o fluxo por IA.

### 1.3. Conhecimento, RAG & Memória
- **`rag`** / **`retriever`**: Pesquisa semântica em coleções documentais do tenant com restrição por `namespaces` (`client:<id>/**`, `procurement/**`).
- **`document_loader`**: Extrai texto de ficheiros anexados (PDF, Word, Excel, CSV) e fragmenta em blocos.
- **`memory`**: Lê ou persiste factos duradouros no grafo de conhecimento do tenant (`public.memory_entries`).

### 1.4. Ações Espaciais no Workspace (Workspace-First)
- **`workspace_open_pane`**: Abre ou foca automaticamente uma aba no Workspace ativo (`route:leads`, `route:invoicing`, `app:gmail`, `doc:<id>`, `artifact:<id>`).
- **`workspace_morph_layout`**: Reorganiza a grelha de painéis (split 50/50, cockpit de 3 colunas) dinamicamente.
- **`workspace_highlight`**: Aciona um pulso visual ou destaque numa aba específica para orientar o olhar do utilizador.
- **`render_widget`**: Renderiza um Live Data Artifact interativo (`dynamic.dataset`, scorecards, gráficos) com os dados gerados pelo fluxo.

### 1.5. Dados, Negócio & Integrações
- **`informa`**: Consulta oficial da ficha de empresa e solvência (SII) na Informa D&B a partir do NIF.
- **`mcp_tool`**: Invocação direta de ferramentas MCP registadas no catálogo.
- **`integration_tool`**: Execução de ações em apps conectadas (Gmail, Slack, HubSpot, Stripe, Moloni).
- **`http_request`**: Chamada genérica HTTP (GET, POST, PUT, DELETE) com suporte a auth headers e timeouts.
- **`db_read`** / **`db_write`**: Leitura e escrita direta em tabelas do tenant no Supabase com validação de esquema.
- **`transform`**: Manipulação e mapeamento de payloads JSON via DSL ou transformações estruturadas.
- **`code`**: Execução isolada de scripts Python ou JavaScript em sandbox efémera segura.
- **`email_send`**: Envio de emails transacionais ou notificações formatadas.
- **`workitem_context`** / **`workitem_submit_output`**: Ponte bidirecional com o cockpit de tarefas operacionais.

### 1.6. Controlo de Fluxo & Lógica
- **`conditional`**: Bifurcação If/Else baseada em expressões booleanas.
- **`switch`**: Roteamento multi-ramo (N caminhos) por correspondência de valores.
- **`human_input`**: Portão HITL (Human-in-the-Loop) — suspende o fluxo até aprovação humana via UI com timeout configurável.
- **`wait`** / **`timer`**: Atraso temporal programado (segundos, minutos, dias).
- **`loop`** / **`iteration`**: Iteração sobre arrays de itens (ex: para cada cliente numa lista).
- **`split`** / **`merge`**: Execução paralela de ramos e posterior agregação de resultados.

### 1.7. Resiliência & Gestão de Erros
- **`try_catch`**: Captura falhas em nós críticos e redireciona para tratamento seguro.
- **`fallback`**: Define valor de contingência caso uma integração externa falhe.
- **`error_notification`**: Dispara alerta imediato em caso de incidente de execução.

---

## 2. Estrutura Canónica do Rascunho (`agentflow.draft`)

Ao invocar a ferramenta `agentflow.draft`, compõe a estrutura com `nodes` e `edges` com coordenadas lógicas `position: { x, y }`:

```json
{
  "name": "Qualificação Automática de Leads & Alerta Slack",
  "description": "Recebe webhook, enriquece via Informa D&B, avalia com Persona Comercial e abre painel no Workspace.",
  "nodes": [
    {
      "id": "node-trigger",
      "type": "webhook_trigger",
      "label": "Webhook Nova Lead",
      "position": { "x": 100, "y": 200 },
      "data": { "method": "POST" }
    },
    {
      "id": "node-informa",
      "type": "informa",
      "label": "Enriquecimento Informa D&B",
      "position": { "x": 350, "y": 200 },
      "data": { "taxNumber": "{{input.nif}}" }
    },
    {
      "id": "node-eval",
      "type": "ceo_agent",
      "label": "Avaliação Comercial (Gonçalo)",
      "position": { "x": 600, "y": 200 },
      "data": {
        "agentSlug": "sales_director",
        "instruction": "Avalia o potencial desta empresa com base no volume de faturação e risco SII."
      }
    },
    {
      "id": "node-gate",
      "type": "conditional",
      "label": "Score Alto (>70)?",
      "position": { "x": 850, "y": 200 },
      "data": { "expression": "output.score > 70" }
    },
    {
      "id": "node-open-pane",
      "type": "workspace_open_pane",
      "label": "Abrir Ficha no Workspace",
      "position": { "x": 1100, "y": 120 },
      "data": { "paneId": "route:leads" }
    },
    {
      "id": "node-notify",
      "type": "integration_tool",
      "label": "Notificar Canal Slack",
      "position": { "x": 1100, "y": 280 },
      "data": { "app": "slack", "action": "send_message" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "node-trigger", "target": "node-informa" },
    { "id": "e2", "source": "node-informa", "target": "node-eval" },
    { "id": "e3", "source": "node-eval", "target": "node-gate" },
    { "id": "e4", "source": "node-gate", "target": "node-open-pane", "sourceHandle": "true" },
    { "id": "e5", "source": "node-gate", "target": "node-notify", "sourceHandle": "true" }
  ]
}
```

---

## 3. Protocolo de Ação Imediata & Experiência Imersiva no Workspace

1. **Geração Imediata:** Invoca `agentflow.draft` no primeiro turno com o grafo completo desenhado. Nunca responder com meras descrições textuais antes de gerar o rascunho na ferramenta.
2. **Abertura Imersiva Lado a Lado (Live Flow Canvas):**
   - Projeta imediatamente a aba do editor no Workspace via `workspaces.open_pane("route:agentflow")` ou `workspaces.open_pane("flow:<flowId>")`.
   - O utilizador vê o canvas interativo a renderizar os nós em tempo real ao lado do chat enquanto conversa.
3. **Execução Conversacional & Cartão Vivo (`FlowExecutionCard`):**
   - Ao executar com `agentflow.run({ flowId, inputs })`, o sistema emite um cartão vivo de telemetria no chat que reflete o avanço passo-a-passo (nós a passarem a verde `completed`, tempo decorrido, formulários HITL de aprovação com botões de ação direta).
4. **Refinamento Conversacional:**
   - O utilizador pode pedir ajustes em linguagem natural (ex: *"adiciona um nó de aprovação antes de faturar"*), e o agente atualiza o canvas ativo via `agentflow.draft(mode='edit')` + `agentflow.canvas.apply`.
