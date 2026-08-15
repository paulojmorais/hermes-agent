/**
 * Portuguese (Portugal) — partial desktop locale.
 *
 * Uses `defineLocale()` so only the keys below override English; everything
 * else falls back to `en` (the core desktop persists a partial-locale model).
 * This is the W1a slice: UI chrome the user sees first. Expand coverage over
 * later waves (W1b+).
 */

import { defineLocale } from './define-locale'

export const pt = defineLocale({
  common: {
    apply: 'Aplicar',
    back: 'Voltar',
    save: 'Guardar',
    saving: 'A guardar…',
    cancel: 'Cancelar',
    change: 'Alterar',
    choose: 'Escolher',
    clear: 'Limpar',
    close: 'Fechar',
    collapse: 'Recolher',
    confirm: 'Confirmar',
    connect: 'Ligar',
    connecting: 'A ligar',
    continue: 'Continuar',
    copied: 'Copiado',
    copy: 'Copiar',
    copyFailed: 'Falha ao copiar',
    delete: 'Eliminar',
    docs: 'Documentação',
    done: 'Concluído',
    error: 'Erro',
    expand: 'Expandir',
    failed: 'Falhou',
    formatJson: 'Formatar JSON',
    free: 'Gratuito',
    loading: 'A carregar…',
    notSet: 'Não definido',
    refresh: 'Atualizar',
    remove: 'Remover',
    replace: 'Substituir',
    retry: 'Tentar novamente',
    run: 'Executar',
    send: 'Enviar',
    set: 'Definir',
    skip: 'Saltar',
    update: 'Atualizar',
    tryHint: term => `Tente "${term}"`,
    on: 'Ligado',
    off: 'Desligado'
  },

  fileMenu: {
    revealFinder: 'Revelar no Finder',
    revealExplorer: 'Revelar no Explorador de Ficheiros',
    revealFileManager: 'Abrir Pasta',
    revealInSidebar: 'Revelar na árvore de ficheiros',
    copyPath: 'Copiar caminho',
    copyRelativePath: 'Copiar caminho relativo',
    rename: 'Renomear…',
    delete: 'Eliminar',
    renameTitle: 'Renomear',
    renameLabel: 'Novo nome',
    deleteTitle: name => `Eliminar ${name}?`,
    deleteBody: 'Será movido para a Papeleira — pode restaurá-lo a partir daí.',
    pathCopied: 'Caminho copiado'
  },

  boot: {
    ready: 'O Hermes Desktop está pronto',
    desktopBootFailedWithMessage: message => `Falha ao arrancar o desktop: ${message}`,
    steps: {
      connectingGateway: 'A ligar ao gateway do desktop',
      loadingSettings: 'A carregar as definições do Hermes',
      loadingSessions: 'A carregar sessões recentes',
      startingDesktopConnection: 'A iniciar a ligação ao desktop',
      startingHermesDesktop: 'A iniciar o Hermes Desktop…'
    }
  },

  titlebar: {
    hideSidebar: 'Ocultar barra lateral',
    showSidebar: 'Mostrar barra lateral',
    search: 'Pesquisar',
    searchTitle: 'Pesquisar sessões, vistas e ações',
    swapSidebarSides: 'Trocar o lado da barra lateral',
    hideRightSidebar: 'Ocultar barra lateral direita',
    showRightSidebar: 'Mostrar barra lateral direita',
    muteHaptics: 'Silenciar haptics',
    unmuteHaptics: 'Ativar haptics',
    openSettings: 'Abrir definições',
    openStarmap: 'Abrir grafo de memória',
    enterHud: 'Modo HUD',
    exitHud: 'Sair do modo HUD',
    layoutEditor: 'Editor de layout',
    layoutEditorTitle: 'Editor de layout — ⌘-clique repõe o layout'
  },

  language: {
    label: 'Idioma',
    description: 'Escolha o idioma da interface do desktop.',
    saving: 'A guardar o idioma…',
    saveError: 'Falha ao atualizar o idioma',
    switchTo: 'Mudar de idioma',
    searchPlaceholder: 'Pesquisar idiomas…'
  },

  sidebar: {
    nav: {
      'new-session': 'Nova sessão',
      skills: 'Capacidades',
      messaging: 'Mensagens',
      artifacts: 'Artefactos',
      cron: 'Tarefas agendadas'
    },
    searchAria: 'Pesquisar sessões',
    searchPlaceholder: 'Pesquisar sessões…',
    clearSearch: 'Limpar pesquisa',
    results: 'Resultados',
    pinned: 'Afixadas',
    sessions: 'Sessões',
    cronJobs: 'Tarefas agendadas',
    showProjects: 'Mostrar projetos',
    showSessions: 'Mostrar sessões',
    noWorkspace: 'Sem espaço de trabalho',
    projectEmpty: 'Ainda não há sessões',
    noSessions: 'Ainda não há sessões',
    noFilterMatches: 'Nenhuma sessão corresponde aos filtros'
  },

  composer: {
    message: 'Mensagem',
    wakingProfile: profile => `A ativar ${profile}…`,
    placeholderStarting: 'A iniciar o Hermes...',
    placeholderReconnecting: 'A religar ao Hermes…',
    placeholderFollowUp: 'Enviar continuação',
    startVoice: 'Iniciar conversa de voz',
    openDirective: 'Abrir',
    queueMessage: 'Fila de mensagem',
    steer: 'Guiar a execução atual',
    stop: 'Parar',
    send: 'Enviar',
    speaking: 'A falar',
    transcribing: 'A transcrever',
    thinking: 'A pensar',
    muted: 'Silenciado',
    listening: 'A ouvir',
    muteMic: 'Silenciar microfone',
    unmuteMic: 'Ativar microfone',
    stopListening: 'Parar de ouvir e enviar',
    stopShort: 'Parar',
    endConversation: 'Terminar conversa de voz'
  },

  notifications: {
    region: 'Notificações',
    hide: 'Ocultar notificações',
    show: 'Mostrar notificações',
    more: count => `${count} ${count === 1 ? 'notificação' : 'notificações'} a mais`,
    clearAll: 'Limpar todas',
    dismiss: 'Dispensar',
    copyDetail: 'Copiar detalhe',
    copyDetailFailed: 'Falha ao copiar detalhe',
    updateReadyTitle: 'Atualização disponível',
    seeWhatsNew: 'Ver novidades',
    errors: {
      diskFull: 'Disco cheio',
      methodNotAllowed: 'Método não permitido'
    }
  },

  keybinds: {
    title: 'Atalhos de teclado',
    search: 'Procurar atalhos',
    rebind: 'Reatribuir',
    reset: 'Repor',
    resetAll: 'Repor tudo',
    pressKey: 'Primir nova tecla…',
    set: 'Definir',
    conflictWith: label => `Conflito com “${label}”`,
  },

  settings: {
    closeSettings: 'Fechar definições',
    exportConfig: 'Exportar configuração',
    importConfig: 'Importar configuração',
    resetToDefaults: 'Repor predefinições',
    nav: {
      providers: 'Fornecedores',
      providerAccounts: 'Contas de fornecedores',
      providerApiKeys: 'Chaves de API',
      gateway: 'Gateway',
      apiKeys: 'Chaves de API',
      keybinds: 'Atalhos de teclado',
      mcp: 'MCP',
      archivedChats: 'Conversas arquivadas',
      about: 'Sobre',
      billing: 'Faturação',
      notifications: 'Notificações',
      plugins: 'Plugins'
    },
    plugins: {
      title: 'Plugins',
      blurb: 'Gerir os plugins instalados.',
      openFolder: 'Abrir pasta',
      rescan: 'Reexaminar',
      enable: 'Ativar',
      disable: 'Desativar',
      failed: 'Falha ao atuar no plugin',
      empty: 'Nenhum plugin instalado ainda.'
    },
    notifications: {
      title: 'Notificações',
      enableAll: 'Ativar tudo',
      test: 'Enviar teste'
    },
    appearance: {
      title: 'Aparência',
      intro: 'Personaliza o aspeto do desktop.',
      colorMode: 'Tema de cor',
      colorModeDesc: 'Escolhe entre claro, escuro ou sistema.',
      uiScaleTitle: 'Escala da interface',
      themeTitle: 'Tema',
      themeDesc: 'Escolhe o tema do desktop.'
    }
  }
})