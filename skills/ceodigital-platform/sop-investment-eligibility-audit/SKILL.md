---
name: sop-investment-eligibility-audit
description: "Use when auditing company eligibility for EU and Portuguese funding programs (PT2030, PRR, Next Generation), checking compliance criteria and preparing submissions."
version: 1.0.0
---

# SOP: Auditoria de Elegibilidade a Fundos de Investimento (PT2030 / PRR)

## Quando Usar
- Quando o utilizador pedir: "verifica se somos elegíveis para o PT2030", "audita a candidatura ao PRR", "que fundos europeus podemos candidatar".

## 1. Critérios de Elegibilidade a Verificar
- **Dimensão da Empresa:** Micro, Pequena ou Média (conforme Recomendação 2003/361/CE).
- **Setor de Atividade:** Compatibilidade do CAE com os avisos de candidatura.
- **Situação Fiscal** (regularizada) e **Legal** (sem dívidas à Segurança Social ou Autoridade Tributária).
- **Localização** (NUTS II/III) e **Enquadramento Regional**.
- **Capacidade Financeira** para cofinanciamento próprio.

## 2. Mapeamento de Ferramentas Reais
- `int.informadb.company_file`: Dimensão, CAE e situação da empresa.
- `int.informadb.sii_indicator`: Indicador de solvência e risco.
- `chat.createArtifact` / `renderWidget`: Painel interativo de verificação de requisitos.
- `crm.organizations.get`: Dados cadastrais do cliente.

## 3. Procedimento de Atuação
1. **Recolha de Dados:** Obtém perfil financeiro e fiscal da empresa.
2. **Conferência de Elegibilidade:** Cruza os critérios com os dados obtidos e indica "Elegível", "Inelegível" ou "Requer Ações".
3. **Preparação da Candidatura:** Gera documento de apoio e lista as evidências/documentos necessários.