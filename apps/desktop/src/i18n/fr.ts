/**
 * Français — locale desktop partiel.
 *
 * Utilise `defineLocale()` : seules les clés ci-dessous remplacent l'anglais,
 * tout le reste retombe sur `en` (le desktop persiste un modèle partiel).
 * C'est la tranche W1a : le chrome d'interface vu en premier. Étendre la
 * couverture dans les vagues suivantes (W1b+).
 */

import { defineLocale } from './define-locale'

export const fr = defineLocale({
  common: {
    apply: 'Appliquer',
    back: 'Retour',
    save: 'Enregistrer',
    saving: 'Enregistrement…',
    cancel: 'Annuler',
    change: 'Changer',
    choose: 'Choisir',
    clear: 'Effacer',
    close: 'Fermer',
    collapse: 'Réduire',
    confirm: 'Confirmer',
    connect: 'Connecter',
    connecting: 'Connexion…',
    continue: 'Continuer',
    copied: 'Copié',
    copy: 'Copier',
    copyFailed: 'Échec de la copie',
    delete: 'Supprimer',
    docs: 'Documentation',
    done: 'Terminé',
    error: 'Erreur',
    expand: 'Développer',
    failed: 'Échec',
    formatJson: 'Formater le JSON',
    free: 'Gratuit',
    loading: 'Chargement…',
    notSet: 'Non défini',
    refresh: 'Actualiser',
    remove: 'Retirer',
    replace: 'Remplacer',
    retry: 'Réessayer',
    run: 'Exécuter',
    send: 'Envoyer',
    set: 'Définir',
    skip: 'Ignorer',
    update: 'Mettre à jour',
    tryHint: term => `Essayez « ${term} »`,
    on: 'Activé',
    off: 'Désactivé'
  },

  fileMenu: {
    revealFinder: 'Afficher dans le Finder',
    revealExplorer: 'Afficher dans l’Explorateur',
    revealFileManager: 'Ouvrir le dossier',
    revealInSidebar: 'Afficher dans l’arborescence',
    copyPath: 'Copier le chemin',
    copyRelativePath: 'Copier le chemin relatif',
    rename: 'Renommer…',
    delete: 'Supprimer',
    renameTitle: 'Renommer',
    renameLabel: 'Nouveau nom',
    deleteTitle: name => `Supprimer ${name} ?`,
    deleteBody: 'Il sera déplacé vers la Corbeille — vous pourrez le restaurer.',
    pathCopied: 'Chemin copié'
  },

  boot: {
    ready: 'Le bureau Hermes est prêt',
    desktopBootFailedWithMessage: message => `Échec du démarrage du bureau : ${message}`,
    steps: {
      connectingGateway: 'Connexion à la passerelle du bureau',
      loadingSettings: 'Chargement des réglages Hermes',
      loadingSessions: 'Chargement des sessions récentes',
      startingDesktopConnection: 'Démarrage de la connexion au bureau',
      startingHermesDesktop: 'Démarrage du bureau Hermes…'
    }
  },

  titlebar: {
    hideSidebar: 'Masquer la barre latérale',
    showSidebar: 'Afficher la barre latérale',
    search: 'Rechercher',
    searchTitle: 'Rechercher sessions, vues et actions',
    swapSidebarSides: 'Changer la barre latérale de côté',
    hideRightSidebar: 'Masquer la barre latérale droite',
    showRightSidebar: 'Afficher la barre latérale droite',
    muteHaptics: 'Couper les haptiques',
    unmuteHaptics: 'Activer les haptiques',
    openSettings: 'Ouvrir les réglages',
    openStarmap: 'Ouvrir le graphe de mémoire',
    enterHud: 'Mode HUD',
    exitHud: 'Quitter le mode HUD',
    layoutEditor: 'Éditeur de disposition',
    layoutEditorTitle: 'Éditeur de disposition — ⌘-clic rétablit la disposition'
  },

  language: {
    label: 'Langue',
    description: 'Choisissez la langue de l’interface du bureau.',
    saving: 'Enregistrement de la langue…',
    saveError: 'Échec de la mise à jour de la langue',
    switchTo: 'Changer de langue',
    searchPlaceholder: 'Rechercher les langues…'
  },

  sidebar: {
    nav: {
      'new-session': 'Nouvelle session',
      skills: 'Capacités',
      messaging: 'Messages',
      artifacts: 'Artefacts',
      cron: 'Tâches planifiées'
    },
    searchAria: 'Rechercher les sessions',
    searchPlaceholder: 'Rechercher les sessions…',
    clearSearch: 'Effacer la recherche',
    results: 'Résultats',
    pinned: 'Épinglées',
    sessions: 'Sessions',
    cronJobs: 'Tâches planifiées',
    showProjects: 'Afficher les projets',
    showSessions: 'Afficher les sessions',
    noWorkspace: 'Aucun espace de travail',
    projectEmpty: 'Aucune session pour l’instant',
    noSessions: 'Aucune session',
    noFilterMatches: 'Aucune session ne correspond aux filtres'
  },

  composer: {
    message: 'Message',
    wakingProfile: profile => `Activation de ${profile}…`,
    placeholderStarting: 'Démarrage de Hermes...',
    placeholderReconnecting: 'Reconnexion à Hermes…',
    placeholderFollowUp: 'Envoyer une suite',
    startVoice: 'Lancer une conversation vocale',
    openDirective: 'Ouvrir',
    queueMessage: 'Mettre en file',
    steer: 'Guider l’exécution en cours',
    stop: 'Arrêter',
    send: 'Envoyer',
    speaking: 'Parle',
    transcribing: 'Transcription…',
    thinking: 'Réflexion…',
    muted: 'Coupé',
    listening: 'Écoute…',
    muteMic: 'Couper le micro',
    unmuteMic: 'Réactiver le micro',
    stopListening: 'Arrêter d’écouter et envoyer',
    stopShort: 'Arrêter',
    endConversation: 'Terminer la conversation vocale'
  },

  notifications: {
    region: 'Notifications',
    hide: 'Masquer les notifications',
    show: 'Afficher les notifications',
    more: count => `${count} notification${count === 1 ? '' : 's'} de plus`,
    clearAll: 'Tout effacer',
    dismiss: 'Ignorer',
    copyDetail: 'Copier le détail',
    copyDetailFailed: 'Échec de la copie du détail',
    updateReadyTitle: 'Mise à jour disponible',
    seeWhatsNew: 'Voir les nouveautés',
    errors: {
      diskFull: 'Disque plein',
      methodNotAllowed: 'Méthode non autorisée'
    }
  },

  keybinds: {
    title: 'Raccourcis clavier',
    search: 'Rechercher les raccourcis',
    rebind: 'Réaffecter',
    reset: 'Réinitialiser',
    resetAll: 'Tout réinitialiser',
    pressKey: 'Appuyer sur une touche…',
    set: 'Définir',
    conflictWith: label => `Conflit avec “${label}”`,
  },

  settings: {
    closeSettings: 'Fermer les réglages',
    exportConfig: 'Exporter la configuration',
    importConfig: 'Importer la configuration',
    resetToDefaults: 'Rétablir les valeurs par défaut',
    nav: {
      providers: 'Fournisseurs',
      providerAccounts: 'Comptes de fournisseurs',
      providerApiKeys: 'Clés API',
      gateway: 'Passerelle',
      apiKeys: 'Clés API',
      keybinds: 'Raccourcis clavier',
      mcp: 'MCP',
      archivedChats: 'Conversations archivées',
      about: 'À propos',
      billing: 'Facturation',
      notifications: 'Notifications',
      plugins: 'Plugins'
    },
    plugins: {
      title: 'Plugins',
      blurb: 'Gérer les plugins installés.',
      openFolder: 'Ouvrir le dossier',
      rescan: 'Re-analyser',
      enable: 'Activer',
      disable: 'Désactiver',
      failed: 'Échec de l’action sur le plugin',
      empty: 'Aucun plugin installé pour le moment.'
    },
    notifications: {
      title: 'Notifications',
      enableAll: 'Tout activer',
      test: 'Envoyer un test'
    },
    appearance: {
      title: 'Apparence',
      intro: 'Personnalisez l’aspect du bureau.',
      colorMode: 'Thème de couleur',
      colorModeDesc: 'Choisissez clair, sombre ou système.',
      uiScaleTitle: 'Échelle de l’interface',
      themeTitle: 'Thème',
      themeDesc: 'Choisissez le thème du bureau.'
    }
   }
 })