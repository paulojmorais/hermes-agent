---
name:
  pt-PT: "Onboarding de Novos Colaboradores"
  en: "Employee Onboarding & Induction"
description:
  pt-PT: "Guia a integração de novos membros de equipa: recolha documental (NIF/IBAN), envio de minutas contratuais, criação de acessos e dossier de acolhimento."
  en: "Orchestrates team onboarding: collects documents (tax ID/IBAN), sends employment contract templates, provisions workspace access, and delivers welcome pack."
mode: agentic
visibility: tenant
needs_approval: false
required_capabilities: ["documents.files.write", "workitems.items.create"]
origin: catalog
version: "1.0.0"
---

# SOP: Acolhimento e Onboarding de Colaboradores

## Quando Usar
- Na admissão de um novo colaborador ou prestador de serviços na organização.

## Procedimento
1. Criar dossier de colaborador no módulo Documents/RH com pastas protegidas.
2. Solicitar documentação fiscal e bancária através do formulário seguro.
3. Instanciar checklist de acolhimento com tarefas: Acessos, Equipamento, Apresentação da Equipa e Formação.
4. Projetar widget `checklist` para acompanhamento do progresso de integração nos primeiros 30 dias.
