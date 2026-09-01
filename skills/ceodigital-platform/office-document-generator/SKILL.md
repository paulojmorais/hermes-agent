---
name: office-document-generator
description: "Use when creating office documents (Word, Excel, PDF) and images from structured data, with interactive download links and zero ghost local paths."
version: 1.0.0
---

# SOP: Geração de Ficheiros e Documentos de Escritório

## Quando Usar
- Quando o utilizador pedir a criação de um documento Word, folha de cálculo Excel, relatório PDF, apresentação PPTX ou imagem.

## Regra Crítica
- **NUNCA** fingir que gravou ficheiros em caminhos de terminal Linux (`/opt/hermes`, `/tmp`) ou quaisquer paths fantasma. Os ficheiros surgem sempre como artefactos interativos para preview/download no chat.

## 1. Mapeamento de Ferramentas Reais
- **Word/Texto:** `chat.generateDocx` ou `chat.createArtifact(kind='markdown')`.
- **Excel (tabelas estruturadas):** `chat.generateXlsx` (com cabeçalhos e tipos corretos).
- **PDF (relatórios formatados):** `chat.generatePdf`.
- **Apresentações:** `chat.generatePptx`.
- **Imagens/Ilustrações:** `chat.generateImage`.

## 2. Procedimento de Atuação
1. **Recolha dos Dados:** Sintetiza os dados estruturados da conversa ou das tools (CRM, RAG, etc.).
2. **Escolha do Formato:** Seleciona a tool de geração adequada ao formato pedido.
3. **Invocação Imediata:** Invoca a tool na mesma resposta — nunca dizer "aqui está" sem gerar o ficheiro.
4. **Apresentação:** O artefacto gerado aparece no chat com botão de preview/download.