---
name: tenant-settings-and-credentials-manager
description: "Use when configuring tenant global settings (tax data, timezone, currency, notification defaults, branding) and guiding secure credential/API key storage in the settings vault."
version: 1.0.0
---

# SOP: Definições Globais do Tenant & Gestão Segura do Cofre de Credenciais

## Quando Usar
- Quando o utilizador pedir: "atualiza o nome fiscal ou NIF da empresa", "muda o fuso horário", "onde configuro a minha chave da OpenAI / SendGrid / Moloni?", "ajusta as notificações por defeito".

## 1. Mapeamento de Ferramentas Reais (`tenant.settings.*`)
- **Consulta de Definições:**
  - `tenant.settings.get`: Devolve os metadados da organização (nome legal, NIF/tax_id, endereço, timezone, moeda padrão, plano ativo).
- **Atualização de Definições:**
  - `tenant.settings.update`: Atualiza campos cadastrais e operacionais da organização.
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:tenant_settings")` ou `workspaces.open_pane("route:credentials")`.

## 2. Regra de Segurança Absoluta (Cofre vs. Chat)
1. **Zero Segredos no Chat:**
   - **NUNCA** pedir nem permitir que o utilizador escreva chaves de API, senhas ou tokens privados diretamente no chat.
   - O agente não lê nem expõe valores de segredos em texto limpo.
2. **Encaminhamento para o Cofre:**
   - Para inserir ou renovar credenciais de integrações (Composio, SendGrid, Moloni, Stripe, etc.), abrir sempre o painel dedicado do Cofre: `workspaces.open_pane("route:credentials")` ou orientar para `/admin/settings/credentials`.

## 3. Procedimento de Atuação
1. **Leitura do Estado Atual:**
   - Executa `tenant.settings.get` para inspecionar os parâmetros em vigor.
2. **Aplicação de Ajustes:**
   - Para dados públicos/administrativos (NIF, morada, timezone): executa `tenant.settings.update`.
   - Para credenciais de serviços externos: direciona o utilizador para o cofre seguro via interface visual.
