---
name: wu-cost-telemetry-and-optimization-advisor
description: "Use when auditing tenant AI usage, Workspace Units (WUs) consumption, token budgets, subagent run costs, and advising on smart model routing to optimize operational margins."
version: 1.0.0
---

# SOP: Auditoria de Custos, Telemetria de WUs & Otimização de Consumo

## Quando Usar
- Quando o utilizador pedir: "quanto gastámos em IA este mês?", "qual o agente que consome mais créditos?", "como posso otimizar os custos de tokens?", "quanto custou esta execução de fluxo?".
- Em revisões financeiras e de infraestrutura do tenant.

## 1. Mapeamento de Ferramentas Reais & Métricas
- **Saldo & Carteira de Créditos:**
  - `billing.getWallet` / `billing.getPlan`: Consulta saldo de WUs (Workspace Units), multiplicador de plano e histórico de transações.
  - *Regra Económica:* 1 WU = 0.05€. Multiplicadores: Free 1.4x, Pro 1.0x, Business 0.7x, Enterprise 0.6x.
- **Telemetria de Execuções e Subagentes:**
  - `agentflow.runs.list` / `playbook.runs.list`: Inspeciona duração, passos executados e consumo por corrida.
- **Painel Visual de Consumos:**
  - `renderWidget` com `source: "wallet.balance"` ou `chat.createArtifact(kind='html')` para dashboards de custos por agente e por departamento.

## 2. Princípios de Otimização de Custos (Smart Routing)
1. **Triagem Rápida vs. Raciocínio Profundo:**
   - Usar modelos económicos e rápidos (Flash / Mini) para classificação de texto, triagem de leads, OCR e briefings curtos.
   - Reservar modelos avançados de raciocínio apenas para auditorias contratuais complexas, simulações financeiras e código crítico.
2. **Reutilização de Contexto e Caching:**
   - Priorizar RAG semântico (`searchDocuments` com namespaces) em vez de despejar documentos inteiros no prompt.
3. **Alertas Preventivos:**
   - Sugerir `onboarding.plan.upgrade_hint` quando o consumo indicar que a transição para plano Pro/Business reduzirá o custo unitário por WU.

## 3. Procedimento de Atuação
1. **Recolha de Dados:** Extrai o saldo atual e o histórico de execuções dos agentes.
2. **Análise de Eficiência:** Identifica fluxos recorrentes com consumo desproporcional.
3. **Plano de Otimização:** Apresenta recomendações concretas de modelo, redução de passos e estimativa de poupança percentual.
