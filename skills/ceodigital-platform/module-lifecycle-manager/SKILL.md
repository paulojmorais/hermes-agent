---
name: module-lifecycle-manager
description: "Use when evaluating tenant module needs, activating or deactivating platform modules (CRM, Docs, Services, Invoicing, SocialFlow), managing module dependencies, and suggesting custom integrations."
version: 2.0.0
---

# SOP: Gestão do Ciclo de Vida de Módulos da Plataforma

## Quando Usar
- Quando o utilizador pedir: "ativa o módulo de Faturação", "desativa as redes sociais", "que módulos estão ligados neste momento?", "preciso de emitir propostas, que módulos tenho de ligar?", "avalia se vale a pena usar o CRM nativo ou integrar com o HubSpot".

## 1. Mapeamento de Ferramentas Reais (`onboarding.*` & `intelligence.*`)
- **Ativação de Módulos em Tempo Real:**
  - `onboarding.modules.activate({ modules: ["crm", "services", "invoicing", "documents", "social", "agentflow", "workitems"] })`: Ativa módulos instantaneamente no tenant sem recarregar a sessão.
- **Recomendação Estratégica Baseada em Objetivos:**
  - `intelligence.module.propose`: Analisa os objetivos do negócio e sugere o pacote ideal de módulos.
  - `intelligence.module.configure`: Aplica parâmetros recomendados com confirmação HITL.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:modules")` ou `/admin/modules`: Gestor visual de módulos e subscrição.

## 2. Árvore de Dependências entre Módulos
Ao ativar um módulo, garantir que os módulos base de suporte estão ativos:
1. **`services` (Propostas):** Requer `crm` (para clientes/deals).
2. **`invoicing` (Faturação):** Requer `crm` (para NIF e dados fiscais do cliente).
3. **`workitems` (Tarefas/Projetos):** Funciona autónomo ou ligado a `crm` e `services`.
4. **`social` (SocialFlow):** Funciona autónomo com suporte a `documents` para criativos visuais.

## 3. Filosofia Descoberta-Primeiro (Nativo vs. Integração)
- Se a empresa já tiver um software externo consolidado (ex: Salesforce para CRM ou Moloni para faturação), **priorizar a integração** (`discover-integrations`) em vez de forçar a migração para o módulo nativo.
- Propor módulos nativos apenas para áreas sem solução existente ou quando o cliente pretender consolidar tudo no Workspace.

## 4. Procedimento de Atuação
1. **Auditoria da Stack:** Inspeciona `<TENANT_SURFACE>` para conhecer os módulos ativos no momento.
2. **Avaliação de Dependências:** Valida se a ativação pretendida requer módulos adicionais.
3. **Execução:** Invoca `onboarding.modules.activate` e confirma a ativação com a disponibilização das novas abas no Workspace.
