---
name: sop-automation-incident-triage
description: "Use when diagnosing failed webhook payloads, n8n/Flowise automation errors, NativeFlow run timeouts, invalid JSON schemas, and preparing sanitized retries."
version: 2.0.0
---

# SOP: Triagem de Incidentes de Automação & Diagnóstico de Webhooks

## Quando Usar
- Quando o utilizador reportar ou o sistema alertar: "a automação X falhou", "o webhook do n8n não está a entregar dados", "erro no fluxo de integração", "como faço o reenvio deste payload com erro?".

## 1. Mapeamento de Ferramentas Reais (`agentflow.*` & `automation.*`)
- **Consulta de Execuções e Erros:**
  - `agentflow.runs.list`: Consulta execuções recentes com filtro por estado (`failed`, `timeout`, `running`).
  - `agentflow.webhooks.list`: Inspeciona endpoints de webhooks ativos e rotas de receção.
  - `agentflow.webhooks.rotate`: Regenera chaves/tokens de segurança de webhook em caso de quebra ou comprometimento.
- **Ispeção & Teste em Sandbox:**
  - `execute_code`: Script Python para analisar payloads JSON mal formatados, validar schemas e limpar dados corrompidos antes do reenvio.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:agentflow")` ou abertura do inspector de execução.

## 2. As 4 Causas-Raiz Mais Frequentes em Automações
1. **Schema Mismatch (Campos Nulos / Incompatíveis):**
   - O webhook externo enviou campos renomeados ou ausentes (ex: `email` em vez de `user_email`).
2. **Tokens Expirados ou Inválidos (Auth Failure):**
   - Chave API revogada ou OAuth a necessitar de renovação na app conectada.
3. **Rate Limits & Concorrência (429 Too Many Requests):**
   - Disparo massivo sem filas de controlo ou backoff exponencial.
4. **Timeouts de Processamento:**
   - Chamadas síncronas a endpoints lentos que excedem o tempo limite do gateway.

## 3. Procedimento de Atuação
1. **Recolha de Evidências:** Inspeciona os logs de erro via `agentflow.runs.list` e isola a mensagem de erro exata e o payload recebido.
2. **Diagnóstico & Sanitização:** Valida o JSON em sandbox (`execute_code`) e identifica o campo que causou a quebra.
3. **Correção do Fluxo:** Sugere o ajuste no nó do NativeFlow (adicionar nó `try_catch` ou valor por defeito).
4. **Reenvio Controlado:** Orienta o reenvio do payload corrigido e confirma o sucesso da execução.
