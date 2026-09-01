---
name: multi-channel-marketing-campaign-planner
description: "Use when planning, orchestrating, or scheduling multi-channel marketing campaigns: social media calendar (SocialFlow), newsletters, landing copies, and visual creatives generation."
version: 1.0.0
---

# SOP: Planeamento de Campanhas de Marketing Multi-Canal

## Quando Usar
- Ao planear um lançamento de produto, evento ou campanha promocional.
- Quando o utilizador pedir: "cria uma campanha de marketing para o novo serviço X", "agenda os posts para o LinkedIn e Instagram desta semana", "escreve uma newsletter para a nossa base de clientes".

## 1. Mapeamento de Ferramentas Reais
- **Publicação & Agendamento Social:**
  - `socialflow-media-publisher` / `/socialflow`: Agendamento de posts com data e hora para LinkedIn, Instagram, X e Facebook.
- **Geração de Criativos Visuais:**
  - `chat.generateImage`: Criação de ilustrações, banners e imagens conceituais de alta qualidade com prompts descritivos em inglês.
- **Segmentação & Audiência CRM:**
  - `crm.persons.list` / `crm.leads.list` (filtros por interesse, setor ou fase de qualificação).
- **Relatório e Painel de Campanha:**
  - `chat.createArtifact(kind='html')` ou `renderWidget`: Visualização interativa do calendário de campanha, copies e status de cada canal.

## 2. Estrutura Canónica de uma Campanha (3 Camadas)
1. **Âncora de Conteúdo (Hero Content):**
   - Artigo de blog, case study ou comunicado de lançamento detalhado.
2. **Desdobramento Multi-Canal (Derivatives):**
   - **LinkedIn:** Foco profissional, estatísticas de impacto e lições aprendidas.
   - **Instagram / Visual:** Copies concisos com gancho visual (`chat.generateImage`).
   - **Email / Newsletter:** Mensagem personalizada com chamada para ação clara (CTA).
3. **Métricas & Conversão:**
   - Links com parâmetros UTM para rastreio e criação de leads automáticas através de `chat-widget-omnichannel`.

## 3. Procedimento de Atuação
1. **Briefing da Campanha:** Define público-alvo, proposta de valor única e datas-chave.
2. **Geração de Copies & Imagens:** Produz as variantes por canal e gera os visuais de suporte.
3. **Apresentação em Artefacto:** Renderiza o plano em tabela/painel visual para aprovação do utilizador.
4. **Agendamento:** Conclui com o envio para aprovação no SocialFlow e no CRM.
