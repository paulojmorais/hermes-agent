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
  documents: {
    files: {
      title: 'Documents CEODigital',
      openCommand: 'CEODigital : Ouvrir les documents',
      empty: 'Aucun fichier de documents trouvé pour votre tenant.',
      searchPlaceholder: 'Rechercher dans la bibliothèque…',
      namespacePlaceholder: 'Tous les espaces de noms',
      allNamespaces: 'Tous les espaces de noms',
      visibility: 'Visibilité',
      allVisibilities: 'Toutes les visibilités',
      upload: 'Envoyer un fichier',
      uploadForm: {
        name: 'Nom',
        namePlaceholder: 'Nom du fichier',
        file: 'Choisir un fichier',
        namespace: 'Espace de noms',
        collection: 'Collection',
        submit: 'Envoyer',
        cancel: 'Annuler'
      },
      moveForm: {
        title: 'Déplacer le fichier',
        targetNamespace: 'Espace de noms cible',
        targetCollection: 'Collection cible',
        none: 'Aucune (retirer de la collection)',
        submit: 'Déplacer',
        cancel: 'Annuler'
      },
      addToCollectionForm: {
        title: 'Ajouter à la collection',
        collection: 'Collection',
        submit: 'Ajouter',
        cancel: 'Annuler'
      },
      actions: {
        move: 'Déplacer',
        delete: 'Supprimer',
        deleteConfirm: 'Supprimer le fichier',
        addToCollection: 'Ajouter à la collection',
        moving: 'Déplacement…',
        deleting: 'Suppression…',
        adding: 'Ajout…'
      },
      headers: {
        id: 'ID',
        title: 'Titre',
        namespace: 'Espace de noms',
        visibility: 'Visibilité',
        mime: 'MIME'
      },
      rag: {
        placeholder: 'Rechercher des documents…',
        search: 'Rechercher',
        searching: 'Recherche…',
        empty: 'Aucun document envoyé pour le moment.',
        maxResults: 'Max de résultats',
        resultsEmpty: 'Aucun document ne correspond à votre recherche.',
        reindex: 'Réindexer',
        reindexing: 'Réindexation…',
        reindexDone: 'Réindexation lancée.'
      },
      errors: {
        list: 'Impossible de charger la bibliothèque de documents.',
        upload: 'Impossible d’envoyer le fichier.',
        delete: 'Impossible de supprimer le fichier.',
        move: 'Impossible de déplacer le fichier.',
        addToCollection: 'Impossible d’ajouter le fichier à la collection.',
        search: 'Impossible de rechercher des documents.',
        reindex: 'Impossible de lancer la réindexation.',
        general: 'L’action a échoué. Réessayez.'
      }
    },
    collections: {
      title: 'Collections CEODigital',
      openCommand: 'CEODigital : Ouvrir les collections',
      empty: 'Aucune collection de documents trouvée pour votre tenant.',
      new: 'Nouvelle collection',
      createForm: {
        name: 'Nom',
        namePlaceholder: 'Nom de la collection',
        description: 'Description',
        color: 'Couleur',
        icon: 'Icône',
        parentId: 'Id de la collection parente',
        create: 'Créer la collection',
        cancel: 'Annuler'
      },
      members: 'Membres',
      addFile: 'Ajouter un fichier',
      addFilePlaceholder: 'Ajouter un fichier par identifiant…',
      removeFile: 'Retirer',
      noMembers: 'Aucun fichier dans cette collection pour le moment.',
      headers: { id: 'ID', title: 'Titre', description: 'Description', members: 'Membres' },
      errors: {
        list: 'Impossible de charger les collections.',
        create: 'Impossible de créer la collection.',
        addFile: 'Impossible d’ajouter le fichier.',
        removeFile: 'Impossible de retirer le fichier.',
        general: 'L’action a échoué. Réessayez.'
      }
    },
    bindings: {
      title: 'Liaisons CEODigital',
      openCommand: 'CEODigital : Ouvrir les liaisons',
      empty: 'Aucune liaison de document ne correspond à ce filtre.',
      entityType: 'Type d’entité',
      entityTypePlaceholder: 'project, task, crm_org…',
      entityId: 'Id de l’entité',
      entityIdPlaceholder: 'Id de l’entité (obligatoire)',
      direction: 'Direction',
      allDirections: 'Toutes les directions',
      input: 'Entrée',
      output: 'Sortie',
      attach: 'Lier un document',
      attachForm: {
        entityType: 'Type d’entité',
        entityTypePlaceholder: 'project, task, crm_org, crm_deal, service_impl, chat_conv',
        entityId: 'Id de l’entité',
        entityIdPlaceholder: 'Id de l’entité (obligatoire)',
        direction: 'Direction',
        bindingId: 'Id de liaison',
        bindingIdPlaceholder: 'Id de liaison (obligatoire)',
        targetRef: 'Réf. cible (JSON)',
        syncMode: 'Mode de synchronisation',
        publishMode: 'Mode de publication',
        ragIndex: 'Index RAG',
        outputFormat: 'Format de sortie',
        nameTemplate: 'Modèle de nom',
        submit: 'Lier',
        cancel: 'Annuler'
      },
      detach: 'Délier',
      detaching: 'Dissociation…',
      headers: {
        id: 'ID',
        entity: 'Entité',
        direction: 'Direction',
        binding: 'Liaison',
        sync: 'Sync',
        publish: 'Publication',
        rag: 'RAG',
        output: 'Sortie'
      },
      errors: {
        list: 'Impossible de charger les liaisons.',
        attach: 'Impossible de lier le document.',
        detach: 'Impossible de délier le document.',
        general: 'L’action a échoué. Réessayez.'
      }
    }
  },
  messaging: {
    title: 'Messagerie CEODigital',
    openCommand: 'CEODigital : Ouvrir la messagerie',
    empty: 'Aucun fil de discussion trouvé pour votre tenant.',
    newThread: 'Nouveau fil',
    allTypes: 'Tous les types',
    threadType: 'Type de fil',
    refTable: 'Table de référence',
    refId: 'Id de référence',
    back: 'Retour aux fils',
    detail: 'Détail du fil',
    messagesEmpty: 'Aucun message dans ce fil.',
    postPlaceholder: 'Écrire un message…',
    emojiPlaceholder: 'Emoji',
    fileId: 'Id du fichier',
    attachmentName: 'Nom de la pièce jointe',
    headers: { id: 'ID', title: 'Titre', type: 'Type', created: 'Créé' },
    form: {
      subject: 'Objet',
      subjectPlaceholder: 'Objet du fil',
      create: 'Créer le fil',
      cancel: 'Annuler'
    },
    actions: {
      post: 'Envoyer',
      react: 'Réagir',
      markRead: 'Marquer lu',
      uploadAttachment: 'Joindre',
      posting: 'Envoi…',
      reacting: 'Réaction…',
      uploading: 'Téléversement…'
    },
    errors: {
      list: 'Impossible de charger les fils de discussion.',
      create: 'Impossible de créer le fil.',
      post: "Impossible d'envoyer le message.",
      react: 'Impossible de réagir au message.',
      markRead: 'Impossible de marquer le message comme lu.',
      upload: 'Impossible de joindre le fichier.',
      fetchMessages: 'Impossible de charger les messages.',
      fetchThread: 'Impossible de charger ce fil.',
      general: 'L’action a échoué. Réessayez.'
    }
  },
  notifications: {
    title: 'Notifications CEODigital',
    openCommand: 'CEODigital : Ouvrir les notifications',
    empty: 'Aucune notification pour le moment.',
    all: 'Toutes',
    unreadOnly: 'Non lues',
    unreadCount: 'Non lues',
    markAllRead: 'Tout marquer lu',
    markRead: 'Lire',
    marking: 'Marquage…',
    headers: { id: 'ID', title: 'Titre', type: 'Type', created: 'Créé' },
    errors: {
      list: 'Impossible de charger vos notifications.',
      markRead: 'Impossible de marquer la notification comme lue.',
      markAll: 'Impossible de marquer toutes les notifications comme lues.',
      general: 'L’action a échoué. Réessayez.'
    }
  },
  timeline: {
    title: 'Chronologie CEODigital',
    openCommand: 'CEODigital : Ouvrir la chronologie',
    empty: 'Aucun événement de chronologie trouvé pour votre tenant.',
    entityType: 'Type d’entité',
    entityId: 'Id d’entité',
    actorUserId: 'Id de l’acteur',
    eventGlob: 'Glob d’événement',
    pin: 'Épingler',
    unpin: 'Désépingler',
    addReaction: 'Réagir',
    removeReaction: 'Retirer',
    reactions: 'Réactions',
    headers: { id: 'ID', event: 'Événement', entity: 'Entité', actor: 'Acteur', at: 'À' },
    actions: {
      pinning: 'Épinglage…',
      unpinning: 'Désépinglage…',
      reacting: 'Réaction…'
    },
    errors: {
      list: 'Impossible de charger les événements de la chronologie.',
      pin: 'Impossible d’épingler l’événement.',
      unpin: 'Impossible de désépingler l’événement.',
      addReaction: 'Impossible d’ajouter la réaction.',
      removeReaction: 'Impossible de retirer la réaction.',
      general: 'L’action a échoué. Réessayez.'
    }
  },
  implementations: {
    title: 'Implémentations CEODigital',
    openCommand: 'CEODigital : Ouvrir les implémentations',
    empty: 'Aucun projet d’implémentation trouvé pour votre tenant.',
    search: 'Rechercher des projets…',
    allStatuses: 'Tous les statuts',
    status: 'Statut',
    clientVisible: 'Visible client',
    back: 'Retour aux projets',
    detail: 'Détail du projet',
    phases: 'Phases',
    phasesEmpty: 'Aucune phase sur ce projet.',
    files: 'Fichiers',
    filesEmpty: 'Aucun fichier sur ce projet.',
    messages: 'Messages',
    messagesEmpty: 'Aucun message sur ce projet.',
    changeStatus: 'Changer le statut',
    complete: 'Terminer',
    completing: 'Finalisation…',
    cancel: 'Annuler',
    cancelling: 'Annulation…',
    postMessage: 'Publier un message',
    messagePlaceholder: 'Écrire un message…',
    posting: 'Publication…',
    projectStatus: {
      planned: 'Planifié',
      in_progress: 'En cours',
      on_hold: 'En attente',
      delivered: 'Livré',
      cancelled: 'Annulé'
    },
    phaseStatus: {
      planned: 'Planifiée',
      in_progress: 'En cours',
      done: 'Terminée',
      cancelled: 'Annulée'
    },
    headers: { id: 'ID', title: 'Titre', status: 'Statut', clientVisible: 'Client' },
    phaseHeaders: { id: 'ID', title: 'Titre', status: 'Statut' },
    fileHeaders: { id: 'ID', name: 'Nom', size: 'Taille' },
    errors: {
      list: 'Impossible de charger les projets d’implémentation.',
      fetchProject: 'Impossible de charger ce projet.',
      changeStatus: 'Impossible de changer le statut du projet.',
      complete: 'Impossible de terminer le projet.',
      cancel: 'Impossible d’annuler le projet.',
      changePhaseStatus: 'Impossible de changer le statut de la phase.',
      fetchPhases: 'Impossible de charger les phases.',
      fetchFiles: 'Impossible de charger les fichiers.',
      fetchMessages: 'Impossible de charger les messages.',
      postMessage: 'Impossible de publier le message.',
      general: 'L’action a échoué. Réessayez.'
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