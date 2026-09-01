---
name: portal-justica-citius
description: "Use when accessing the Portuguese justice portal (Citius) to check legal proceedings, insolvencies, and seizures involving a company or individual."
version: 1.0.0
---

# SOP: Acesso a Processos Judiciais & Insolvências (Citius)

## Quando Usar
- Quando o utilizador pedir: "verifica se esta empresa tem processos judiciais", "há insolvências associadas?", "consulta penhoras no Citius".

## 1. Camada de Acesso (Camada 2 — Playwright)
- O Citius (Ministério da Justiça) não tem API pública. Usar automação de navegador via Connector Companion.

## 2. Procedimento
1. **Pré-condição:** Connector Companion conectado.
2. **Abertura:** `browser.launch({ initialUrl: "https://www.citius.mj.pt/" })`.
3. **Consulta por NIF/Nome:** Preencher o NIF ou nome da entidade com `browser.click_and_fill`.
4. **Extração de Dados:**
   - Processos judiciais ativos.
   - Insolvências declaradas.
   - Penhoras e execuções.
5. **Análise de Risco:** Classifica o risco legal (baixo/médio/alto) e apresenta resumo.

## 3. Guardrail
- NUNCA expor credenciais; HITL para consultas sensíveis.