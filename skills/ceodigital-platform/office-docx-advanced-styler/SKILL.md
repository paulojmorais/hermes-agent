---
name: office-docx-advanced-styler
description: "Use when authoring professional Microsoft Word (.docx) documents, legal contract templates, formal proposals, and executive audit reports with structured styling and instant downloads."
version: 1.0.0
---

# SOP: Criação e Edição Avançada de Documentos Word (.docx)

## Quando Usar
- Quando o utilizador pedir: "gera uma minuta de contrato em Word", "exporta este relatório em .docx", "cria um documento Word formatado com índice e tabelas", "prepara a proposta em ficheiro .docx para download".

## 1. Mapeamento de Ferramentas Reais
- **Geração Direta do Documento:**
  - `chat.generateDocx({ title: "...", content: "...", sections: [...] })`: Produz o ficheiro `.docx` e gera o cartão interativo de pré-visualização e download no chat.
- **Alternativa Rápida em Artefacto:**
  - `chat.createArtifact({ kind: "markdown", title: "...", content: "..." })` quando o utilizador pretender primeiro rever e aprovar a estrutura de texto.

## 2. Padrões de Estruturação do Documento
1. **Hierarquia Tipográfica:**
   - **Título do Documento (Title):** 22-26pt, negrito.
   - **Títulos de Secção (Heading 1):** 16-18pt, com numeração formal (ex: *1. Objeto do Contrato*).
   - **Subtítulos (Heading 2 / 3):** 13-14pt para alíneas e condições específicas.
   - **Corpo do Texto (Body):** 10.5-11.5pt, entrelinha 1.15, parágrafos justificados.
2. **Tabelas e Quadros de Valores:**
   - Cabeçalhos a negrito com fundo cinza claro ou azul corporativo.
   - Colunas numéricas (quantidades, preços, IVA, totais em EUR) alinhadas à direita.
3. **Metadados Obrigatórios:**
   - Data de emissão, versão da minuta, identificação fiscal completa das partes (NIF, morada, representantes legais).
   - Espaços formais para assinaturas digitais ou manuais no fecho do documento.

## 3. Procedimento de Atuação
1. **Recolha & Estruturação:** Sintetiza os dados de negócio (entidades, cláusulas, valores negociados).
2. **Invocação Imediata:** Invoca `chat.generateDocx` na mesma resposta — **NUNCA** responder apenas com promessas ou referir caminhos de terminal Linux.
3. **Entrega:** O ficheiro fica disponível com botão de download seguro no ecrã.
