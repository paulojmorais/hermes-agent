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
  workitems: {
    title: 'Workitems CEODigital',
    empty: 'Aucun work item pour votre tenant pour le moment.',
    openCommand: 'CEODigital : Ouvrir les workitems',
    filters: {
      all: 'Tous',
      mine: 'Les miens',
      dueSoon: 'À échéance proche',
      awaitingApproval: 'En attente d’approbation'
    },
    toolbar: {
      new: 'Nouveau work item',
      suggest: 'Suggérer',
      suggestPlaceholder: 'Décrivez ce dont vous avez besoin…',
      suggestRun: 'Trouver des SOP correspondants',
      suggestEmpty: 'Aucun SOP ne correspond à cette intention.'
    },
    form: {
      title: 'Titre',
      subjectType: 'Type de sujet',
      subjectTypePlaceholder: 'project, deal, lead…',
      description: 'Description',
      due: 'Échéance',
      create: 'Créer le work item',
      cancel: 'Annuler'
    },
    actions: {
      run: 'Exécuter',
      assign: 'Assigner',
      submitOutput: 'Soumettre la sortie',
      running: 'En cours…',
      assigning: 'Assignation…',
      submitting: 'Envoi…'
    },
    assign: {
      title: 'Assigner',
      add: 'Ajouter (ids utilisateurs)',
      remove: 'Retirer (ids utilisateurs)',
      role: 'Rôle',
      save: 'Enregistrer l’assignation',
      empty: 'Aucun utilisateur à afficher.'
    },
    submit: {
      title: 'Soumettre la sortie',
      runId: 'Id du run',
      output: 'Sortie (JSON)',
      notes: 'Notes',
      send: 'Soumettre'
    },
    checklist: {
      title: 'Checklist',
      itemLabel: 'Id de l’élément de la checklist',
      doneLabel: 'Terminé',
      toggle: 'Basculer',
      empty: 'Aucun élément de checklist fourni pour ce work item.'
    },
    errors: {
      create: 'Impossible de créer le work item.',
      run: 'Impossible d’exécuter le work item.',
      assign: 'Impossible de mettre à jour l’assignation.',
      submit: 'Impossible de soumettre la sortie.',
      checklist: 'Impossible de basculer l’élément de la checklist.',
      suggest: 'Impossible de récupérer les suggestions de SOP.',
      general: 'L’action a échoué. Réessayez.'
    }
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
    persons: {
      title: 'Personnes CEODigital',
      empty: 'Aucune personne CRM pour votre tenant pour le moment.',
      headers: {
        email: 'E-mail',
        org: 'Organisation'
      }
    },
    organizations: {
      title: 'Organisations CEODigital',
      empty: 'Aucune organisation CRM pour votre tenant pour le moment.',
      headers: {
        industry: 'Secteur'
      }
    },
    pipelines: {
      title: 'Pipelines CEODigital',
      empty: 'Aucun pipeline CRM pour votre tenant pour le moment.',
      headers: {
        subject: 'Sujet',
        stages: 'Étapes'
      }
    },
    stages: {
      title: 'Étapes CEODigital',
      empty: 'Aucune étape CRM pour votre tenant pour le moment.',
      headers: {
        probability: 'Probabilité',
        won: 'Gagnée'
      }
    },
    activities: {
      title: 'Activités CEODigital',
      empty: 'Aucune activité CRM pour votre tenant pour le moment.',
      headers: {
        kind: 'Type',
        created: 'Créée le'
      }
    },
    categories: {
      title: 'Catégories CEODigital',
      empty: 'Aucune catégorie CRM pour votre tenant pour le moment.',
      headers: {
        slug: 'Slug',
        active: 'Active'
      }
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