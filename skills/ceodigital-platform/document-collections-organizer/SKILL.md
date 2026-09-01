---
name: document-collections-organizer
description: "Use when creating, structuring, or managing thematic document collections (client dossiers, procurement packs, internal SOPs) and assigning isolated namespaces for precise semantic RAG search."
version: 1.0.0
---

# SOP: Gestão de Coleções Documentais & Namespaces RAG

## Quando Usar
- Quando for necessário organizar ficheiros em pastas temáticas ou dossiers por cliente/projeto.
- Quando o utilizador pedir: "cria uma coleção para o cliente X", "move estes contratos para o dossier de auditoria", ou "pesquisa apenas nos documentos de compliance".

## 1. Mapeamento de Ferramentas & Namespaces
- **Pesquisa Semântica com Restrição de Namespace:**
  - `searchDocuments({ query: "...", namespaces: ["client:abc-123/**", "procurement/tenders/**"] })`.
- **Listagem e Inspeção de Ficheiros:**
  - `documents.files.list` (filtros por coleção, tipo de documento ou data).
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:documents")` — visualização do gestor documental com abas de coleções.

## 2. Estrutura Padrão de Coleções no Tenant
1. **Dossiers de Clientes (`client:<id>/**`):** Propostas assinadas, contratos ativos, aditamentos e atas de reunião.
2. **Concursos & Licitações (`tenders/<ano>/**`):** Cadernos de encargos, programas de procedimento, certidões e propostas técnicas.
3. **Financeiro & Fiscal (`finance/<ano>/**`):** Faturas, comprovativos de pagamento, certidões de não dívida e declarações fiscais.
4. **Governança & Políticas (`governance/**`):** Regulamentos internos, compliance RGPD, manuais de acolhimento e SOPs.

## 3. Procedimento de Atuação
1. **Identificação da Finalidade:** Determina a coleção correta com base na entidade de negócio associada.
2. **Organização & Indexação:** Garante que o namespace correto é atribuído aquando do carregamento.
3. **Pesquisa Focalizada:** Sempre que responder a perguntas sobre um cliente ou concurso específico, passa o respetivo `namespace` na chamada a `searchDocuments` para eliminar ruído de outros documentos.