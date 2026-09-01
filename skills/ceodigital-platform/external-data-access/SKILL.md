---
name: external-data-access
description: "Use when the agent needs to access external data sources (Portuguese official portals, bureau data, government stats, banking) — decides between API, browser automation, or MCP layer."
version: 1.0.0
---

# SOP: Acesso a Fontes Externas de Dados (Matriz de 3 Camadas)

## Regra de Ouro
Antes de pedir credenciais ou tentar scraping, avalia as **três camadas** de acesso por ordem de preferência. NUNCA tentes scraping/browser se existir uma API oficial estável.

## 1. As 3 Camadas de Acesso

### Camada 1 — API Nativa / Integração Estável (Preferida)
- **Mecanismo:** `int.<app>.<action>` via Composio/Nango/MCP.
- **Fonte:** Apps com API oficial (Gmail, Slack, Stripe, HubSpot, Notion, Informa D&B).
- **Tools:** `int.gmail.*`, `int.slack.*`, `int.informadb.company_file`, `int.stripe.*`.
- **Quando usar:** Sempre que existir API oficial com OAuth/Key.

### Camada 2 — Automação de Navegador (Playwright via Connector Companion)
- **Mecanismo:** `browser.launch / navigate / click_and_fill / screenshot` via `relayDispatch` ao dispositivo local.
- **Fonte:** Portais do Estado PT (AT, Segurança Social, INE), bancos (Millennium, BCP) — sem API pública, autenticação por sessão browser.
- **Tools:** `browser.launch` (com `initialUrl`), `browser.navigate`, `browser.click_and_fill`, `browser.screenshot`.
- **Requisitos:** Connector Companion conectado (`connector.relay.use`), credenciais no cofre, e HITL para ações sensíveis.
- **GUI:** Projectar o portal no Workspace com `workspaces.open_pane("app:browser:<url>")`.

### Camada 3 — MCP Server Especializado / Endpoint Agregador
- **Mecanismo:** MCP tools expostas como `int.<dominio>.*`.
- **Fonte:** Fontes que precisam de um contrato estável e agregação (ex: Portal de Concursos Base.gov.pt, endpoint de estatísticas do INE).
- **Tools:** MCP tools descritas no catálogo (ex: `int.basegov.*`, `int.ine.*`).
- **Quando usar:** Quando o scraping pontual é frágil e compensa investir num endpoint consolidado.

## 2. Matriz de Roteamento (Fonte → Camada → Mecanismo)

| Fonte | Camada | Mecanismo Real |
| :--- | :--- | :--- |
| Portal das Finanças (AT) | 2 | `browser.navigate` + credenciais cofre + HITL |
| Segurança Social | 2 | `browser.launch` → sessão autenticada |
| INE / Estatísticas | 2 ou 3 | Playwright OU MCP/API agregador |
| Bancos (Millennium, BCP) | 2 | Connector + 2FA/HITL |
| Concursos (Base.gov.pt) | 3 | `int.basegov.*` |
| Informa D&B | 1 | `int.informadb.company_file` |
| Gmail, Slack, Stripe | 1 | `int.*` (Composio/Nango) |

## 3. Procedimento de Decisão
1. **Tenta Camada 1:** Consulta a lista de integrações (`integrations.list`) e verifica se a app tem API oficial.
2. **Se não existir API:** Verifica se há um Connector Companion local (`connector.relay.use`); se sim, usa a Camada 2 com `browser.launch`.
3. **Se não houver dispositivo nem API:** Considera a Camada 3 (MCP) e orienta a ativação pelo `setup_mcp` / catálogo.
4. **NUNCA** digas ao utilizador que precisas de "ativar ferramentas magicamente" nem inventes credenciais.