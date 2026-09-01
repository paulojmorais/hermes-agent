---
name: create-sop-skill
description: "Use when teaching the agent new procedures, authoring custom business rules, or registering new operational SOP skills for the tenant."
version: 1.0.0
---

# SOP: Criação de Novas Skills & Regras Operacionais

## Quando Usar
- Quando o utilizador disser: "ensina o agente a fazer X", "cria uma regra para a equipa", "adiciona um procedimento operacional", "regista esta norma de negócio".

## 1. Mapeamento de Parâmetros (`skills.create_rule`)
- `name`: Nome descritivo da regra/skill (ex: "Aprovação de Descontos VIP", "Checklist de Onboarding").
- `slug`: Identificador único kebab-case (ex: `regra-desconto-vip`, `sop-onboarding-loja`).
- `ruleDescription`: O procedimento em Markdown contendo # Quando Usar, # Procedimento e # Regras.
- `requiredCapabilities`: Array opcional de permissões necessárias.

## 2. Procedimento de Autoria
1. **Entrevista Rápida (1 a 2 Perguntas):**
   - Pergunta o gatilho (quando se aplica) e os passos que a equipa ou o agente devem seguir.
2. **Estruturação do Procedimento:**
   - Redige o guião em Markdown claro, numerado e acionável.
3. **Registo na Base de Dados do Tenant:**
   - Invoca a tool `skills.create_rule` para persistir a skill na tabela `public.skills`.
4. **Verificação & Ativação:**
   - Informa o utilizador de que a regra está ativa e pronta a ser executada no próximo turno do chat.
