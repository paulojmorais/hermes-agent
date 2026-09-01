---
name: team-members-departments-manager
description: "Use when managing organization structure: inviting members, revoking access, updating security roles, and organizing departments/teams."
version: 1.0.0
---

# SOP: Gestão de Membros de Equipa, Permissões & Departamentos

## Quando Usar
- Quando o utilizador pedir: "convida a Maria com papel de gestor comercial", "revoga o acesso do utilizador X", "altera a função de Y", "cria o departamento de Suporte", "adiciona este membro ao departamento de Vendas".

## 1. Mapeamento de Ferramentas Reais (`members.*` & `departments.*`)
- **Gestão de Membros (`members.*`):**
  - `members.list`: Consulta utilizadores ativos, convites pendentes e cargos.
  - `members.get`: Detalhe completo de permissões e atividade de um utilizador.
  - `members.invite`: Envia convite por email com perfil de acesso (`admin`, `manager`, `member`, `viewer`).
  - `members.update_role`: Altera permissões de acesso (HITL obrigatório).
  - `members.revoke`: Desativa ou remove um membro da organização.
- **Estruturação Departamental (`departments.*`):**
  - `departments.list`: Lista departamentos existentes, responsáveis e contagem de equipa.
  - `departments.get`: Consulta membros e áreas de projeto do departamento.
  - `departments.create`: Cria novo departamento com nome, slug e líder associado.
  - `departments.members.add`: Adiciona colaboradores a um departamento.
  - `departments.members.remove`: Remove colaboradores de um departamento.

## 2. Procedimento de Atuação
1. **Auditoria de Equipa:**
   - Inicia com `members.list` ou `departments.list` para verificar a estrutura atual.
2. **Convite e Onboarding:**
   - Invoca `members.invite` com email e cargo explícito.
   - Associa o novo colaborador ao respetivo departamento com `departments.members.add`.
3. **Ajustes de Segurança (HITL):**
   - Para alterações de cargos de privilégio (`admin`/`manager`), confirma sempre os impactos antes de executar `members.update_role`.
4. **Projeção no Workspace:**
   - Projeta o painel de equipa e definições via `workspaces.open_pane("route:members")` ou `workspaces.open_pane("route:departments")`.
