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
  services: {
    catalog: {
      title: 'Catalogue de services',
      empty: 'Aucun élément de catalogue de services pour votre tenant pour le moment.',
      searchPlaceholder: 'Rechercher dans le catalogue…',
      produces: 'Produit',
      allProduces: 'Tous',
      activeOnly: 'Actifs uniquement',
      offerings: 'Offres',
      offeringsEmpty: 'Aucune offre pour cet élément de catalogue.',
      back: 'Retour au catalogue',
      detail: 'Élément du catalogue',
      headers: { name: 'Nom', code: 'Code', pricing: 'Tarification', model: 'Modèle' }
    },
    offerings: {
      title: 'Offres de services',
      empty: 'Aucune offre de services pour votre tenant pour le moment.'
    },
    categories: {
      title: 'Catégories de services',
      empty: 'Aucune catégorie de services pour votre tenant pour le moment.'
    },
    proposals: {
      title: 'Propositions CEODigital',
      openCommand: 'CEODigital : Ouvrir les propositions',
      empty: 'Aucune proposition pour votre tenant pour le moment.',
      new: 'Nouvelle proposition',
      back: 'Retour aux propositions',
      detail: 'Détail de la proposition',
      fields: {
        title: 'Titre',
        status: 'Statut',
        description: 'Description',
        currency: 'Devise',
        totalValue: 'Valeur totale',
        paymentModel: 'Modèle de paiement',
        depositPercentage: 'Acompte %',
        validUntil: 'Valable jusqu’au',
        terms: 'Conditions',
        leadId: 'Id du lead'
      },
      status: {
        draft: 'Brouillon',
        sent: 'Envoyée',
        accepted: 'Acceptée',
        rejected: 'Rejetée',
        cancelled: 'Annulée',
        expired: 'Expirée',
        pending: 'En attente'
      },
      actions: {
        send: 'Envoyer',
        accept: 'Accepter',
        reject: 'Rejeter',
        cancel: 'Annuler',
        duplicate: 'Dupliquer',
        expire: 'Expirer',
        addItem: 'Ajouter une ligne',
        addTranche: 'Ajouter une échéance',
        save: 'Enregistrer',
        remove: 'Retirer',
        sending: 'Envoi…',
        accepting: 'Acceptation…',
        rejecting: 'Rejet…',
        cancelling: 'Annulation…',
        duplicating: 'Duplication…',
        expiring: 'Expiration…'
      },
      reject: { reasonPlaceholder: 'Motif (facultatif)…', cancel: 'Annuler' },
      items: {
        headers: {
          description: 'Description',
          quantity: 'Qté',
          unitPrice: 'Prix unitaire',
          discount: 'Remise',
          vatRate: 'TVA %',
          recurrence: 'Récurrence'
        },
        empty: 'Aucune ligne sur cette proposition pour le moment.',
        form: {
          serviceCatalogId: 'Id du catalogue de services',
          serviceOfferingId: 'Id de l’offre',
          quantity: 'Quantité',
          unitPrice: 'Prix unitaire',
          discount: 'Remise',
          vatRate: 'TVA %',
          recurrence: 'Récurrence',
          description: 'Description',
          sortOrder: 'Ordre',
          add: 'Ajouter la ligne',
          update: 'Mettre à jour la ligne',
          cancel: 'Annuler'
        }
      },
      tranches: {
        headers: { label: 'Libellé', amount: 'Montant', dueDate: 'Échéance', sortOrder: 'Ordre' },
        empty: 'Aucune échéance de paiement sur cette proposition pour le moment.',
        form: {
          label: 'Libellé',
          amount: 'Montant',
          dueDate: 'Échéance',
          sortOrder: 'Ordre',
          add: 'Ajouter l’échéance',
          update: 'Mettre à jour l’échéance',
          cancel: 'Annuler'
        }
      },
      form: {
        title: 'Titre',
        leadId: 'Id du lead',
        description: 'Description',
        totalValue: 'Valeur totale',
        paymentModel: 'Modèle de paiement',
        depositPercentage: 'Acompte %',
        validUntil: 'Valable jusqu’au',
        currency: 'Devise',
        terms: 'Conditions',
        create: 'Créer la proposition',
        cancel: 'Annuler'
      },
      errors: {
        create: 'Impossible de créer la proposition.',
        send: 'Impossible d’envoyer la proposition.',
        accept: 'Impossible d’accepter la proposition.',
        reject: 'Impossible de rejeter la proposition.',
        cancel: 'Impossible d’annuler la proposition.',
        duplicate: 'Impossible de dupliquer la proposition.',
        expire: 'Impossible de faire expirer la proposition.',
        addItem: 'Impossible d’ajouter la ligne.',
        updateItem: 'Impossible de mettre à jour la ligne.',
        removeItem: 'Impossible de retirer la ligne.',
        addTranche: 'Impossible d’ajouter l’échéance.',
        updateTranche: 'Impossible de mettre à jour l’échéance.',
        removeTranche: 'Impossible de retirer l’échéance.',
        fetchProposal: 'Impossible de charger cette proposition.',
        general: 'L’action a échoué. Réessayez.'
      }
    }
  },
  automation: {
    conversations: {
      title: 'Conversations CEODigital',
      openCommand: 'CEODigital : Ouvrir les conversations',
      empty: 'Aucune conversation d’automatisation trouvée pour votre tenant.',
      search: 'Rechercher des conversations…',
      archivedOnly: 'Archivées uniquement',
      all: 'Toutes',
      new: 'Nouvelle conversation',
      form: {
        title: 'Titre',
        titlePlaceholder: 'Titre de la conversation',
        systemPrompt: 'Invite système',
        model: 'Modèle',
        workspaceId: 'Id du workspace',
        tags: 'Tags (séparées par des virgules)',
        create: 'Créer la conversation',
        cancel: 'Annuler'
      },
      actions: {
        archive: 'Archiver',
        share: 'Partager',
        unshare: 'Ne plus partager',
        archiving: 'Archivage…',
        sharing: 'Partage…'
      },
      headers: {
        id: 'ID',
        title: 'Titre',
        model: 'Modèle',
        archived: 'Archivée',
        shared: 'Partagée'
      }
    },
    playbooks: {
      title: 'Playbooks CEODigital',
      openCommand: 'CEODigital : Ouvrir les playbooks',
      empty: 'Aucun playbook trouvé pour votre tenant.',
      back: 'Retour aux playbooks',
      detail: 'Détail du playbook',
      run: 'Exécuter le playbook',
      running: 'Exécution…',
      filters: { all: 'Tous', active: 'Actifs', inactive: 'Inactifs' },
      subjectType: 'Type de sujet',
      subjectId: 'Id du sujet',
      runFormTitle: 'Exécuter le playbook',
      runFormSubjectType: 'Type de sujet (obligatoire)',
      runFormSubjectId: 'Id du sujet (facultatif)',
      cancel: 'Annuler',
      runs: 'Exécutions',
      runsEmpty: 'Aucune exécution de ce playbook pour le moment.',
      runStatus: {
        active: 'Active',
        completed: 'Terminée',
        cancelled: 'Annulée'
      },
      headers: { id: 'ID', title: 'Titre', subject: 'Sujet', active: 'Actif' },
      runsHeaders: { id: 'ID', status: 'Statut', subject: 'Sujet', started: 'Démarrée' }
    },
    workflows: {
      title: 'NativeFlows CEODigital',
      openCommand: 'CEODigital : Ouvrir les NativeFlows',
      empty: 'Aucun flux de travail NativeFlow trouvé pour votre tenant.',
      back: 'Retour aux flux de travail',
      detail: 'Détail du flux de travail',
      publish: 'Publier',
      publishing: 'Publication…',
      run: 'Exécuter le flux de travail',
      running: 'Exécution…',
      filters: {
        all: 'Tous',
        draft: 'Brouillon',
        active: 'Actifs',
        archived: 'Archivés'
      },
      triggers: {
        all: 'Tous les déclencheurs',
        manual: 'Manuel',
        webhook: 'Webhook',
        schedule: 'Planifié',
        event: 'Événement',
        api: 'API'
      },
      runInput: 'Entrée (JSON)',
      runInputPlaceholder: '{ "clé": "valeur" }',
      webhooks: 'Webhooks',
      webhooksEmpty: 'Aucun webhook sur ce flux de travail.',
      schedules: 'Planifications',
      schedulesEmpty: 'Aucune planification sur ce flux de travail.',
      runs: 'Exécutions',
      runsEmpty: 'Aucune exécution de ce flux de travail pour le moment.',
      runStatus: {
        active: 'Active',
        completed: 'Terminée',
        cancelled: 'Annulée',
        failed: 'Échouée'
      },
      headers: { id: 'ID', name: 'Nom', status: 'Statut', trigger: 'Déclencheur' },
      runsHeaders: { id: 'ID', status: 'Statut', started: 'Démarrée' },
      webhooksHeaders: { id: 'ID', url: 'URL', active: 'Actif' },
      schedulesHeaders: { id: 'ID', cron: 'Cron', active: 'Actif' },
      actions: {
        rotate: 'Pivoter',
        pausing: 'Mise à jour…',
        pause: 'Pause',
        resume: 'Reprendre',
        rotating: 'Rotation…'
      }
    }
  },
  errors: {
    fetch: 'Impossible de charger les projets CEODigital.',
    general: "L'action a échoué. Réessayez.",
    mcp_not_configured: "Le MCP CEODigital n'est pas configuré. Connectez-le d'abord dans vos paramètres CEODigital.",
    mcp_unreachable: 'CEODigital est injoignable pour le moment. Vérifiez votre connexion et réessayez.',
    tenant_not_found: "Aucun tenant CEODigital n'est associé à ce profil."
  }
}