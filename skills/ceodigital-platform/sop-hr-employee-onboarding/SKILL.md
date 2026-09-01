---
name: sop-hr-employee-onboarding
description: "Use when onboarding new team members: collecting personal/tax documentation (NIF, IBAN, ID), drafting employment agreements, configuring workspace access roles, and creating welcome dossiers."
version: 2.0.0
---

# SOP: Integração & Onboarding de Novos Colaboradores (RH)

## Quando Usar
- Quando for contratado um novo colaborador ou quando o utilizador pedir: "prepara o onboarding do novo membro de equipa", "convida o colaborador X e dá acesso ao departamento de Vendas", "recolhe a documentação fiscal para admissão".

## 1. Mapeamento de Ferramentas Reais (`members.*` & `departments.*`)
- **Gestão de Membros & Convites:**
  - `members.invite({ email: "...", role: "member" | "manager" | "admin" })`: Envia convite por email para acesso à plataforma.
  - `departments.members.add({ departmentId: "...", userId: "..." })`: Integra o colaborador no respetivo departamento.
- **Minutas & Documentação:**
  - `office-docx-advanced-styler` / `chat.generateDocx`: Gera a minuta de contrato de trabalho ou acordo de confidencialidade (NDA).
  - `document-collections-organizer`: Cria o dossier pessoal do colaborador em `governance/hr/<colaborador>/**`.
- **Workitems & Checklist de Acolhimento:**
  - `workitems.create`: Instancia as tarefas de integração (configuração de email, entrega de equipamento, reunião de boas-vindas).

## 2. As 4 Etapas do Processo de Onboarding
1. **Recolha Documental Segura:**
   - Solicitação de NIF, morada fiscal, comprovativo de IBAN, documento de identificação e certificado de habilitações.
2. **Minuta Contratual & Assinatura:**
   - Emissão da minuta formal de trabalho em Word/PDF com preenchimento das remunerações e cláusulas de confidencialidade.
3. **Criação de Acessos & Perfis:**
   - Envio de convite na plataforma e atribuição aos workspaces certos (`workspaces.members.add`).
4. **Dossier de Acolhimento & Plano de 30 Dias:**
   - Disponibilização do manual da empresa (`help-docs-kb-manager`) e calendarização dos check-ins com o responsável.

## 3. Procedimento de Atuação
1. **Identificação do Novo Membro:** Recolhe nome, email, função e departamento.
2. **Emissão do Convite:** Executa `members.invite` com o perfil de acesso adequado.
3. **Criação da Checklist de RH:** Dispara `workitems.create` com as tarefas de acolhimento.
4. **Resumo:** Confirma a conclusão do processo e abre a visão de membros no Workspace (`workspaces.open_pane("route:members")`).
