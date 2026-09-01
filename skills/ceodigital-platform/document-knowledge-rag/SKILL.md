---
name: document-knowledge-rag
description: "Use when answering questions grounded in the tenant's own documents (contracts, proposals, manuals, PDFs) via semantic RAG, with rigorous source citation."
version: 1.0.0
---

# SOP: Base de Conhecimento & RAG

## Quando Usar
- Quando o utilizador perguntar sobre conhecimento interno: contratos, propostas, procedimentos, atas, PDFs carregados — **tudo o que não é conhecimento web geral**.

## 1. Mapeamento de Ferramentas Reais
- **`searchDocuments`** (gated `documents.rag.query`): Pesquisa semântica sobre a biblioteca indexada do tenant.
  - `query`: pedido em linguagem natural, focado.
  - `namespaces`: opcional, restringe a pesquisa (ex: `['tenant/**']`, `['client:<id>/**']`).
  - `maxResults`: 1–20 (padrão 6).
- **`chat.readArtifact`** / acesso a ficheiros: inspeção de documentos específicos já identificados.
- **`documents.files.list`**: listagem da biblioteca.

## 2. Regra de Citação (Não-negoável)
1. **Invoca `searchDocuments` ANTES de responder** a qualquer pergunta sobre documentos internos.
2. **Fundamenta a resposta no campo `answerContext`** devolvido pela tool.
3. **Cita SEMPRE a fonte** usando o array `citations[]` (fileId + namespace) — nunca inventar fileIds ou referências.

## 3. Procedimento de Atuação
1. **Pesquisa Semântica:** Invoca `searchDocuments` com uma query focada.
2. **Síntese com Citação:** Apresenta a resposta fundamentada nos trechos devolvidos, citando as fontes.
3. **Indexação de Novos Ficheiros:** Para novos documentos, orienta o upload em `/documents` (o indexador constrói os `rag_chunks`).
4. **Estratégia de Namespace:** Usa `namespaces` para restringir a pesquisa a uma coleção/cliente quando relevante (ex: pesquisa sobre um contrato específico).