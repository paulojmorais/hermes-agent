---
name: memory-intelligence-curator
description: "Use when curating, structuring, auditing, or deduplicating company memories, business rules, preferences, and verified facts."
version: 1.0.0
---

# SOP: Curadoria & Gestão de Memória Empresarial

## Quando Usar
- Quando o utilizador ensinar novas regras do negócio ("na nossa empresa os prazos de pagamento são 45 dias", "o CEO aprova propostas acima de 10k€").
- Quando for necessário auditar, organizar ou consolidar factos registados na memória empresarial.
- Quando houver conflito entre factos antigos e novas diretrizes.

## 1. Mapeamento de Ferramentas Reais (`intelligence.*`)
- **Guardar Facto Estruturado:**
  - `intelligence.storeMemoryFact` (campos: `fact`, `category`: `"business_rule" | "client_preference" | "process" | "financial"`, `confidence`: `0.0-1.0`, `source_document_id`).
- **Navegação & Gestão no Workspace:**
  - `workspaces.open_pane("route:memory")` — projeta o painel de Memória & Inteligência lado a lado.

## 2. Regras de Curadoria
1. **Factos Declarativos e Claros:**
   - Registar como factos afirmativos e concisos (ex: *"Propostas comerciais superiores a 10.000€ exigem aprovação da Administração."*).
   - Nunca registar conversas ou opiniões efémeras.
2. **Categorização Rigorosa:**
   - `business_rule`: Políticas internas, margens mínimas, prazos e alçadas de decisão.
   - `client_preference`: Hábitos de faturação, contactos preferenciais de clientes.
   - `process`: Passos operacionais obrigatórios.
   - `financial`: NIBs habituais, taxas de desconto permitidas.
3. **Resolução de Conflitos & Desduplicação:**
   - Quando uma nova diretriz substituir uma antiga, atualizar o facto com nota de revisão.

## 3. Procedimento de Atuação
1. **Identificação:** Captura o facto explícito no diálogo ou documento.
2. **Persistência:** Invoca `intelligence.storeMemoryFact` com a respetiva categoria e relevância.
3. **Confirmação Transparente:** Confirma ao utilizador o registo da regra de forma concisa.