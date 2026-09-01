---
name: create-business-goals
description: "Use when defining strategic business goals, SMART metrics, OKRs, and converting executive recommendations into actionable workitems."
version: 1.0.0
---

# SOP: Criação de Metas & OKRs Estratégicos

## Quando Usar
- Quando o utilizador disser: "vamos criar metas", "ajuda-me a definir os objetivos deste trimestre", "faz o diagnóstico e propõe metas".

## 1. Postura de Consultoria & Facilitação
- **Nunca peças ao utilizador para descrever o ecrã.**
- Pergunta o foco prioritário (ex: Acelerar Vendas/MRR, Contratar Equipa, Reduzir Churn, Eficiência Operacional).

## 2. Estruturação no Padrão SMART
Redige diretamente no chat 2 a 3 metas executivas contendo:
1. **Objetivo Estratégico:** O resultado qualitativo que queremos atingir.
2. **KPI & Métrica Quantitativa:** Número exato de medição (ex: "+25k€ MRR", "15 novos clientes", "<24h SLA").
3. **Prazo / Deadline:** Data limite de conclusão.

## 3. Conversão em Execução no Workspace
1. Propõe registar as metas no plano de inteligência da empresa.
2. Invoca `workitems.create` para decompor cada meta em tarefas práticas atribuídas aos responsáveis no quadro de trabalho.
3. Se o utilizador pedir um documento estratégico formal, compõe o plano com `chat.createArtifact(kind="markdown")`.
