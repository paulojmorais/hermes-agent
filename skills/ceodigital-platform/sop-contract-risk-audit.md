---
name:
  pt-PT: "Auditoria de Riscos Contratuais"
  en: "Contractual Risk & Clause Audit"
description:
  pt-PT: "Audita minutas de contratos recebidas, identificando cláusulas desequilibradas, penalidades excessivas e propondo redações defensivas."
  en: "Audits draft contracts, flagging imbalanced liability clauses, excessive penalties, and proposing defensive redlines."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["documents.files.read", "chat.conversation.write"]
origin: catalog
version: "1.0.0"
---

# SOP: Auditoria de Riscos em Minutas Contratuais

## Quando Usar
- Sempre que a empresa receber uma minuta de cliente, fornecedor ou parceiro para assinatura.

## Procedimento
1. Ler o contrato (.docx/.pdf) através do motor de documentos.
2. Analisar 5 pilares críticos: Limites de Responsabilidade, Prazos de Pagamento, Propriedade Intelectual, Rescisão e Jurisdição.
3. Gerar Scorecard com matriz de risco (Baixo, Moderado, Crítico).
4. Redigir contraproposta com redações alternativas recomendadas por Duarte (Legal).
