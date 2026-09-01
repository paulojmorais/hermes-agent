---
name: client-portal-experience
description: "Use when configuring or optimizing the dedicated Client Portal: sharing implementation project milestones, electronic proposal approvals, invoice views, and branded self-service support."
version: 2.0.0
---

# SOP: Portal do Cliente & Experiência de Auto-Serviço

## Quando Usar
- Quando o utilizador pedir: "como o cliente vê o progresso do projeto?", "ativa o portal do cliente para esta empresa", "partilha o link de aprovação da proposta", "disponibiliza as faturas no portal do cliente", "personaliza o logótipo e domínio do portal".

## 1. Mapeamento de Ferramentas & Módulos
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:client_portal")`: Abre o painel de definições e pré-visualização do Portal do Cliente.
- **Entidades Partilhadas no Portal:**
  - **Propostas Comerciais:** `services.proposals.list` ➔ Geração de link seguro de assinatura digital com portão de aceitação/rejeição.
  - **Projetos de Implementação:** `implementations.projects.get` + `implementations.phases.list` ➔ Visibilidade de phase gates concluídos e marcos futuros para o cliente.
  - **Faturação & Pagamentos:** Visualização de faturas emitidas e histórico de tranches pagas.
  - **Central de Ajuda (KB):** `help-docs-kb-manager` ➔ Artigos de suporte públicos e tutoriais.

## 2. Níveis de Acesso & Segurança do Cliente
1. **Magic Link & Autenticação Segura:**
   - O cliente acede via link autenticado temporário ou credenciais de contacto associadas à sua Organização no CRM.
2. **Isolamento Estrito de Dados (Tenant & Client Isolation):**
   - O cliente apenas visualiza registos explicitamente associados ao seu `organization_id` ou `project_id`. Notas internas da equipa nunca são expostas.
3. **Assinatura Eletrónica de Propostas (E-Sign):**
   - Registo de IP, timestamp e consentimento legal no momento da adjudicação da proposta pelo cliente.

## 3. Procedimento de Atuação
1. **Verificação do Estado:** Confirma se a Organização do cliente tem contactos e projetos atribuídos.
2. **Personalização da Experiência:** Orienta a configuração de branding (logótipo da empresa prestadora, cores primárias, domínio personalizado `portal.empresa.pt`).
3. **Emissão de Acessos:** Fornece o link seguro do portal ou dispara convite automático por email.
4. **Acompanhamento no Workspace:** Abre `workspaces.open_pane("route:client_portal")` para o utilizador auditar a visão do cliente.
