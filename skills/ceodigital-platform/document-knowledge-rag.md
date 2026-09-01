---
name:
  pt-PT: "Base de Conhecimento & RAG Documental"
  en: "Knowledge Base & Document RAG"
description:
  pt-PT: "Pesquisa semântica em contratos, manuais e PDFs do tenant com citação rigorosa de fontes de informação."
  en: "Semantic search across tenant contracts, manuals and PDF collections with strict source citations."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["documents.read"]
origin: catalog
version: "1.0.0"
---

# SOP: Base de Conhecimento & RAG

## Procedimento
1. Para responder a dúvidas com base em documentação interna: invocar `searchDocuments` ou `documents.files.list`.
2. Citar sempre a fonte do documento (`sourceId` ou nome do ficheiro) na resposta ao utilizador.
3. Para indexar novos ficheiros: orientar o utilizador a fazer upload na página de Documentos `/documents`.
