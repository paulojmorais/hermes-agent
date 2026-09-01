---
name: create-chat-widget-assistant
description: "Use when creating, configuring or embedding public chat widgets, website capture assistants, lead qualifiers and WhatsApp bridges."
version: 1.0.0
---

# SOP: Criação de Chat Widgets para Websites & Portais

## Quando Usar
- Quando o utilizador disser: "cria um widget de chat para o meu site", "configura um bot de captura de leads", "preciso do código de incorporar o chat".

## 1. Parâmetros de Configuração do Widget
- **Título & Saudação:** Nome do assistente visível para os visitantes (ex: "Assistente Comercial").
- **System Prompt Especializado:** Regras de qualificação de leads, recolha de email/telefone e agendamento de chamadas.
- **Identidade Visual:** Cor primária da marca, avatar e posição do botão flutuante.
- **Perguntas Rápidas (Starter Prompts):** 2 a 3 botões com perguntas frequentes dos clientes.

## 2. Procedimento de Criação
1. **Definição da Missão do Widget:**
   - Redige o prompt de captura e atendimento ao cliente.
2. **Geração do Código de Incorporação:**
   - Gera o snippet HTML com o script pronto a colar antes do fecho da tag `</body>`.
3. **Navegação & Gestão:**
   - Propõe navegar para a gestão de widgets com `ui.navigate("chat_widgets.index")` ou abre o painel correspondente.
