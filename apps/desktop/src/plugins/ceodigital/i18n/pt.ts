import type { CeodigitalMessages } from '.'

/** European-Portuguese bundle (pt-PT). */
export const pt: CeodigitalMessages = {
  nav: { label: 'CEODigital' },
  page: {
    title: 'Projetos CEODigital',
    empty: 'Ainda não há projetos para o teu tenant.',
    openCommand: 'CEODigital: Abrir Projetos'
  },
  workitem: {
    status: {
      backlog: 'Backlog',
      ready: 'Pronto',
      running: 'Em execução',
      review: 'Revisão',
      blocked: 'Bloqueado',
      done: 'Concluído',
      failed: 'Falhado',
      archived: 'Arquivado'
    },
    headers: {
      id: 'ID',
      title: 'Título',
      status: 'Estado',
      assignee: 'Responsável',
      updated: 'Atualizado em'
    },
    unassigned: 'Sem responsável'
  },
  crm: {
    leads: {
      title: 'Leads CEODigital',
      empty: 'Ainda não há leads de CRM para o teu tenant.'
    },
    deals: {
      title: 'Negócios CEODigital',
      empty: 'Ainda não há negócios de CRM para o teu tenant.'
    },
    headers: {
      id: 'ID',
      title: 'Título',
      status: 'Estado',
      value: 'Valor'
    },
    unassigned: 'Sem responsável'
  },
  errors: {
    fetch: 'Não foi possível carregar os projetos CEODigital.',
    mcp_not_configured: 'O MCP do CEODigital não está configurado. Liga-o nas definições CEODigital primeiro.',
    mcp_unreachable: 'O CEODigital está inacessível de momento. Verifica a ligação e tenta novamente.',
    tenant_not_found: 'Nenhum tenant CEODigital está associado a este perfil.'
  }
}