---
name: llm-studio-dataset-and-tuning-architect
description: "Use when curating training datasets, formatting JSONL prompt-completion pairs, launching fine-tuning runs (SFT/LoRA), evaluating custom models, and deploying tenant-tuned LLMs in LLM Studio."
version: 1.0.0
---

# SOP: LLM Studio & Treino de Modelos Privados do Tenant

## Quando Usar
- Quando o utilizador pedir: "quero treinar um modelo com o tom de voz da nossa empresa", "gera um dataset de treino a partir das conversas de suporte", "avalia o modelo ajustado", "publica este modelo no estúdio".
- Ao configurar modelos locais ou afinados para reduzir custos de tokens e aumentar precisão no domínio.

## 1. Mapeamento de Ferramentas & Rotas
- **Navegação no Workspace:**
  - `workspaces.open_pane("route:llm_studio")`: Abre o painel do LLM Studio lado a lado.
- **Preparação e Validação de Dados:**
  - `execute_code`: Script Python para extrair pares `{"prompt": "...", "completion": "..."}` ou formato `messages` (ChatML), validar schemas e detetar PII/dados sensíveis antes do treino.
- **Catálogo de Modelos do Tenant:**
  - `ceo-agent-trainer` / `agent.agents.update`: Atualiza os agentes executivos para utilizarem o modelo afinado (`model_code: "tenant/<custom-model-id>"`).

## 2. Ciclo de Vida do Fine-Tuning (4 Etapas)
1. **Recolha & Curadoria de Dados:**
   - Extrai exemplos de excelência (propostas ganhas, e-mails comerciais bem-sucedidos, resoluções de suporte).
   - Higieniza segredos, senhas e NIFs reais (substitui por dados anonimizados).
2. **Formatação & Validação JSONL:**
   - Executa validação de sintaxe e distribuição de tokens via script Python em sandbox.
   - Divide em conjuntos de Treino (85%) e Validação (15%).
3. **Lançamento do Treino no LLM Studio:**
   - Seleciona o modelo base adequado (ex: Llama-3, Mistral, Qwen).
   - Configura hiperparâmetros recomendados: Learning Rate, Epochs (3 a 5), LoRA Rank/Alpha.
4. **Avaliação & Publicação:**
   - Realiza testes cegos contra benchmarks internos.
   - Se os resultados superarem a linha de base, ativa o modelo no catálogo de agentes do tenant.
