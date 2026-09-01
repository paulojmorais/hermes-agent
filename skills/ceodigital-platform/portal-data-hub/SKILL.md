---
name: portal-data-hub
description: "Use when performing consolidated due diligence or compliance checks on a company by aggregating multiple official Portuguese data sources (AT, SS, Registo Comercial, Citius, INE) into a single risk report."
version: 1.0.0
---

# SOP: Portal Data Hub — Due Diligence & Compliance Consolidado

## Quando Usar
- Quando o utilizador pedir: "faz a due diligence completa desta empresa", "dá-me o perfil de risco completo do cliente X", "consolida os dados oficiais desta organização".

## 1. Fontes Agregadas (Camadas 2 e 3)
| Fonte | Skill de Acesso | Dado Extraído |
| :--- | :--- | :--- |
| Portal das Finanças (AT) | `portal-portal-financas-at-access` | Situação fiscal, certidão de não dívida |
| Segurança Social | `portal-seguranca-social-access` | Situação contributiva |
| Registo Comercial | `portal-registo-comercial` | Sócios, gerentes, capital, situação legal |
| Citius (Justiça) | `portal-justica-citius` | Processos, insolvências, penhoras |
| Informa D&B | `informadb-company-enrichment` | CAE, faturação, solvência (Score SII) |
| INE | `portal-ine-statistics` | Estatísticas setoriais |

## 2. Procedimento de Consolidação
1. **Identificação:** Obtém o NIF e nome da empresa.
2. **Recolha Paralela:** Dispara as skills de acesso às fontes relevantes (AT, SS, Registo, Citius, Informa D&B).
3. **Síntese de Risco:**
   - **Risco Fiscal:** Certidão de não dívida AT/SS.
   - **Risco Legal:** Insolvências/processos no Citius.
   - **Risco Financeiro:** Score SII da Informa D&B.
   - **Risco Operacional:** Dimensão, setor, estatísticas INE.
4. **Renderização do Relatório:**
   - Gera um artefacto vivo (`chat.createArtifact(kind='html')`) com dashboard de compliance: semáforos de risco por dimensão, resumo executivo e recomendações.
   - Abre no Workspace via `workspaces.open_pane("artifact:<id>")`.

## 3. Guardrail
- NUNCA inventar dados; cada secção do relatório cita a fonte oficial consultada.
- Requerer HITL para ações de submissão (ex: pedir certidão paga).