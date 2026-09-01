---
name: sales-objection-handler-battlecard
description: "Use when addressing sales objections (price, competitors, timing, internal priorities) with structured commercial counter-arguments and value propositions."
version: 1.0.0
---

# SOP: Matriz de Objeções & Battlecards Comerciais

## Quando Usar
- Quando um cliente ou lead manifestar resistência comercial (ex: "está caro", "já usamos a ferramenta X", "não temos orçamento este trimestre", "precisamos de pensar").

## 1. Categorias de Objeções & Matriz de Resposta
1. **Preço / Orçamento ("Está muito caro"):**
   - Focar no Custo da Inação e ROI. Propor divisão em tranches de pagamento (`services.proposals.tranches.add`) ou faseamento do âmbito.
2. **Concorrência ("Já usamos o fornecedor Y"):**
   - Destacar diferenciais exclusivos do CEODigital (agentes autónomos integrados, Workspace espacial, personalização local, suporte em Portugal).
3. **Timing ("Falamos no próximo trimestre"):**
   - Oferecer início antecipado com onboarding faseado ou demonstrar o impacto do atraso nas metas anuais.
4. **Autoridade / Decisão Interna ("Tenho de falar com a administração"):**
   - Disponibilizar documento executivo de 1 página (`chat.createArtifact`) desenhado para convencer a administração.

## 2. Procedimento de Atuação
1. **Análise do Contexto da Objeção:** Inspeciona a proposta (`services.proposals.get`) e histórico do negócio.
2. **Redação de Resposta Estratégica:** Formula argumentos empáticos, não defensivos e orientados ao valor do cliente.
3. **Rascunho de Ação:** Prepara rascunho de email de follow-up (`int.gmail.create_draft`) para o comercial rever.
