---
name: mcp-catalog-discovery
description: "Use when discovering, exposing, or integrating MCP servers and external data endpoints into the agent tool registry, and when aggregating portal data into stable contracts."
version: 1.0.0
---

# SOP: Discovery e Integração de MCP Servers & Endpoints

## Quando Usar
- Quando o utilizador pedir: "adiciona uma nova integração", "como acedo aos dados de X?", "configura um MCP server", "agrega dados do portal Y".

## 1. Arquitetura de Integração (Camada 3 — MCP)
- O CEODigital espõe MCP tools via `buildMcpToolRegistry.server.ts`.
- Cada provider/adapter expõe tools como `int.<dominio>.*`.
- O agente usa `fetchUrl`, `int.*`, ou tools MCP conforme o contrato.

## 2. Procedimento de Descoberta
1. **Consultar o catálogo existente:** `integrations.list` para ver o que já está ligado.
2. **Avaliar a fonte:**
   - **API oficial** → Camada 1: `int.<app>.<action>`.
   - **Portal sem API** → Camada 2: `browser.launch`.
   - **Necessita contrato estável** → Camada 3: MCP custom.
3. **Propor novo MCP:** Se a fonte exige um agregador estável, sugere a criação de um MCP server dedicado (`setup_mcp`).

## 3. Guardrails
- NUNCA criar MCP servers que dupliquem integrações Exist nativas (Gmail, Stripe, etc.).
- A agregação de portais (AT, INE, Base.gov) em MCP é bem-vinda quando o scraping pontual é frágil.