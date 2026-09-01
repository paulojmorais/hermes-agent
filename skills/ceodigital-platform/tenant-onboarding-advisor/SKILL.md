---
name: tenant-onboarding-advisor
description: "Use during initial tenant onboarding or setup to diagnose business domains, activate essential modules, invite key team members, and configure starter workspaces."
version: 1.0.0
---

# SOP: Diagnóstico, Onboarding & Ativação do Tenant

## Quando Usar
- No primeiro contacto com um novo utilizador/empresa ou quando pedir ajuda para configurar e arrancar com a plataforma.
- Ao ativar ou expandir as capacidades do tenant inicial.

## 1. Mapeamento de Ferramentas Reais (`onboarding.*` & `workspaces.*`)
- **Ativação de Módulos em Tempo Real:**
  - `onboarding.modules.activate({ modules: ["crm", "documents", "workitems"] })` (ativa imediatamente sem recarregar a aplicação).
- **Convite Inicial de Colaboradores:**
  - `onboarding.members.invite({ email: "...", role: "admin" | "manager" | "member" })`.
- **Orientação de Plano e Capacidade:**
  - `onboarding.plan.upgrade_hint` (avalia se o volume de uso ou integrações pretendidas requer ajuste de plano ou Boost WUs).
- **Ativação de Starter Packs de Workspace:**
  - `workspaces.activate_starter_pack({ pack_slug: "sales-growth" | "finance-control" | "operations-hub" })`.
- **Projeção Espacial:**
  - `workspaces.open_pane("route:workspace")`.

## 2. Diagnóstico em 4 Passos (Zero Sobrecarga)
1. **Identificação do Core de Negócio:**
   - Perguntar a atividade principal e dor operacional imediata (vendas/leads, faturação/cobranças, gestão de projetos/tarefas, suporte).
2. **Auditoria da Stack Existente (Descoberta-Primeiro):**
   - Verificar se já utilizam software externo (CRM atual, software de faturação certificado em PT, Google Workspace / Microsoft 365).
   - Não propor módulos nativos sem antes mapear integrações existentes.
3. **Ativação Progressiva (Mínimo Viável):**
   - Ativar via `onboarding.modules.activate` apenas os 2 a 3 módulos essenciais para o arranque.
4. **Instanciação do Primeiro Workspace:**
   - Ativar o Starter Pack adequado com `workspaces.activate_starter_pack` para o utilizador ver valor no primeiro minuto.
