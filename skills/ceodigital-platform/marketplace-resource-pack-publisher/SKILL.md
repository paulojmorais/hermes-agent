---
name: marketplace-resource-pack-publisher
description: "Use when packaging, sanitizing, exporting, or publishing reusable AgentFlows, Playbooks, Skills, or Workspace Templates to the internal or public Marketplace."
version: 1.0.0
---

# SOP: Publicação & Partilha de Recursos no Marketplace

## Quando Usar
- Quando o utilizador pedir: "quero partilhar este fluxo no marketplace", "exporta este playbook como template reutilizável", "publica este agente para outros departamentos usarem".

## 1. Mapeamento de Ferramentas & Rotas
- **Navegação & Gestão do Marketplace:**
  - `workspaces.open_pane("route:marketplace")`: Visualização de packs, templates e integrações disponíveis.
- **Publicação de Fluxos & Automações:**
  - `agentflow.workflows.publish`: Publica uma versão estável de um AgentFlow para reutilização.
- **Inspeção e Extração de Templates:**
  - `workspaces.get`: Extrai a composição de painéis de um workspace para gerar um Starter Pack.
  - `playbooks.get`: Obtém a definição do playbook para exportação.

## 2. Protocolo de Higienização de Dados (Sanitization Gate)
Antes de qualquer publicação no catálogo partilhado, é **obrigatório** validar:
1. **Zero Segredos e Chaves API:** Todas as credenciais de terceiros devem ser substituídas por placeholders genéricos (`{{API_KEY}}`).
2. **Zero Dados Pessoais (PII):** Nomes reais de clientes, emails, NIFs ou dados bancários devem ser convertidos em variáveis de exemplo.
3. **Desacoplamento de IDs Internos:** Substituir UUIDs de base de dados por referências lógicas ou schemas abstratos.

## 3. Procedimento de Publicação
1. **Auditoria de Conformidade:** Inspeciona o recurso (Agente, Flow, Playbook ou Workspace) e aplica o protocolo de higienização.
2. **Definição de Metadados:** Define título claro, descrição de valor, categoria (Vendas, Finanças, Operações, RH) e ícone contextual.
3. **Geração do Pacote:** Compõe a definição exportável e publica no catálogo via `agentflow.workflows.publish` ou rota do Marketplace.
4. **Confirmação:** Confirma a disponibilidade do template no Marketplace e fornece o comando para importação.
