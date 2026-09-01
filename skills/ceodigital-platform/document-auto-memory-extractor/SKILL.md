---
name: document-auto-memory-extractor
description: "Use when scanning uploaded contracts, board minutes, technical specs, or vendor agreements to automatically extract business rules, obligations, and key entities into company memory and extraction radars."
version: 1.0.0
---

# SOP: Extração Automática de Factos & Memórias de Documentos

## Quando Usar
- Após o upload de um novo contrato, regulamento interno, ata de assembleia geral, caderno de encargos ou proposta aprovada.
- Quando o utilizador pedir: "lê este PDF e guarda as regras mais importantes na memória" ou "extrai os compromissos deste contrato".

## 1. Mapeamento de Ferramentas Reais (`intelligence.*` / `documents.*`)
- **Análise Automática de Documento:**
  - `intelligence.analyzeDocumentForMemories` (parâmetro: `document_id` ou `file_id`) — varre o conteúdo e identifica entidades, prazos, cláusulas-chave e regras de negócio.
- **Radar de Extração Visual:**
  - `intelligence.openExtractionRadar` (parâmetros: `document_id`, `focus_areas`: `["sla", "penalties", "pricing", "parties"]`).
- **Persistência de Factos Identificados:**
  - `intelligence.storeMemoryFact` (associa cada facto extraído ao `source_document_id`).

## 2. Categorias de Informação a Extrair
1. **Entidades & Partes Envolvidas:** Nomes, NIFs, papéis legais e responsabilidades.
2. **Obrigações Temporais:** Prazos de entrega, datas de renovação e períodos de denúncia.
3. **Condições Financeiras:** Preços, taxas horárias, condições de pagamento e retenções.
4. **SLA e Penalidades:** Níveis de serviço acordados e penalizações por incumprimento.
5. **Alçadas e Aprovações:** Quem tem poderes para assinar aditamentos ou aceitar entregáveis.

## 3. Procedimento de Atuação
1. **Disparo da Extração:** Invoca `intelligence.analyzeDocumentForMemories` passando o ID do documento.
2. **Apresentação em Radar/Tabela:** Organiza os factos descobertos num resumo visual com semáforo de relevância (`chat.createArtifact` ou via `intelligence.openExtractionRadar`).
3. **Persistência Estruturada:** Para cada regra ou compromisso crítico validado, invoca `intelligence.storeMemoryFact` com a referência do documento de origem.
4. **Geração de Tarefas:** Se existirem prazos obrigatórios imediatos, gera os respetivos workitems via `workitems.create`.