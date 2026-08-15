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
  errors: {
    fetch: 'Impossible de charger les projets CEODigital.',
    mcp_not_configured: "Le MCP CEODigital n'est pas configuré. Connectez-le d'abord dans vos paramètres CEODigital.",
    mcp_unreachable: 'CEODigital est injoignable pour le moment. Vérifiez votre connexion et réessayez.',
    tenant_not_found: "Aucun tenant CEODigital n'est associé à ce profil."
  }
}