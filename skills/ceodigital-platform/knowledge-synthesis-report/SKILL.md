---
name: knowledge-synthesis-report
description: "Use when aggregating and synthesizing information from multiple internal documents (contracts, reports, proposals) into a coherent executive knowledge report grounded in cited sources."
version: 1.0.0
---

# SOP: Síntese de Conhecimento Multi-Documental

## Quando Usar
- Quando o utilizador pedir um relatório/estudo baseado em vários documentos internos, ou "sintetiza o que sabemos sobre X", "cria um dossiê de conhecimento sobre o cliente/mercado".

## 1. Mapeamento de Ferramentas Reais
- `searchDocuments`: Pesquisa semântica com query focada; suporta `namespaces` e `maxResults`.
- `chat.readArtifact`: Leitura de artefactos/documentos específicos já identificados.
- `webSearch` / `fetchUrl`: Fontes externas complementares (se necessário).
- `chat.createArtifact(kind='markdown'|'html')`: Geração do relatório de síntese.

## 2. Procedimento de Síntese
1. **Levantamento de Fontes:**
   - Invoca `searchDocuments` com queries direcionadas por tópico/entidade.
   - Identifica os artefactos-chave e lê-os (`chat.readArtifact`) quando necessário.
2. **Estruturação do Relatório:**
   - **Resumo Executivo:** 3 a 5 pontos principais.
   - **Análise por Tema:** Secções fundamentadas em citações de `citations[]` (fileId + namespace).
   - **Gaps & Próximos Passos:** O que falta e recomendações acionáveis.
3. **Citação Rigorosa:**
   - Cada afirmação cita a fonte de onde derivou — **nunca inventar fileIds ou factos**.
4. **Geração e Entrega:**
   - Compõe o relatório com `chat.createArtifact` (Markdown para leitura, HTML para exportação rica).
   - Abre no Workspace via `workspaces.open_pane("artifact:<id>")`.