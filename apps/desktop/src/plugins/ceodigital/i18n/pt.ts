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
  services: {
    catalog: {
      title: 'Catálogo de Serviços',
      empty: 'Ainda não há itens de catálogo de serviços para o teu tenant.',
      searchPlaceholder: 'Pesquisar no catálogo…',
      produces: 'Produz',
      allProduces: 'Todos',
      activeOnly: 'Apenas ativos',
      offerings: 'Oferta',
      offeringsEmpty: 'Não há oferta para este item de catálogo.',
      back: 'Voltar ao catálogo',
      detail: 'Item de catálogo',
      headers: { name: 'Nome', code: 'Código', pricing: 'Preçário', model: 'Modelo' }
    },
    offerings: {
      title: 'Oferta de serviços',
      empty: 'Ainda não há oferta de serviços para o teu tenant.'
    },
    categories: {
      title: 'Categorias de serviços',
      empty: 'Ainda não há categorias de serviços para o teu tenant.'
    },
    proposals: {
      title: 'Propostas CEODigital',
      openCommand: 'CEODigital: Abrir Propostas',
      empty: 'Ainda não há propostas para o teu tenant.',
      new: 'Nova Proposta',
      back: 'Voltar às propostas',
      detail: 'Detalhe da proposta',
      fields: {
        title: 'Título',
        status: 'Estado',
        description: 'Descrição',
        currency: 'Moeda',
        totalValue: 'Valor total',
        paymentModel: 'Modelo de pagamento',
        depositPercentage: 'Percentagem de entrada',
        validUntil: 'Válida até',
        terms: 'Condições',
        leadId: 'Id do lead'
      },
      status: {
        draft: 'Rascunho',
        sent: 'Enviada',
        accepted: 'Aceite',
        rejected: 'Rejeitada',
        cancelled: 'Cancelada',
        expired: 'Expirada',
        pending: 'Pendente'
      },
      actions: {
        send: 'Enviar',
        accept: 'Aceitar',
        reject: 'Rejeitar',
        cancel: 'Cancelar',
        duplicate: 'Duplicar',
        expire: 'Expirar',
        addItem: 'Adicionar linha',
        addTranche: 'Adicionar parcela',
        save: 'Guardar',
        remove: 'Remover',
        sending: 'A enviar…',
        accepting: 'A aceitar…',
        rejecting: 'A rejeitar…',
        cancelling: 'A cancelar…',
        duplicating: 'A duplicar…',
        expiring: 'A expirar…'
      },
      reject: { reasonPlaceholder: 'Motivo (opcional)…', cancel: 'Cancelar' },
      items: {
        headers: {
          description: 'Descrição',
          quantity: 'Qtd',
          unitPrice: 'Preço unitário',
          discount: 'Desconto',
          vatRate: 'IVA %',
          recurrence: 'Recorrência'
        },
        empty: 'Ainda não há linhas nesta proposta.',
        form: {
          serviceCatalogId: 'Id do catálogo de serviços',
          serviceOfferingId: 'Id da oferta',
          quantity: 'Quantidade',
          unitPrice: 'Preço unitário',
          discount: 'Desconto',
          vatRate: 'IVA %',
          recurrence: 'Recorrência',
          description: 'Descrição',
          sortOrder: 'Ordem',
          add: 'Adicionar linha',
          update: 'Atualizar linha',
          cancel: 'Cancelar'
        }
      },
      tranches: {
        headers: { label: 'Rótulo', amount: 'Montante', dueDate: 'Vencimento', sortOrder: 'Ordem' },
        empty: 'Ainda não há parcelas de pagamento nesta proposta.',
        form: {
          label: 'Rótulo',
          amount: 'Montante',
          dueDate: 'Vencimento',
          sortOrder: 'Ordem',
          add: 'Adicionar parcela',
          update: 'Atualizar parcela',
          cancel: 'Cancelar'
        }
      },
      form: {
        title: 'Título',
        leadId: 'Id do lead',
        description: 'Descrição',
        totalValue: 'Valor total',
        paymentModel: 'Modelo de pagamento',
        depositPercentage: 'Percentagem de entrada',
        validUntil: 'Válida até',
        currency: 'Moeda',
        terms: 'Condições',
        create: 'Criar proposta',
        cancel: 'Cancelar'
      },
      errors: {
        create: 'Não foi possível criar a proposta.',
        send: 'Não foi possível enviar a proposta.',
        accept: 'Não foi possível aceitar a proposta.',
        reject: 'Não foi possível rejeitar a proposta.',
        cancel: 'Não foi possível cancelar a proposta.',
        duplicate: 'Não foi possível duplicar a proposta.',
        expire: 'Não foi possível expirar a proposta.',
        addItem: 'Não foi possível adicionar a linha.',
        updateItem: 'Não foi possível atualizar a linha.',
        removeItem: 'Não foi possível remover a linha.',
        addTranche: 'Não foi possível adicionar a parcela.',
        updateTranche: 'Não foi possível atualizar a parcela.',
        removeTranche: 'Não foi possível remover a parcela.',
        fetchProposal: 'Não foi possível carregar esta proposta.',
        general: 'A ação falhou. Tenta novamente.'
      }
    }
  },
  automation: {
    conversations: {
      title: 'Conversas CEODigital',
      openCommand: 'CEODigital: Abrir Conversas',
      empty: 'Ainda não existem conversas de automação para este tenant.',
      search: 'Pesquisar conversas…',
      archivedOnly: 'Apenas arquivadas',
      all: 'Todas',
      new: 'Nova conversa',
      form: {
        title: 'Título',
        titlePlaceholder: 'Título da conversa',
        systemPrompt: 'Prompt do sistema',
        model: 'Modelo',
        workspaceId: 'Id do workspace',
        tags: 'Tags (separadas por vírgula)',
        create: 'Criar conversa',
        cancel: 'Cancelar'
      },
      actions: {
        archive: 'Arquivar',
        share: 'Partilhar',
        unshare: 'Deixar de partilhar',
        archiving: 'A arquivar…',
        sharing: 'A partilhar…'
      },
      headers: {
        id: 'ID',
        title: 'Título',
        model: 'Modelo',
        archived: 'Arquivada',
        shared: 'Partilhada'
      }
    },
    playbooks: {
      title: 'Playbooks CEODigital',
      openCommand: 'CEODigital: Abrir Playbooks',
      empty: 'Ainda não existem playbooks para este tenant.',
      back: 'Voltar aos playbooks',
      detail: 'Detalhe do playbook',
      run: 'Executar playbook',
      running: 'A executar…',
      filters: { all: 'Todos', active: 'Ativos', inactive: 'Inativos' },
      subjectType: 'Tipo de assunto',
      subjectId: 'Id do assunto',
      runFormTitle: 'Executar playbook',
      runFormSubjectType: 'Tipo de assunto (obrigatório)',
      runFormSubjectId: 'Id do assunto (opcional)',
      cancel: 'Cancelar',
      runs: 'Execuções',
      runsEmpty: 'Ainda não existem execuções deste playbook.',
      runStatus: {
        active: 'Ativa',
        completed: 'Concluída',
        cancelled: 'Cancelada'
      },
      headers: { id: 'ID', title: 'Título', subject: 'Assunto', active: 'Ativo' },
      runsHeaders: { id: 'ID', status: 'Estado', subject: 'Assunto', started: 'Iniciada' }
    },
    workflows: {
      title: 'NativeFlows CEODigital',
      openCommand: 'CEODigital: Abrir NativeFlows',
      empty: 'Ainda não existem fluxos de trabalho NativeFlow para este tenant.',
      back: 'Voltar aos fluxos de trabalho',
      detail: 'Detalhe do fluxo de trabalho',
      publish: 'Publicar',
      publishing: 'A publicar…',
      run: 'Executar fluxo de trabalho',
      running: 'A executar…',
      filters: {
        all: 'Todos',
        draft: 'Rascunho',
        active: 'Ativos',
        archived: 'Arquivados'
      },
      triggers: {
        all: 'Todos os acionadores',
        manual: 'Manual',
        webhook: 'Webhook',
        schedule: 'Agendado',
        event: 'Evento',
        api: 'API'
      },
      runInput: 'Entrada (JSON)',
      runInputPlaceholder: '{ "chave": "valor" }',
      webhooks: 'Webhooks',
      webhooksEmpty: 'Sem webhooks neste fluxo de trabalho.',
      schedules: 'Agendamentos',
      schedulesEmpty: 'Sem agendamentos neste fluxo de trabalho.',
      runs: 'Execuções',
      runsEmpty: 'Ainda não existem execuções deste fluxo de trabalho.',
      runStatus: {
        active: 'Ativa',
        completed: 'Concluída',
        cancelled: 'Cancelada',
        failed: 'Falhou'
      },
      headers: { id: 'ID', name: 'Nome', status: 'Estado', trigger: 'Acionador' },
      runsHeaders: { id: 'ID', status: 'Estado', started: 'Iniciada' },
      webhooksHeaders: { id: 'ID', url: 'URL', active: 'Ativo' },
      schedulesHeaders: { id: 'ID', cron: 'Cron', active: 'Ativo' },
      actions: {
        rotate: 'Rodar chave',
        pausing: 'A atualizar…',
        pause: 'Pausar',
        resume: 'Retomar',
        rotating: 'A rodar chave…'
      }
    }
  },
  errors: {
    fetch: 'Não foi possível carregar os projetos CEODigital.',
    general: 'A ação falhou. Tenta novamente.',
    mcp_not_configured: 'O MCP do CEODigital não está configurado. Liga-o nas definições CEODigital primeiro.',
    mcp_unreachable: 'O CEODigital está inacessível de momento. Verifica a ligação e tenta novamente.',
    tenant_not_found: 'Nenhum tenant CEODigital está associado a este perfil.'
  }
}