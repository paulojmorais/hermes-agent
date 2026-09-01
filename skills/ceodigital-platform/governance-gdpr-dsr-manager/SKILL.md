---
name: governance-gdpr-dsr-manager
description: "Use when processing GDPR/RGPD data subject requests (access, erasure, portability), recording consents, auditing processing records, or managing data retention policies."
version: 1.0.0
---

# SOP: Governança de Dados, RGPD & Pedidos de Titulares (DSR)

## Quando Usar
- Quando um cliente ou titular dos dados exercer direitos RGPD ("quero que apaguem os meus dados", "exportem os meus dados pessoais", "retirem o meu consentimento").
- Quando for necessário auditar registos de atividades de tratamento (ROPA) ou verificar prazos de retenção de dados da empresa.

## 1. Mapeamento de Ferramentas Reais (`governance.*`)
- **Pedidos de Titulares de Dados (DSR):**
  - `governance.dsr.list`: Consulta pedidos pendentes/concluídos (filtros por estado, tipo e titular).
  - `governance.dsr.create`: Regista um novo pedido formal (tipos: `access`, `rectification`, `erasure`, `restriction`, `portability`, `objection`).
  - `governance.dsr.route`: Encaminha o pedido para o responsável de proteção de dados / DPO com despacho.
- **Consentimentos:**
  - `governance.consents.list`: Consulta histórico de consentimentos de um titular.
  - `governance.consents.record`: Regista nova concessão ou revogação formal de consentimento.
- **Registos de Tratamento & Retenção:**
  - `governance.processing_records.list`: Lista finalidades de tratamento ativas no tenant.
  - `governance.retention.list`: Consulta políticas e prazos de retenção aplicados por categoria de dados.

## 2. Procedimento de Atuação
1. **Identificação & Registo:**
   - Ao receber pedido de titular, invoca `governance.dsr.create` com NIF/email, tipo de direito e justificação legal.
2. **Triagem de Consentimentos:**
   - Se for revogação de marketing ou cookies, invoca `governance.consents.record` para atualizar o estado legal.
3. **Encaminhamento & Notificação:**
   - Encaminha internamente via `governance.dsr.route` para cumprimento dentro do prazo legal de 30 dias.
4. **Relatório de Conformidade:**
   - Projeta resumo executivo no chat (`chat.createArtifact`) com prazos de resposta e checklist de anonimização.
