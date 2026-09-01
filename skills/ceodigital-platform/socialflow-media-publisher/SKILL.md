---
name: socialflow-media-publisher
description: "Use when drafting, planning, scheduling, and publishing multi-platform social media content (LinkedIn, Instagram, Facebook, X, YouTube), generating visual banners, and tracking engagement."
version: 2.0.0
---

# SOP: Publicação & Gestão de Redes Sociais no SocialFlow

## Quando Usar
- Quando o utilizador pedir: "agenda um post para o LinkedIn", "cria conteúdo para as redes sociais sobre o nosso novo serviço", "gera um banner visual e escreve a cópia para o Instagram", "mostra o calendário de publicações desta semana".

## 1. Mapeamento de Ferramentas & Rotas
- **Navegação & Gestão no Workspace:**
  - `workspaces.open_pane("route:social")`: Abre o calendário editorial do SocialFlow lado a lado.
- **Geração de Criativos Visuais:**
  - `chat.generateImage({ prompt: "...", size: "1024x1024" | "1792x1024" })`: Cria imagens de alta qualidade orientadas ao contexto da publicação.
- **Planeamento de Campanhas:**
  - `multi-channel-marketing-campaign-planner`: Estrutura calendários de conteúdo multi-canal e réguas de publicação.
- **Apresentação do Calendário:**
  - `chat.createArtifact({ kind: "html", title: "...", content: "..." })` ou `renderWidget`: Tabela visual interativa com datas, canais e estado dos posts.

## 2. Adaptação de Conteúdo por Rede Social
1. **LinkedIn (B2B & Liderança):**
   - Tom profissional, partilha de aprendizagens, métricas de negócio, quebras de linha limpas para legibilidade e 3 a 5 hashtags estratégicas.
2. **Instagram / Facebook (Visual & Engagement):**
   - Foco visual no criativo (`chat.generateImage`), texto apelativo nas primeiras duas linhas, emojis com moderação e chamada para ação (CTA) no link da bio.
3. **X / Twitter (Conciso & Direto):**
   - Mensagens curtas (<280 caracteres) ou threads encadeadas com ganchos claros.

## 3. Procedimento de Atuação
1. **Definição da Mensagem:** Identifica o tema, público-alvo e redes pretendidas.
2. **Redação & Geração Visual:** Produz as variantes de texto por rede e gera a imagem de suporte via `chat.generateImage`.
3. **Apresentação para Aprovação:** Mostra o rascunho completo no chat.
4. **Agendamento:** Orienta a submissão com data e hora no SocialFlow (`workspaces.open_pane("route:social")`).
