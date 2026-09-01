---
name: connector-desktop-companion
description: "Use when pairing, monitoring, or troubleshooting the CEODigital Desktop Companion, enabling local filesystem bridge, secure hybrid RAG indexing, and desktop screen actions."
version: 2.0.0
---

# SOP: CEODigital Companion Desktop & Conectores de Infraestrutura Local

## Quando Usar
- Quando o utilizador pedir: "como ligo o meu computador ao CEODigital?", "emparelha o Companion Desktop", "permite acesso aos ficheiros do meu disco local", "executa uma ação assistida no meu ecrã", "verifica o estado da ligação local".

## 1. Mapeamento de Ferramentas Reais (`connector.*` & `computer.*`)
- **Gestão de Dispositivos e Emparelhamento:**
  - `connector.devices.list`: Lista os computadores/dispositivos emparelhados com o tenant e respetivo estado (online/offline, latência, versão).
  - `connector.resources.list`: Lista pastas e ficheiros locais partilhados em segurança pelo utilizador.
- **Automação Desktop Assistida (HITL Obrigatório):**
  - `computer.screen_info`: Obtém a resolução e janela ativa no computador do utilizador.
  - `computer.screenshot`: Captura o ecrã local para análise visual da IA.
  - `computer.act`: Executa cliques, atalhos de teclado ou preenchimento de campos (sempre com confirmação explícita do utilizador).
- **Projeção no Workspace:**
  - `workspaces.open_pane("route:connector")` ou `workspaces.open_pane("app:computer")`.

## 2. Pilares de Segurança da Ponte Local
1. **Zero Acesso Cego ao Disco:**
   - O agente cloud apenas acede às pastas explicitamente autorizadas pelo utilizador nas definições do Companion.
2. **Encriptação de Ponta a Ponta (E2EE):**
   - Comunicação segura via túnel encriptado (Relay Daemon) sem exposição de portas do router.
3. **Controlo Humano Obrigatório (HITL):**
   - Qualquer ação de controlo de rato/teclado (`computer.act`) requer consentimento prévio do utilizador no ecrã.

## 3. Procedimento de Emparelhamento e Diagnóstico
1. **Verificação de Estado:** Executa `connector.devices.list` para verificar se existe algum Companion online.
2. **Se Desconectado:** Orienta o utilizador a descarregar e abrir o CEODigital Companion Desktop e fornece o código de emparelhamento seguro em 1-clique.
3. **Se Online:** Confirma as pastas partilhadas via `connector.resources.list` e permite consultas locais seguras.
