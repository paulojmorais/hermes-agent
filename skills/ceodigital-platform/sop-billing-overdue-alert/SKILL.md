---
name: sop-billing-overdue-alert
description: "Use when monitoring overdue invoices, calculating aging brackets (30/60/90+ days), triggering automated payment reminder alerts, and coordinating escalations for late collections."
version: 2.0.0
---

# SOP: Alertas de Faturas em Atraso & Gestão de Aging de Cobranças

## Quando Usar
- Em revisões financeiras matinais, encerramentos mensais de tesouraria ou quando o utilizador pedir: "mostra as faturas em atraso", "quem são os clientes com pagamentos vencidos há mais de 30 dias?", "prepara um aviso de cobrança para o cliente X", "qual o valor total em dívida?".

## 1. Mapeamento de Ferramentas Reais (`int.moloni.*` / `invoices.*`)
- **Consulta de Faturação & Saldos:**
  - `int.moloni.invoices.list` / `int.invoicexpress.invoices.list`: Lista de faturas com estado pendente/emitida e data de vencimento no ERP.
  - `services.proposals.list`: Propostas aceites com tranches de pagamento vencidas.
- **Visualização de Risco de Tesouraria:**
  - `renderWidget({ source: "dynamic.dataset", viz: "table", ... })`: Mapa de antiguidade de saldos (Aging) categorizado por escalões (0-30d, 31-60d, 61-90d, >90d).
- **Ações de Notificação & Cobrança:**
  - `debtor-dunning-campaign`: Orquestração da régua escalonada de lembretes por email.
  - `workitems.create`: Instancia tarefas de contacto telefónico para o gestor de conta.
  - `timeline.events`: Regista o alerta de incumprimento na ficha do cliente no CRM.

## 2. Escalões de Antiguidade & Níveis de Intervenção
1. **Lembrete Preventivo (3 a 5 dias antes do vencimento):**
   - Email amigável a recordar a data de vencimento com envio de 2ª via da fatura.
2. **Nível 1 (1 a 15 dias de atraso):**
   - Notificação cordial por email a solicitar comprovativo de transferência ou esclarecimento de eventuais divergências.
3. **Nível 2 (16 a 30 dias de atraso):**
   - Contacto direto pelo gestor comercial e suspensão de novos desenvolvimentos/entregáveis no módulo de projetos.
4. **Nível 3 (>30 dias de atraso — Risco Crítico):**
   - Aviso formal de cobrança com cálculo de juros de mora legais (taxa comercial em vigor) e encaminhamento para o departamento jurídico (`Duarte / Legal`).

## 3. Procedimento de Atuação
1. **Auditoria de Faturas:** Extrai as faturas vencidas no ERP certificado e agrupa por cliente e antiguidade.
2. **Scorecard Visual:** Projeta a tabela de aging no chat via `renderWidget` com totais acumulados.
3. **Disparo de Ações:** Gera os rascunhos de email de cobrança e cria os respetivos workitems para a equipa financeira.
