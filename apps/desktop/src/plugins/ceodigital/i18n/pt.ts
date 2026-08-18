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
  workitems: {
    title: 'Workitems CEODigital',
    empty: 'Ainda não há workitems para o teu tenant.',
    openCommand: 'CEODigital: Abrir Workitems',
    filters: {
      all: 'Todos',
      mine: 'Meus',
      dueSoon: 'Previstos em breve',
      awaitingApproval: 'A aguardar aprovação'
    },
    toolbar: {
      new: 'Novo Work Item',
      suggest: 'Sugerir',
      suggestPlaceholder: 'Descreve o que precisas…',
      suggestRun: 'Encontrar SOPs correspondentes',
      suggestEmpty: 'Nenhum SOP correspondeu a esta intenção.'
    },
    form: {
      title: 'Título',
      subjectType: 'Tipo de assunto',
      subjectTypePlaceholder: 'project, deal, lead…',
      description: 'Descrição',
      due: 'Previsto para',
      create: 'Criar work item',
      cancel: 'Cancelar'
    },
    actions: {
      run: 'Executar',
      assign: 'Atribuir',
      submitOutput: 'Submeter saída',
      running: 'A executar…',
      assigning: 'A atribuir…',
      submitting: 'A submeter…'
    },
    assign: {
      title: 'Atribuir',
      add: 'Adicionar (ids de utilizadores)',
      remove: 'Remover (ids de utilizadores)',
      role: 'Função',
      save: 'Guardar atribuição',
      empty: 'Sem utilizadores para mostrar.'
    },
    submit: {
      title: 'Submeter saída',
      runId: 'Id do run',
      output: 'Saída (JSON)',
      notes: 'Notas',
      send: 'Submeter'
    },
    checklist: {
      title: 'Checklist',
      itemLabel: 'Id do item da checklist',
      doneLabel: 'Concluído',
      toggle: 'Alternar',
      empty: 'Nenhum item de checklist fornecido para este work item.'
    },
    errors: {
      create: 'Não foi possível criar o work item.',
      run: 'Não foi possível executar o work item.',
      assign: 'Não foi possível atualizar a atribuição.',
      submit: 'Não foi possível submeter a saída.',
      checklist: 'Não foi possível alternar o item da checklist.',
      suggest: 'Não foi possível obter as sugestões de SOP.',
      general: 'A ação falhou. Tenta novamente.'
    }
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
    persons: {
      title: 'Pessoas CEODigital',
      empty: 'Ainda não há pessoas de CRM para o teu tenant.',
      headers: {
        email: 'Email',
        org: 'Organização'
      }
    },
    organizations: {
      title: 'Organizações CEODigital',
      empty: 'Ainda não há organizações de CRM para o teu tenant.',
      headers: {
        industry: 'Indústria'
      }
    },
    pipelines: {
      title: 'Pipelines CEODigital',
      empty: 'Ainda não há pipelines de CRM para o teu tenant.',
      headers: {
        subject: 'Assunto',
        stages: 'Etapas'
      }
    },
    stages: {
      title: 'Etapas CEODigital',
      empty: 'Ainda não há etapas de CRM para o teu tenant.',
      headers: {
        probability: 'Probabilidade',
        won: 'Ganha'
      }
    },
    activities: {
      title: 'Atividades CEODigital',
      empty: 'Ainda não há atividades de CRM para o teu tenant.',
      headers: {
        kind: 'Tipo',
        created: 'Criada em'
      }
    },
    categories: {
      title: 'Categorias CEODigital',
      empty: 'Ainda não há categorias de CRM para o teu tenant.',
      headers: {
        slug: 'Slug',
        active: 'Ativa'
      }
    },
    headers: {
      id: 'ID',
      title: 'Título',
      status: 'Estado',
      value: 'Valor'
    },
    unassigned: 'Sem responsável'
  },
  agents: {
    title: 'Agentes CEODigital',
    empty: 'Ainda não há CEO agents para o teu tenant.',
    headers: {
      name: 'Nome',
      slug: 'Slug',
      status: 'Estado',
      exposed: 'Expôr como MCP'
    },
    workflows: {
      title: 'NativeFlows',
      empty: 'Ainda não há workflows NativeFlow para o teu tenant.',
      headers: {
        name: 'Nome',
        status: 'Estado',
        trigger: 'Disparador'
      }
    },
    runs: {
      title: 'Debrief do run',
      empty: 'Ainda não há runs. Executa um agente para ver aqui o debrief.',
      runBtn: 'Executar agente',
      promptPlaceholder: 'O que deve o agente fazer?',
      executing: 'A executar…',
      runCompleted: 'Concluído',
      runFailed: 'Falhou',
      runPaused: 'Em pausa (necessita aprovação)',
      headers: {
        id: 'Run',
        status: 'Estado',
        started: 'Iniciado em'
      },
      viewSteps: 'Ver passos',
      hideSteps: 'Ocultar passos',
      steps: 'Passos'
    },
    schedules: {
      title: 'Agendamentos de agentes',
      empty: 'Não há agendamentos autónomos de agentes para este tenant.',
      headers: {
        name: 'Nome',
        cron: 'Cron',
        active: 'Ativo',
        lastRun: 'Último run'
      }
    },
    pending: {
      title: 'Aprovações pendentes',
      empty: 'Não há aprovações HITL pendentes.',
      headers: {
        tool: 'Ferramenta',
        run: 'Run',
        status: 'Estado'
      },
      goToTenant: 'Abrir aprovações'
    }
  },
  errors: {
    fetch: 'Não foi possível carregar os projetos CEODigital.',
    mcp_not_configured: 'O MCP do CEODigital não está configurado. Liga-o nas definições CEODigital primeiro.',
    mcp_unreachable: 'O CEODigital está inacessível de momento. Verifica a ligação e tenta novamente.',
    tenant_not_found: 'Nenhum tenant CEODigital está associado a este perfil.'
  }
}