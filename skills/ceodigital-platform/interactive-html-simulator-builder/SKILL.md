---
name: interactive-html-simulator-builder
description: "Use when creating interactive HTML5/Tailwind mini-apps, dynamic pricing calculators, ROI simulators, scenario dashboards, or interactive widgets with data-ceodigital-send action triggers."
version: 1.0.0
---

# SOP: Criação de Simuladores & Mini-Aplicações Interativas (HTML5 + Tailwind)

## Quando Usar
- Quando o utilizador pedir: "cria uma calculadora de ROI interativa", "faz um simulador de cenários de preços", "constrói uma mini-ferramenta visual para testar taxas de juro", "faz um dashboard interativo para este relatório".

## 1. Mapeamento de Ferramentas Reais
- **Criação do Artefacto Vivo:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })`: Renderiza imediatamente o simulador visual no chat com preview em tempo real.
- **Atualização / Ajustes Incrementais:**
  - `chat.patchArtifact`: Edição cirúrgica de parâmetros, fórmulas ou estilos no código HTML.
- **Projeção no Workspace:**
  - `workspaces.open_pane("artifact:<artifactId>")`: Projeta a mini-aplicação numa aba dedicada do Workspace lado a lado.

## 2. Padrão de Engenharia de Mini-Aplicações
1. **Design Responsivo & Temático:**
   - Usar HTML5 semântico com classes utilitárias do **Tailwind CSS** (já pré-carregado no ambiente).
   - Utilizar as variáveis de cor corporativas do tema: `bg-slate-900`, `text-slate-100`, `border-slate-800`, `accent-amber-500` / `emerald-500`.
2. **Reatividade em JavaScript Nativo:**
   - Incluir scripts embutidos `<script>` limpos com cálculo instantâneo em tempo real (sliders `<input type="range">`, inputs numéricos com `oninput="recalcular()"`).
3. **Comunicação Bidirecional com o Chat (`data-ceodigital-send`):**
   - Para botões de ação ou cenários predefinidos, adicionar o atributo `data-ceodigital-send="<prompt>"`:
     ```html
     <button data-ceodigital-send="Aplica o Cenário Agressivo de 15% de margem no CRM" 
             class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition">
       Aplicar Cenário ao CRM
     </button>
     ```
   - Ao clicar no botão, o prompt é enviado automaticamente de volta para a conversa como instrução para o agente.

## 3. Procedimento de Construção
1. **Modelar as Fórmulas:** Define as variáveis de entrada (inputs), os coeficientes e os KPIs de saída (cards de totais, gráficos de barras SVG simples).
2. **Gerar o Código HTML Completo:** Invoca imediatamente `chat.createArtifact(kind='html')` com código pronto e funcional.
3. **Convidar à Experimentação:** Informa o utilizador de que pode ajustar os valores no ecrã e carregar nos botões de ação para sincronizar com o negócio.
