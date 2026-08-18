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
  documents: {
    files: {
      title: 'Documentos CEODigital',
      openCommand: 'CEODigital: Abrir Documentos',
      empty: 'Ainda não existem ficheiros de documentos para este tenant.',
      searchPlaceholder: 'Pesquisar na biblioteca…',
      namespacePlaceholder: 'Todos os namespaces',
      allNamespaces: 'Todos os namespaces',
      visibility: 'Visibilidade',
      allVisibilities: 'Todas as visibilidades',
      upload: 'Carregar ficheiro',
      uploadForm: {
        name: 'Nome',
        namePlaceholder: 'Nome do ficheiro',
        file: 'Escolher ficheiro',
        namespace: 'Namespace',
        collection: 'Coleção',
        submit: 'Carregar',
        cancel: 'Cancelar'
      },
      moveForm: {
        title: 'Mover ficheiro',
        targetNamespace: 'Namespace de destino',
        targetCollection: 'Coleção de destino',
        none: 'Nenhuma (remover da coleção)',
        submit: 'Mover',
        cancel: 'Cancelar'
      },
      addToCollectionForm: {
        title: 'Adicionar à coleção',
        collection: 'Coleção',
        submit: 'Adicionar',
        cancel: 'Cancelar'
      },
      actions: {
        move: 'Mover',
        delete: 'Eliminar',
        deleteConfirm: 'Eliminar ficheiro',
        addToCollection: 'Adicionar à coleção',
        moving: 'A mover…',
        deleting: 'A eliminar…',
        adding: 'A adicionar…'
      },
      headers: {
        id: 'ID',
        title: 'Título',
        namespace: 'Namespace',
        visibility: 'Visibilidade',
        mime: 'MIME'
      },
      rag: {
        placeholder: 'Pesquisar documentos…',
        search: 'Pesquisar',
        searching: 'A pesquisar…',
        empty: 'Ainda não existem documentos carregados.',
        maxResults: 'Máx. de resultados',
        resultsEmpty: 'Nenhum documento corresponde à pesquisa.',
        reindex: 'Reindexar',
        reindexing: 'A reindexar…',
        reindexDone: 'Reindexação iniciada.'
      },
      errors: {
        list: 'Não foi possível carregar a biblioteca de documentos.',
        upload: 'Não foi possível carregar o ficheiro.',
        delete: 'Não foi possível eliminar o ficheiro.',
        move: 'Não foi possível mover o ficheiro.',
        addToCollection: 'Não foi possível adicionar o ficheiro à coleção.',
        search: 'Não foi possível pesquisar documentos.',
        reindex: 'Não foi possível iniciar a reindexação.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    collections: {
      title: 'Coleções CEODigital',
      openCommand: 'CEODigital: Abrir Coleções',
      empty: 'Ainda não existem coleções de documentos para este tenant.',
      new: 'Nova coleção',
      createForm: {
        name: 'Nome',
        namePlaceholder: 'Nome da coleção',
        description: 'Descrição',
        color: 'Cor',
        icon: 'Ícone',
        parentId: 'Id da coleção-mãe',
        create: 'Criar coleção',
        cancel: 'Cancelar'
      },
      members: 'Membros',
      addFile: 'Adicionar ficheiro',
      addFilePlaceholder: 'Adicionar um ficheiro por id…',
      removeFile: 'Remover',
      noMembers: 'Ainda não existem ficheiros nesta coleção.',
      headers: { id: 'ID', title: 'Título', description: 'Descrição', members: 'Membros' },
      errors: {
        list: 'Não foi possível carregar as coleções.',
        create: 'Não foi possível criar a coleção.',
        addFile: 'Não foi possível adicionar o ficheiro.',
        removeFile: 'Não foi possível remover o ficheiro.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    bindings: {
      title: 'Ligações CEODigital',
      openCommand: 'CEODigital: Abrir Ligações',
      empty: 'Nenhuma ligação de documento corresponde ao filtro.',
      entityType: 'Tipo de entidade',
      entityTypePlaceholder: 'project, task, crm_org…',
      entityId: 'Id da entidade',
      entityIdPlaceholder: 'Id da entidade (obrigatório)',
      direction: 'Direção',
      allDirections: 'Todas as direções',
      input: 'Entrada',
      output: 'Saída',
      attach: 'Ligar documento',
      attachForm: {
        entityType: 'Tipo de entidade',
        entityTypePlaceholder: 'project, task, crm_org, crm_deal, service_impl, chat_conv',
        entityId: 'Id da entidade',
        entityIdPlaceholder: 'Id da entidade (obrigatório)',
        direction: 'Direção',
        bindingId: 'Id da ligação',
        bindingIdPlaceholder: 'Id da ligação (obrigatório)',
        targetRef: 'Ref de destino (JSON)',
        syncMode: 'Modo de sincronização',
        publishMode: 'Modo de publicação',
        ragIndex: 'Índice RAG',
        outputFormat: 'Formato de saída',
        nameTemplate: 'Modelo de nome',
        submit: 'Ligar',
        cancel: 'Cancelar'
      },
      detach: 'Desligar',
      detaching: 'A desligar…',
      headers: {
        id: 'ID',
        entity: 'Entidade',
        direction: 'Direção',
        binding: 'Ligação',
        sync: 'Sync',
        publish: 'Publicação',
        rag: 'RAG',
        output: 'Saída'
      },
      errors: {
        list: 'Não foi possível carregar as ligações.',
        attach: 'Não foi possível ligar o documento.',
        detach: 'Não foi possível desligar o documento.',
        general: 'A ação falhou. Tenta novamente.'
      }
    }
  },
  messaging: {
    title: 'Mensagens CEODigital',
    openCommand: 'CEODigital: Abrir Mensagens',
    empty: 'Ainda não existem fios de mensagens para este tenant.',
    newThread: 'Novo fio',
    allTypes: 'Todos os tipos',
    threadType: 'Tipo de fio',
    refTable: 'Tabela de referência',
    refId: 'Id de referência',
    back: 'Voltar aos fios',
    detail: 'Detalhe do fio',
    messagesEmpty: 'Ainda não existem mensagens neste fio.',
    postPlaceholder: 'Escreve uma mensagem…',
    emojiPlaceholder: 'Emoji',
    fileId: 'Id do ficheiro',
    attachmentName: 'Nome do anexo',
    headers: { id: 'ID', title: 'Título', type: 'Tipo', created: 'Criado' },
    form: {
      subject: 'Assunto',
      subjectPlaceholder: 'Assunto do fio',
      create: 'Criar fio',
      cancel: 'Cancelar'
    },
    actions: {
      post: 'Enviar',
      react: 'Reagir',
      markRead: 'Marcar como lida',
      uploadAttachment: 'Anexar',
      posting: 'A enviar…',
      reacting: 'A reagir…',
      uploading: 'A carregar…'
    },
    errors: {
      list: 'Não foi possível carregar os fios de mensagens.',
      create: 'Não foi possível criar o fio.',
      post: 'Não foi possível enviar a mensagem.',
      react: 'Não foi possível reagir à mensagem.',
      markRead: 'Não foi possível marcar a mensagem como lida.',
      upload: 'Não foi possível anexar o ficheiro.',
      fetchMessages: 'Não foi possível carregar as mensagens.',
      fetchThread: 'Não foi possível carregar este fio.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  notifications: {
    title: 'Notificações CEODigital',
    openCommand: 'CEODigital: Abrir Notificações',
    empty: 'Não tens notificações neste momento.',
    all: 'Todas',
    unreadOnly: 'Não lidas',
    unreadCount: 'Não lidas',
    markAllRead: 'Marcar todas como lidas',
    markRead: 'Marcar como lida',
    marking: 'A marcar…',
    headers: { id: 'ID', title: 'Título', type: 'Tipo', created: 'Criada' },
    errors: {
      list: 'Não foi possível carregar as notificações.',
      markRead: 'Não foi possível marcar a notificação como lida.',
      markAll: 'Não foi possível marcar todas as notificações como lidas.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  timeline: {
    title: 'Linha do tempo CEODigital',
    openCommand: 'CEODigital: Abrir Linha do tempo',
    empty: 'Ainda não existem eventos na linha do tempo para este tenant.',
    entityType: 'Tipo de entidade',
    entityId: 'Id da entidade',
    actorUserId: 'Id do ator',
    eventGlob: 'Glob de evento',
    pin: 'Afixar',
    unpin: 'Desafixar',
    addReaction: 'Reagir',
    removeReaction: 'Remover',
    reactions: 'Reações',
    headers: { id: 'ID', event: 'Evento', entity: 'Entidade', actor: 'Ator', at: 'Em' },
    actions: {
      pinning: 'A afixar…',
      unpinning: 'A desafixar…',
      reacting: 'A reagir…'
    },
    errors: {
      list: 'Não foi possível carregar os eventos da linha do tempo.',
      pin: 'Não foi possível afixar o evento.',
      unpin: 'Não foi possível desafixar o evento.',
      addReaction: 'Não foi possível adicionar a reação.',
      removeReaction: 'Não foi possível remover a reação.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  implementations: {
    title: 'Implementações CEODigital',
    openCommand: 'CEODigital: Abrir Implementações',
    empty: 'Ainda não existem projetos de implementação para este tenant.',
    search: 'Pesquisar projetos…',
    allStatuses: 'Todos os estados',
    status: 'Estado',
    clientVisible: 'Visível ao cliente',
    back: 'Voltar aos projetos',
    detail: 'Detalhe do projeto',
    phases: 'Fases',
    phasesEmpty: 'Ainda não existem fases neste projeto.',
    files: 'Ficheiros',
    filesEmpty: 'Ainda não existem ficheiros neste projeto.',
    messages: 'Mensagens',
    messagesEmpty: 'Ainda não existem mensagens neste projeto.',
    changeStatus: 'Alterar estado',
    complete: 'Concluir',
    completing: 'A concluir…',
    cancel: 'Cancelar',
    cancelling: 'A cancelar…',
    postMessage: 'Publicar mensagem',
    messagePlaceholder: 'Escreve uma mensagem…',
    posting: 'A publicar…',
    projectStatus: {
      planned: 'Planeado',
      in_progress: 'Em curso',
      on_hold: 'Em espera',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    },
    phaseStatus: {
      planned: 'Planeada',
      in_progress: 'Em curso',
      done: 'Concluída',
      cancelled: 'Cancelada'
    },
    headers: { id: 'ID', title: 'Título', status: 'Estado', clientVisible: 'Cliente' },
    phaseHeaders: { id: 'ID', title: 'Título', status: 'Estado' },
    fileHeaders: { id: 'ID', name: 'Nome', size: 'Tamanho' },
    errors: {
      list: 'Não foi possível carregar os projetos de implementação.',
      fetchProject: 'Não foi possível carregar este projeto.',
      changeStatus: 'Não foi possível alterar o estado do projeto.',
      complete: 'Não foi possível concluir o projeto.',
      cancel: 'Não foi possível cancelar o projeto.',
      changePhaseStatus: 'Não foi possível alterar o estado da fase.',
      fetchPhases: 'Não foi possível carregar as fases.',
      fetchFiles: 'Não foi possível carregar os ficheiros.',
      fetchMessages: 'Não foi possível carregar as mensagens.',
      postMessage: 'Não foi possível publicar a mensagem.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  workspaces: {
    title: 'Espaços de trabalho CEODigital',
    openCommand: 'CEODigital: Abrir Espaços de Trabalho',
    empty: 'Ainda não há espaços de trabalho para o teu tenant.',
    new: 'Novo espaço de trabalho',
    search: 'Procurar espaços de trabalho…',
    archivedOnly: 'Apenas arquivados',
    all: 'Todos',
    back: 'Voltar aos espaços de trabalho',
    detail: 'Detalhe do espaço de trabalho',
    members: 'Membros',
    membersEmpty: 'Este espaço de trabalho ainda não tem membros.',
    role: 'Função',
    allRoles: 'Todas as funções',
    memberRoles: { lead: 'Responsável', member: 'Membro', viewer: 'Visualizador' },
    addMember: 'Adicionar membro',
    addMemberPlaceholder: 'Adiciona um membro por id de utilizador…',
    removeMember: 'Remover',
    adding: 'A adicionar…',
    removing: 'A remover…',
    createForm: {
      name: 'Nome',
      namePlaceholder: 'Nome do espaço de trabalho',
      description: 'Descrição',
      categoryId: 'Id da categoria',
      icon: 'Ícone',
      color: 'Cor',
      create: 'Criar espaço de trabalho',
      cancel: 'Cancelar'
    },
    headers: { id: 'ID', title: 'Título', description: 'Descrição', members: 'Membros' },
    memberHeaders: { id: 'ID', name: 'Nome', role: 'Função' },
    errors: {
      list: 'Não foi possível carregar os espaços de trabalho.',
      create: 'Não foi possível criar o espaço de trabalho.',
      addMember: 'Não foi possível adicionar o membro.',
      removeMember: 'Não foi possível remover o membro.',
      fetchMembers: 'Não foi possível carregar os membros.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  departments: {
    title: 'Departamentos CEODigital',
    openCommand: 'CEODigital: Abrir Departamentos',
    empty: 'Ainda não há departamentos para o teu tenant.',
    new: 'Novo departamento',
    search: 'Procurar departamentos…',
    activeOnly: 'Apenas ativos',
    all: 'Todos',
    back: 'Voltar aos departamentos',
    detail: 'Detalhe do departamento',
    members: 'Membros',
    membersEmpty: 'Este departamento ainda não tem membros.',
    role: 'Função',
    allRoles: 'Todas as funções',
    memberRoles: { head: 'Chefe', member: 'Membro' },
    addMember: 'Adicionar membro',
    addMemberPlaceholder: 'Adiciona um membro por id de utilizador…',
    removeMember: 'Remover',
    adding: 'A adicionar…',
    removing: 'A remover…',
    createForm: {
      name: 'Nome',
      namePlaceholder: 'Nome do departamento',
      slugKey: 'Chave de slug',
      slugKeyPlaceholder: 'ex.: engenharia',
      areas: 'Áreas (separadas por vírgula)',
      areasPlaceholder: 'Design, Backend, …',
      headId: 'Chefe (id de utilizador)',
      headIdPlaceholder: 'Id de utilizador do chefe do departamento',
      create: 'Criar departamento',
      cancel: 'Cancelar'
    },
    headers: { id: 'ID', title: 'Título', slug: 'Slug', areas: 'Áreas', active: 'Ativo' },
    memberHeaders: { id: 'ID', name: 'Nome', role: 'Função' },
    actions: { remove: 'Remover' },
    errors: {
      list: 'Não foi possível carregar os departamentos.',
      create: 'Não foi possível criar o departamento.',
      addMember: 'Não foi possível adicionar o membro.',
      removeMember: 'Não foi possível remover o membro.',
      fetchMembers: 'Não foi possível carregar os membros.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  members: {
    title: 'Membros CEODigital',
    openCommand: 'CEODigital: Abrir Membros',
    empty: 'Ainda não há membros para o teu tenant.',
    invite: 'Convidar membro',
    allRoles: 'Todas as funções',
    role: 'Função',
    inviteForm: {
      email: 'Email',
      emailPlaceholder: 'membro@empresa.com',
      role: 'Função',
      create: 'Enviar convite',
      cancel: 'Cancelar'
    },
    revoke: 'Revogar',
    revoking: 'A revogar…',
    updateRole: 'Atualizar função',
    updating: 'A atualizar…',
    headers: { id: 'ID', name: 'Nome', email: 'Email', role: 'Função' },
    errors: {
      list: 'Não foi possível carregar os membros.',
      invite: 'Não foi possível convidar o membro.',
      revoke: 'Não foi possível revogar o membro.',
      updateRole: 'Não foi possível atualizar a função.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  integrations: {
    title: 'Integrações CEODigital',
    openCommand: 'CEODigital: Abrir Integrações',
    empty: 'Ainda não há integrações ligadas.',
    connect: 'Ligar integração',
    allProviders: 'Todos os fornecedores',
    allStatuses: 'Todos os estados',
    allScopes: 'Todos os âmbitos',
    providerCode: 'Fornecedor',
    status: 'Estado',
    scope: 'Âmbito',
    scopes: { user: 'Utilizador', tenant: 'Tenant' },
    statuses: { pending: 'Pendente', active: 'Ativo', error: 'Erro', revoked: 'Revogado' },
    connectForm: {
      providerCode: 'Código do fornecedor',
      providerCodePlaceholder: 'ex.: gmail',
      appSlug: 'Slug da aplicação',
      appSlugPlaceholder: 'ex.: gmail',
      scope: 'Âmbito',
      mailboxKey: 'Chave de mailbox',
      mailboxKeyPlaceholder: 'ex.: default',
      mailboxLabel: 'Etiqueta do mailbox',
      mailboxLabelPlaceholder: 'Nome apresentado para esta caixa',
      connect: 'Ligar',
      cancel: 'Cancelar'
    },
    test: 'Testar',
    testing: 'A testar…',
    disconnect: 'Desligar',
    disconnecting: 'A desligar…',
    detail: 'Detalhe da integração',
    back: 'Voltar às integrações',
    headers: { id: 'ID', provider: 'Fornecedor', app: 'Aplicação', status: 'Estado', scope: 'Âmbito', mailbox: 'Mailbox' },
    errors: {
      list: 'Não foi possível carregar as integrações.',
      connect: 'Não foi possível ligar a integração.',
      test: 'Não foi possível testar a integração.',
      disconnect: 'Não foi possível desligar a integração.',
      fetchIntegration: 'Não foi possível carregar esta integração.',
      general: 'A ação falhou. Tenta novamente.'
    }
  },
  commerce: {
    openCommand: 'CEODigital: Abrir Comércio & Pagamentos',
    orders: {
      title: 'Encomendas',
      empty: 'Ainda não há encomendas para o teu tenant.',
      allStatuses: 'Todos os estados',
      allPaymentStatuses: 'Todos os estados de pagamento',
      allFulfillmentStatuses: 'Todos os estados de cumprimento',
      searchPlaceholder: 'Pesquisar encomendas…',
      statuses: {
        pending: 'Pendente',
        confirmed: 'Confirmada',
        processing: 'Em processamento',
        shipped: 'Enviada',
        delivered: 'Entregue',
        cancelled: 'Cancelada'
      },
      fulfillments: { unfulfilled: 'Por cumprir', partial: 'Parcial', fulfilled: 'Cumprida' },
      back: 'Voltar às encomendas',
      detail: 'Detalhe da encomenda',
      changeStatus: 'Alterar estado',
      statusLabel: 'Estado',
      fulfillmentLabel: 'Cumprimento',
      updateStatus: 'Atualizar',
      cancellationReason: 'Motivo do cancelamento',
      cancellationReasonPlaceholder: 'Porque está a encomenda a ser cancelada?',
      updating: 'A atualizar…',
      headers: {
        id: 'ID',
        status: 'Estado',
        payment: 'Pagamento',
        fulfillment: 'Cumprimento',
        customer: 'Cliente',
        total: 'Total'
      },
      detailHeaders: {
        id: 'ID',
        status: 'Estado',
        payment: 'Pagamento',
        fulfillment: 'Cumprimento',
        customer: 'Cliente',
        total: 'Total',
        created: 'Criada'
      },
      errors: {
        list: 'Não foi possível carregar as encomendas.',
        fetchOrder: 'Não foi possível carregar esta encomenda.',
        updateStatus: 'Não foi possível atualizar o estado da encomenda.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    payments: {
      title: 'Pagamentos',
      empty: 'Ainda não há pagamentos para o teu tenant.',
      allStatuses: 'Todos os estados',
      statuses: { pending: 'Pendente', paid: 'Pago', failed: 'Falhado', refunded: 'Reembolsado' },
      headers: {
        id: 'ID',
        status: 'Estado',
        order: 'Encomenda',
        customer: 'Cliente',
        amount: 'Valor',
        created: 'Criado'
      },
      linksTitle: 'Ligações de pagamento',
      linksEmpty: 'Ainda não há ligações de pagamento.',
      newLink: 'Nova ligação de pagamento',
      cancelLink: 'Cancelar',
      cancelling: 'A cancelar…',
      createForm: {
        email: 'Email do cliente',
        emailPlaceholder: 'cliente@exemplo.pt',
        name: 'Nome do cliente',
        namePlaceholder: 'Nome do cliente',
        phone: 'Telefone do cliente',
        phonePlaceholder: '+351 912 345 678',
        amountCents: 'Valor (cêntimos)',
        amountCentsPlaceholder: '1490',
        currency: 'Moeda',
        currencyPlaceholder: 'EUR',
        expiresInDays: 'Expira em (dias)',
        orderId: 'ID da encomenda',
        orderIdPlaceholder: 'ID da encomenda (opcional)',
        create: 'Criar ligação',
        cancel: 'Cancelar'
      },
      url: 'URL',
      cancelReason: 'Motivo do cancelamento',
      cancelReasonPlaceholder: 'Motivo (opcional)',
      errors: {
        list: 'Não foi possível carregar os pagamentos.',
        fetchPayment: 'Não foi possível carregar este pagamento.',
        createLink: 'Não foi possível criar a ligação de pagamento.',
        cancelLink: 'Não foi possível cancelar a ligação de pagamento.',
        general: 'A ação falhou. Tenta novamente.'
      }
    }
  },
  governance: {
    openCommand: 'CEODigital: Abrir Governação',
    tabs: { dsr: 'Pedidos DSR', consents: 'Consentimentos', processing: 'Processamento', retention: 'Retenção' },
    dsr: {
      title: 'Pedidos de titular de dados',
      empty: 'Ainda não há pedidos de titular de dados.',
      allStatuses: 'Todos os estados',
      allTypes: 'Todos os tipos',
      requestTypes: { export: 'Exportação', deletion: 'Eliminação' },
      statuses: { pending: 'Pendente', processing: 'Em processamento', completed: 'Concluído', failed: 'Falhado' },
      newRequest: 'Novo pedido',
      route: 'Encaminhar',
      routing: 'A encaminhar…',
      createForm: {
        userId: 'ID do utilizador',
        userIdPlaceholder: 'utilizador@tenant ou uuid',
        requestType: 'Tipo de pedido',
        create: 'Criar pedido',
        cancel: 'Cancelar'
      },
      processedBy: 'Processado por',
      processedByPlaceholder: 'id do utilizador',
      headers: {
        id: 'ID',
        type: 'Tipo',
        status: 'Estado',
        user: 'Utilizador',
        processedBy: 'Processado por',
        created: 'Criado'
      },
      errors: {
        list: 'Não foi possível carregar os pedidos de titular de dados.',
        create: 'Não foi possível criar o pedido.',
        route: 'Não foi possível encaminhar o pedido.',
        invalidRequestType: 'Escolhe um tipo de pedido válido.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    consents: {
      title: 'Consentimentos',
      empty: 'Ainda não há consentimentos registados.',
      record: 'Registar consentimento',
      recordForm: {
        userId: 'ID do utilizador',
        userIdPlaceholder: 'utilizador@tenant ou uuid',
        termsVersion: 'Versão dos termos',
        privacyVersion: 'Versão da privacidade',
        termsDocumentId: 'ID do documento de termos',
        privacyDocumentId: 'ID do documento de privacidade',
        ipAddress: 'Endereço IP',
        userAgent: 'User agent',
        record: 'Registar',
        cancel: 'Cancelar'
      },
      headers: { id: 'ID', user: 'Utilizador', terms: 'Termos', privacy: 'Privacidade', ip: 'IP', created: 'Criado' },
      errors: {
        list: 'Não foi possível carregar os consentimentos.',
        record: 'Não foi possível registar o consentimento.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    processing: {
      title: 'Registos de processamento',
      empty: 'Não foram encontrados registos de processamento.',
      allActivity: 'Todos',
      activeOnly: 'Apenas ativos',
      headers: { id: 'ID', entity: 'Entidade', status: 'Estado', active: 'Ativo', started: 'Iniciado' },
      errors: {
        list: 'Não foi possível carregar os registos de processamento.',
        general: 'A ação falhou. Tenta novamente.'
      }
    },
    retention: {
      title: 'Políticas de retenção',
      empty: 'Não foram encontradas políticas de retenção.',
      allActivity: 'Todas',
      activeOnly: 'Apenas ativas',
      headers: { id: 'ID', entity: 'Entidade', days: 'Dias', active: 'Ativa' },
      errors: {
        list: 'Não foi possível carregar as políticas de retenção.',
        general: 'A ação falhou. Tenta novamente.'
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