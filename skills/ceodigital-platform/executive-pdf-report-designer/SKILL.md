---
name: executive-pdf-report-designer
description: "Use when creating beautifully formatted, publication-grade executive PDF reports, board briefing dossiers, compliance audit summaries, and commercial proposals with corporate layouts."
version: 1.0.0
---

# SOP: Design & Geração de Relatórios Executivos em PDF

## Quando Usar
- Quando o utilizador pedir: "gera um relatório executivo em PDF", "exporta este estudo em PDF formatado", "cria o dossier de apresentação para o conselho de administração em PDF".

## 1. Mapeamento de Ferramentas Reais
- **Geração de PDF:**
  - `chat.generatePdf({ title: "...", htmlContent: "...", orientation: "portrait" | "landscape" })`: Compila o documento com renderização visual de alta fidelidade e botão de download imediato.
- **Visualização de Artefacto Prévio:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })` quando for conveniente pré-visualizar o layout no Workspace antes da exportação final para PDF.

## 2. Princípios de Design Editorial para PDF
1. **Capa Executiva Institucional:**
   - Logótipo da empresa, título em destaque, subtítulo contextual, data de fecho e autor (ex: *CEO Digital Agent · Diogo / Diretor Comercial*).
2. **Grelha de Indicadores-Chave (KPIs Grid):**
   - Cartões com números grandes e etiquetas limpas (ex: "Receita Recorrente: 120.000€", "Margem Média: 38%").
3. **Paginação Limpa & Quebras de Página:**
   - Usar classes CSS como `page-break-after: always;` e `page-break-inside: avoid;` para evitar que tabelas ou assinaturas fiquem cortadas ao meio.
4. **Paleta de Cores Institucional:**
   - Fundo branco limpo para impressão/leitura clara, texto em ardósia escura (`#0f172a`), com acentos subtis em azul corporativo (`#2563eb`) ou esmeralda (`#059669`).

## 3. Procedimento de Atuação
1. **Composição dos Conteúdos:** Estrutura o documento em blocos: Sumário Executivo ➔ Análise Detalhada ➔ Tabelas Financeiras ➔ Conclusões & Próximos Passos.
2. **Geração Imediata:** Invoca `chat.generatePdf` na mesma resposta.
3. **Disponibilização:** O relatório surge no chat com cartão de pré-visualização e download em PDF.
