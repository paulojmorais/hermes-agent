---
name: sandbox-and-computer-use-orchestrator
description: "Use when orchestrating isolated code execution in ephemeral sandboxes (sandbox.create/exec/cleanup) or executing guided desktop automation via local Connector (computer.screen_info/screenshot/act) with strict HITL approval."
version: 1.0.0
---

# SOP: Orquestração de Sandboxes Isoladas & Computer-Use Assistido

## Quando Usar
- Quando for necessário correr código não confiável ou scripts com dependências pesadas em contentor isolado.
- Quando o utilizador pedir ao agente para realizar ações assistidas no ecrã do seu computador local (ex: preencher formulários em apps desktop legacy, recolher capturas de ecrã ou acionar cliques).

## 1. Mapeamento de Ferramentas Reais
- **Ambiente de Sandbox Isolado (`sandbox.*`):**
  - `sandbox.create`: Cria um ambiente de execução efémero e isolado com limites de memória e CPU.
  - `sandbox.exec`: Executa scripts ou comandos dentro da sandbox segura.
  - `sandbox.cleanup`: Destrói o ambiente e liberta recursos após a conclusão da tarefa.
- **Automação Desktop Local via Connector (`computer.*`):**
  - `computer.screen_info`: Devolve dimensões do ecrã, resolução e estado da janela ativa.
  - `computer.screenshot`: Captura o ecrã atual para inspeção visual do agente.
  - `computer.act`: Executa ações de teclado, rato (cliques e digitação) ou atalhos (HITL obrigatório).

## 2. Regras Estritas de Segurança (HITL & Isolamento)
1. **Confirmação Humana (HITL) Obrigatória em Ações de Ecrã:**
   - Antes de executar qualquer ação física com `computer.act` (clique, submit, atalho de teclado), apresentar a intenção clara ao utilizador.
   - Nunca executar ações destrutivas ou de fecho de janelas sem ordem expressa.
2. **Ciclo Efémero da Sandbox:**
   - Toda a `sandbox.create` deve ser seguida por `sandbox.cleanup` no final da rotina, garantindo que não ficam contentores órfãos a consumir recursos.

## 3. Procedimento de Atuação
1. **Seleção da Abordagem:**
   - Processamento de ficheiros/dados ➔ `sandbox.create` + `sandbox.exec`.
   - Interação com aplicações de desktop do utilizador ➔ `computer.screenshot` + `computer.act`.
2. **Execução Assistida:**
   - Valida o estado visual a cada passo antes de prosseguir para a ação seguinte.
