---
name: sop-contract-risk-audit
description: "Use when auditing received contract drafts (client, supplier, partner) for unbalanced clauses, excessive penalties, and proposing defensive redactions."
version: 1.0.0
---

# SOP: Auditoria de Riscos em Minutas Contratuais

## Quando Usar
- Sempre que a empresa receber uma minuta de cliente, fornecedor ou parceiro para assinatura.
- Quando o utilizador pedir: "audita este contrato", "verifica as cláusulas de risco desta minuta", "propõe alterações defensivas".

## 1. Mapeamento de Ferramentas Reais
- **Extração do Documento:** Upload/`read_file` do contrato (`.docx`/`.pdf`) — extrai o texto para análise.
- **Pesquisa de Contexto:** `searchDocuments` para cruzar com contratos anteriores/precedentes da empresa.
- **Análise:** O agente processa o texto (multimodal/documento) e aplica a matriz de risco.

## 2. Os 5 Pilares Críticos de Auditoria
1. **Limites de Responsabilidade:** Caps de indemnização, exclusões (lucros cessantes, danos indiretos).
2. **Prazos de Pagamento:** Prazos excessivos, juros de mora desfavoráveis, retenções injustificadas.
3. **Propriedade Intelectual:** Cessão de direitos demasiado ampla, licenças perpétuas.
4. **Rescisão:** Prazos de aviso assimétricos, cláusulas de rescisão facilitada.
5. **Jurisdição & Lei Aplicável:** Foro desfavorável, tribunal arbitral estrangeiro.

## 3. Procedimento de Atuação
1. **Extração:** Lê o texto integral da minuta.
2. **Análise dos 5 Pilares:** Avalia cada um, apontando cláusula, risco e impacto.
3. **Scorecard de Risco:**
   - Classifica cada pilar como **Baixo**, **Moderado** ou **Crítico**.
   - Gera matriz visual (`chat.createArtifact`/`renderWidget`) quando apropriado.
4. **Redação Defensiva:**
   - Propõe redações alternativas específicas para as cláusulas criticas.
   - Invoca `chat.createArtifact` para o documento de contraproposta anotada.