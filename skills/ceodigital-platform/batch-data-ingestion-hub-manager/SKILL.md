---
name: batch-data-ingestion-hub-manager
description: "Use when managing batch document ingestion queues, configuring cloud/hybrid/local storage modes, monitoring vector chunking, and auditing RAG knowledge ingestion hubs (doc:ingest)."
version: 1.0.0
---

# SOP: Hub de Ingestão de Dados em Lote & Vectorização RAG

## Quando Usar
- Quando o utilizador carregar múltiplos ficheiros de uma só vez (pasta de contratos, biblioteca de manuais, histórico de atas).
- Quando pedir: "abre a fila de ingestão", "como funciona o armazenamento híbrido/local?", "verifica se os ficheiros já foram vectorizados", "adiciona estes ficheiros à coleção X".

## 1. Mapeamento de Ferramentas & Painéis
- **Projeção do Painel de Ingestão:**
  - `workspaces.open_pane("doc:ingest")` ou `workspaces.open_pane("widget:ingestion")`: Abre o painel dedicado de fila de upload e processamento RAG.
- **Consulta de Armazenamento:**
  - `renderWidget({ source: "documents.storageUsage", viz: "stat" })`: Mostra espaço ocupado e limites de ficheiros.
- **Listagem de Ficheiros Processados:**
  - `documents.files.list`: Confirma se o estado do documento passou a `ready` com chunks gerados.

## 2. Modos de Armazenamento (Storage Modes)
1. **Cloud Storage (Padrão):**
   - Ficheiros armazenados no storage encriptado da plataforma, com RAG indexado em base de dados vetorial cloud.
2. **Hybrid Storage:**
   - Metadados e embeddings na cloud para pesquisa semântica rápida, mas o ficheiro original protegido e sincronizado através do Connector Desktop.
3. **Local Storage (Enterprise / Segredo Máximo):**
   - Ficheiros permanecem 100% no disco local do utilizador (via CEODigital Companion Desktop), sem upload de conteúdo bruto para a cloud.

## 3. Procedimento de Condução
1. **Abertura do Hub:** Projeta `workspaces.open_pane("doc:ingest")` para dar controlo visual da fila.
2. **Definição da Coleção:** Orienta a seleção ou criação da coleção alvo (`client:<id>`, `finance`, `tenders`, `governance`).
3. **Acompanhamento da Fila:** Explica o estado dos itens (`queued` ➔ `uploading` ➔ `vectorizing` ➔ `ready`).
