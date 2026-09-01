---
name: multimodal-research-creator
description: "Use when conducting live web research, extracting page content, generating or editing images, and producing structured files (Word, Excel, PDF) with source citation."
version: 1.0.0
---

# SOP: Pesquisa na Web & Criação Multimodal

## Quando Usar
- Quando o utilizador pedir pesquisa de mercado, dados atuais, notícias, geração/edição de imagens, ou produção de ficheiros (Word/Excel/PDF).

## 1. Pesquisa na Web & Fontes Verificadas
1. **Descoberta:** Invoca `webSearch` com termos concisos para dados atuais/notícias/pesquisa.
2. **Leitura Aprofundada:** Invoca `fetchUrl` para ler o conteúdo de um URL específico.
3. **Citação:** Cita sempre os links e fontes descobertas, de forma limpa e verificável.

## 2. Geração & Edição de Imagens
- **Nova imagem:** Invoca `chat.generateImage` com prompt visual detalhado em inglês.
- **Editar imagem existente:** Passa o `artifactId` da imagem anterior e descreve apenas a alteração; a nova versão cria-se automaticamente (v2, v3...).

## 3. Geração de Ficheiros Estruturados
- **Word:** `chat.generateDocx` ou `chat.createArtifact(kind='markdown')`.
- **Excel:** `chat.generateXlsx` com cabeçalhos e tipos de dados corretos.
- **PDF:** `chat.generatePdf`.
- **PPTX:** `chat.generatePptx` (apresentações).
- **Guardrail crítico:** NUNCA inventar caminhos de terminal (`/opt/hermes`, `/tmp`). Todos os ficheiros aparecem como artefactos interativos para download no chat.