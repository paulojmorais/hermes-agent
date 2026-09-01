---
name: portal-ine-statistics
description: "Use when accessing Portuguese statistical and economic indicators (INE, Pordata, Banco de Portugal) via API or MCP aggregation layer for market research and benchmarking."
version: 1.0.0
---

# SOP: Acesso a Estatísticas Económicas Portuguesas (INE / Banco de Portugal)

## Quando Usar
- Quando o utilizador pedir: "qual é o PIB de Portugal?", "dá-me a inflação do ano passado", "preciso de dados setoriais do INE para um projeto", "taxa de desemprego atual".

## 1. Camadas de Acesso (Camada 3 — API/MCP Preferida)
- O INE disponibiliza APIs de dados abertos (`https://www.ine.pt/xportal/xmain?xpid=INE` com endpoints JSON/CSV).
- Banco de Portugal (BPstat) tem API de indicadores.

## 2. Procedimento
1. **Tentar Camada 1/3 (API):** Consultar endpoint público do INE via `fetchUrl`/`int.ine.*` se disponível no catálogo MCP.
2. **Fallback (Camada 2):** Se a API não estiver disponível no catálogo, usar `browser.launch` para consultar o portal INE.
3. **Estruturação de Dados:** Agrupar o resultado em tabela clara com período, valor e unidade.
4. **Renderização:** Se for análise comparativa, usar `renderWidget`/`chat.createArtifact` para gráficos ou tabela dinâmica.

## 3. Guardrail
- Indicar sempre a fonte e período dos dados (o agente nunca deve inventar estatísticas sem consultar a fonte).