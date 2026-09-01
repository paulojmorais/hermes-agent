---
name: sop-tender-compliance-check
description: "Use when auditing tender specifications (cadernos de encargos) and competition programs before submitting a public or private tender proposal."
version: 1.0.0
---

# SOP: Auditoria de Cadernos de Encargos e Elegibilidade a Concursos

## Quando Usar
- Antes de submeter uma proposta a concurso público ou privado.
- Quando o utilizador pedir: "audita o caderno de encargos deste concurso", "verifica se estamos elegíveis", "gera a checklist de conformidade".

## 1. Mapeamento de Ferramentas Reais
- **Ingestão do Documento:** Upload/Access do Caderno de Encargos (PDF) no módulo Documents; extrair texto via `read_file`/mulimodal.
- **Pesquisa de Contexto:** `searchDocuments` para cruzar com exigências de concursos anteriores.
- **Radar de Concursos:** `portal-base-gov-tenders` para contexto (aviso, entidade, prazos).
- **Certidões:** `portal-certidao-nao-divida` para habilitação fiscal/contributiva.

## 2. Procedimento de Auditoria
1. **Ingestão & Extração:**
   - Carrega o Caderno de Encargos e Programa de Procedimento no module Documents.
2. **Análise de Requisitos de Habilitação:**
   - Extrai todos os critérios de habilitação: certidões de não dívida, alvarás, seguros, inscrições.
   - Cruza com `portal-certidao-nao-divida` (AT/SS) e documentos de licenciamento.
3. **Scorecard de Conformidade:**
   - Gera um widget `scorecard` (via `chat.createArtifact`/`renderWidget`) com semáforo por critério:
     - 🟢 Cumprido, 🟡 Em preparação, 🔴 Em falta.
4. **Lista de Documentação em Falta & Prazos:**
   - Lista os documentos necessários e alerta para os prazos de esclarecimento e de submissão.
5. **Registo:**
   - Se relevante, cria um workitem/deal de candidatura (`crm.deals.create` ou `workitems.create`).