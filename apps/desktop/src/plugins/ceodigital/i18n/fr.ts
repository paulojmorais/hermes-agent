import type { CeodigitalMessages } from '.'

/** French bundle. */
export const fr: CeodigitalMessages = {
  nav: { label: 'CEODigital' },
  page: {
    title: 'Projets CEODigital',
    empty: 'Aucun projet pour votre tenant pour le moment.',
    openCommand: 'CEODigital : Ouvrir les projets'
  },
  workitem: {
    status: {
      backlog: 'Backlog',
      ready: 'Prêt',
      running: 'En cours',
      review: 'Révision',
      blocked: 'Bloqué',
      done: 'Terminé',
      failed: 'Échoué',
      archived: 'Archivé'
    },
    headers: {
      id: 'ID',
      title: 'Titre',
      status: 'Statut',
      assignee: 'Responsable',
      updated: 'Mis à jour'
    },
    unassigned: 'Non assigné'
  },
  crm: {
    leads: {
      title: 'Leads CEODigital',
      empty: 'Aucun lead CRM pour votre tenant pour le moment.'
    },
    deals: {
      title: 'Affaires CEODigital',
      empty: 'Aucune affaire CRM pour votre tenant pour le moment.'
    },
    headers: {
      id: 'ID',
      title: 'Titre',
      status: 'Statut',
      value: 'Valeur'
    },
    unassigned: 'Non assigné'
  },
  agents: {
    title: 'Agents CEODigital',
    empty: "Aucun agent CEO pour votre tenant pour le moment.",
    headers: {
      name: 'Nom',
      slug: 'Slug',
      status: 'Statut',
      exposed: 'Exposé en MCP'
    },
    workflows: {
      title: 'NativeFlows',
      empty: 'Aucun workflow NativeFlow pour votre tenant pour le moment.',
      headers: {
        name: 'Nom',
        status: 'Statut',
        trigger: 'Déclencheur'
      }
    },
    runs: {
      title: 'Debrief du run',
      empty: "Aucun run pour le moment. Lancez un agent pour voir son debrief ici.",
      runBtn: 'Lancer l’agent',
      promptPlaceholder: 'Que doit faire l’agent ?',
      executing: 'En cours…',
      runCompleted: 'Terminé',
      runFailed: 'Échoué',
      runPaused: 'En pause (approbation requise)',
      headers: {
        id: 'Run',
        status: 'Statut',
        started: 'Démarré le'
      },
      viewSteps: 'Voir les étapes',
      hideSteps: 'Masquer les étapes',
      steps: 'Étapes'
    },
    schedules: {
      title: 'Planifications d’agents',
      empty: 'Aucune planification autonome d’agent pour ce tenant.',
      headers: {
        name: 'Nom',
        cron: 'Cron',
        active: 'Active',
        lastRun: 'Dernier run'
      }
    },
    pending: {
      title: 'Approbations en attente',
      empty: 'Aucune approbation HITL en attente.',
      headers: {
        tool: 'Outil',
        run: 'Run',
        status: 'Statut'
      },
      goToTenant: 'Ouvrir les approbations'
    }
  },
  errors: {
    fetch: 'Impossible de charger les projets CEODigital.',
    mcp_not_configured: "Le MCP CEODigital n'est pas configuré. Connectez-le d'abord dans vos paramètres CEODigital.",
    mcp_unreachable: 'CEODigital est injoignable pour le moment. Vérifiez votre connexion et réessayez.',
    tenant_not_found: "Aucun tenant CEODigital n'est associé à ce profil."
  }
}