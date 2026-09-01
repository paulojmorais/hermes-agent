---
name: portal-seguranca-social-access
description: "Use when accessing the Portuguese Social Security portal (Segurança Social Direta) via browser automation to consult contribution regularities, obtain non-debt declarations, check employee registrations, and audit social contributions."
version: 2.0.0
---

# SOP: Acesso & Consultas à Segurança Social Direta

## Quando Usar
- Quando for necessário obter declaração de situação contributiva regularizada para concursos públicos ou financiamento bancário.
- Quando o utilizador pedir: "consulta a situação da empresa na Segurança Social", "obtém a certidão de não dívida da SS", "verifica se as contribuições mensais estão em dia", "confirma o registo de admissão do colaborador na SS".

## 1. Mapeamento de Ferramentas & Camadas de Acesso (Camada 2 / 3)
- **Acesso via Automação Web / Playwright (Camada 2):**
  - `browser.launch({ initialUrl: "https://app.seg-social.pt/ptss/" })` via CEODigital Companion Desktop.
  - `browser.navigate` + `browser.click_and_fill`: Navegação pelos menus da Segurança Social Direta.
  - `browser.screenshot`: Confirmação visual do estado do ecrã e verificação de mensagens do sistema.
- **Armazenamento Seguro de Documentos:**
  - `document-collections-organizer`: Guarda as certidões e comprovativos descarregados na pasta `finance/social_security/**` com indexação RAG.
- **Projeção no Workspace:**
  - `workspaces.open_pane("app:browser:https://app.seg-social.pt/ptss/")`.

## 2. Protocolo de Segurança e Cofre de Credenciais
1. **Zero Credenciais no Chat:**
   - **NUNCA** pedir NISS, palavra-passe ou código de acesso em texto no chat.
   - As credenciais de autenticação são lidas diretamente do cofre encriptado da organização (`/admin/settings/credentials` ou `tenant-settings-and-credentials-manager`).
2. **Confirmação HITL para Submissões Fiscais:**
   - Consultas e downloads de certidões podem ser automatizados; qualquer submissão de declarações de remunerações (DRI) ou pedidos com encargos financeiros exige validação humana prévia.

## 3. Principais Consultas Operacionais
1. **Declaração de Situação Contributiva (Certidão de Não Dívida):**
   - Menu: *Conta-Corrente ➔ Situação Contributiva ➔ Obter Declaração*. Válida por 4 meses.
2. **Extrato de Conta-Corrente & Guias de Pagamento:**
   - Consulta de valores a pagamento do mês corrente e emissão de referência multibanco.
3. **Vínculos de Trabalhadores:**
   - Consulta de trabalhadores ativos associados ao NISS da empresa empregadora.

## 4. Procedimento de Atuação
1. **Abertura da Sessão:** Dispara a navegação para a Segurança Social Direta com credenciais do cofre.
2. **Recolha do Documento:** Descarrega a certidão em PDF e arquiva na coleção de documentos fiscais.
3. **Apresentação:** Informa o utilizador com o código de validação da certidão e botão de download imediato no chat.
