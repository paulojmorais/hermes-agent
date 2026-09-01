---
name: debtor-dunning-campaign
description: "Use when orchestrating multi-stage debtor dunning campaigns, generating escalating reminders, and tracking recovery status."
version: 1.0.0
---

# SOP: Campanha de Cobrança a Devedores (Dunning Multi-Etapa)

## Quando Usar
- Quando o utilizador disser: "inicia a campanha de cobrança aos devedores", "envia aviso aos clientes em atraso", "alavanca a recuperação de dívidas".

## 1. Etapas da Campanha (Dunning Progressivo)
1. **Etapa 1 — Lembrete Automático (vencimento + 1d):** Email amigável genérico. Foco em manter o relacionamento.
2. **Etapa 2 — Aviso Comercial (vencimento + 8d):** Referir prazos, montantes e oferta de plano de pagamento.
3. **Etapa 3 — Negociação (vencimento + 15d):** Proposta de acordo (parcial, escalonado), com responsável comercial.
4. **Etapa 4 — Carta/Registo formal (vencimento + 30d):** Comunicação formal e, se aplicável, ressalva de impacto legal.

## 2. Mapeamento de Ferramentas
- `int.moloni.invoices.list` (filtro de vencidos).
- `int.gmail.create_draft` / `int.outlook.create_draft`: Rascunhos de emails por etapa.
- `workitems.create`: Tarefas de follow-up por devedor.
- `renderWidget` / `chat.createArtifact`: Dashboard de recuperação (valor recuperado vs em atraso).

## 3. Procedimento
1. **Segmentação:** Lista devedores com montantes vencidos, dias de atraso e histórico.
2. **Disparo da Etapa Apropriada:** Determina a etaaa com base nos dias em atraso e dispara o rascunho correspondente.
3. **Acompanhamento:** Cria as tarefas de follow-up e apresenta o dashboard de métricas de recuperação.