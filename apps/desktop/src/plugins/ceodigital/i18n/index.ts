/**
 * Plugin-scoped i18n for CEODigital — parallel bundles per locale
 * (`en`/`pt`/`fr` from the first commit, proving the ownership-map §6 i18n
 * layer), shipped under the plugin id via `ctx.i18n.register` — never touching
 * core `en.ts`. `useCeodigital()` returns the stringly-typed shape-bound
 * translator so the page keeps typed `k.page.title` access; the plugins also
 * carry `pt-PT`/`fr-FR` from the start even though the app's core `Locale`
 * union only selects them after the fork's branding wave extends it.
 */

import { type PluginLocaleBundles, type PluginMessages, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import type {
  AttendancePriority,
  AttendanceStatus,
  DepartmentRole,
  DsrRequestType,
  DsrStatus,
  ExemptionSourceType,
  ExemptionType,
  FulfillmentStatus,
  InferenceBackend,
  IntegrationScope,
  IntegrationStatus,
  OrderStatus,
  PaymentStatus,
  PhaseStatus,
  ProjectStatus,
  WidgetSize,
  WorkItemStatus,
  WorkspaceRole
} from '../types'
import { en } from './en'
import { fr } from './fr'
import { pt } from './pt'

export { en } from './en'
export { fr } from './fr'
export { pt } from './pt'

/** The message shape W3/W4 renders. Keys: nav.*, page.*, workitem.*, crm.*, errors.*. */
export interface CeodigitalMessages {
  nav: { label: string }
  page: {
    title: string
    empty: string
    openCommand: string
  }
  workitem: {
    status: Partial<Record<WorkItemStatus, string>>
    headers: {
      id: string
      title: string
      status: string
      assignee: string
      updated: string
    }
    unassigned: string
  }
  workitems: {
    title: string
    empty: string
    openCommand: string
    filters: {
      all: string
      mine: string
      dueSoon: string
      awaitingApproval: string
    }
    toolbar: {
      new: string
      suggest: string
      suggestPlaceholder: string
      suggestRun: string
      suggestEmpty: string
    }
    form: {
      title: string
      subjectType: string
      subjectTypePlaceholder: string
      description: string
      due: string
      create: string
      cancel: string
    }
    actions: {
      run: string
      assign: string
      submitOutput: string
      running: string
      assigning: string
      submitting: string
    }
    assign: {
      title: string
      add: string
      remove: string
      role: string
      save: string
      empty: string
    }
    submit: {
      title: string
      runId: string
      output: string
      notes: string
      send: string
    }
    checklist: {
      title: string
      itemLabel: string
      doneLabel: string
      toggle: string
      empty: string
    }
    errors: {
      create: string
      run: string
      assign: string
      submit: string
      checklist: string
      suggest: string
      general: string
    }
  }
  crm: {
    leads: { title: string; empty: string }
    deals: { title: string; empty: string }
    persons: {
      title: string
      empty: string
      headers: { email: string; org: string }
    }
    organizations: {
      title: string
      empty: string
      headers: { industry: string }
    }
    pipelines: {
      title: string
      empty: string
      headers: { subject: string; stages: string }
    }
    stages: {
      title: string
      empty: string
      headers: { probability: string; won: string }
    }
    activities: {
      title: string
      empty: string
      headers: { kind: string; created: string }
    }
    categories: {
      title: string
      empty: string
      headers: { slug: string; active: string }
    }
    headers: { id: string; title: string; status: string; value: string }
    unassigned: string
  }
  agents: {
    title: string
    empty: string
    headers: { name: string; slug: string; status: string; exposed: string }
    workflows: { title: string; empty: string; headers: { name: string; status: string; trigger: string } }
    runs: {
      title: string
      empty: string
      runBtn: string
      promptPlaceholder: string
      executing: string
      runCompleted: string
      runFailed: string
      runPaused: string
      headers: { id: string; status: string; started: string }
      viewSteps: string
      hideSteps: string
      steps: string
    }
    schedules: {
      title: string
      empty: string
      headers: { name: string; cron: string; active: string; lastRun: string }
    }
    pending: {
      title: string
      empty: string
      headers: { tool: string; run: string; status: string }
      goToTenant: string
    }
  }
  services: {
    catalog: {
      title: string
      empty: string
      searchPlaceholder: string
      produces: string
      allProduces: string
      activeOnly: string
      offerings: string
      offeringsEmpty: string
      back: string
      detail: string
      headers: { name: string; code: string; pricing: string; model: string }
    }
    offerings: { title: string; empty: string }
    categories: { title: string; empty: string }
    proposals: {
      title: string
      openCommand: string
      empty: string
      new: string
      back: string
      detail: string
      fields: {
        title: string
        status: string
        description: string
        currency: string
        totalValue: string
        paymentModel: string
        depositPercentage: string
        validUntil: string
        terms: string
        leadId: string
      }
      status: Partial<Record<string, string>>
      actions: {
        send: string
        accept: string
        reject: string
        cancel: string
        duplicate: string
        expire: string
        addItem: string
        addTranche: string
        save: string
        remove: string
        sending: string
        accepting: string
        rejecting: string
        cancelling: string
        duplicating: string
        expiring: string
      }
      reject: { reasonPlaceholder: string; cancel: string }
      items: {
        headers: {
          description: string
          quantity: string
          unitPrice: string
          discount: string
          vatRate: string
          recurrence: string
        }
        empty: string
        form: {
          serviceCatalogId: string
          serviceOfferingId: string
          quantity: string
          unitPrice: string
          discount: string
          vatRate: string
          recurrence: string
          description: string
          sortOrder: string
          add: string
          update: string
          cancel: string
        }
      }
      tranches: {
        headers: { label: string; amount: string; dueDate: string; sortOrder: string }
        empty: string
        form: { label: string; amount: string; dueDate: string; sortOrder: string; add: string; update: string; cancel: string }
      }
      form: {
        title: string
        leadId: string
        description: string
        totalValue: string
        paymentModel: string
        depositPercentage: string
        validUntil: string
        currency: string
        terms: string
        create: string
        cancel: string
      }
      errors: {
        create: string
        send: string
        accept: string
        reject: string
        cancel: string
        duplicate: string
        expire: string
        addItem: string
        updateItem: string
        removeItem: string
        addTranche: string
        updateTranche: string
        removeTranche: string
        fetchProposal: string
        general: string
      }
    }
  }
  automation: {
    conversations: {
      title: string
      openCommand: string
      empty: string
      search: string
      archivedOnly: string
      all: string
      new: string
      form: {
        title: string
        titlePlaceholder: string
        systemPrompt: string
        model: string
        workspaceId: string
        tags: string
        create: string
        cancel: string
      }
      actions: {
        archive: string
        share: string
        unshare: string
        archiving: string
        sharing: string
      }
      headers: { id: string; title: string; model: string; archived: string; shared: string }
    }
    playbooks: {
      title: string
      openCommand: string
      empty: string
      back: string
      detail: string
      run: string
      running: string
      filters: { all: string; active: string; inactive: string }
      subjectType: string
      subjectId: string
      runFormTitle: string
      runFormSubjectType: string
      runFormSubjectId: string
      cancel: string
      runs: string
      runsEmpty: string
      runStatus: Partial<Record<string, string>>
      headers: { id: string; title: string; subject: string; active: string }
      runsHeaders: { id: string; status: string; subject: string; started: string }
    }
    workflows: {
      title: string
      openCommand: string
      empty: string
      back: string
      detail: string
      publish: string
      publishing: string
      run: string
      running: string
      filters: { all: string; draft: string; active: string; archived: string }
      triggers: { all: string; manual: string; webhook: string; schedule: string; event: string; api: string }
      runInput: string
      runInputPlaceholder: string
      webhooks: string
      webhooksEmpty: string
      schedules: string
      schedulesEmpty: string
      runs: string
      runsEmpty: string
      runStatus: Partial<Record<string, string>>
      headers: { id: string; name: string; status: string; trigger: string }
      runsHeaders: { id: string; status: string; started: string }
      webhooksHeaders: { id: string; url: string; active: string }
      schedulesHeaders: { id: string; cron: string; active: string }
      actions: {
        rotate: string
        pausing: string
        pause: string
        resume: string
        rotating: string
      }
    }
  }
  documents: {
    files: {
      title: string
      openCommand: string
      empty: string
      searchPlaceholder: string
      namespacePlaceholder: string
      allNamespaces: string
      visibility: string
      allVisibilities: string
      upload: string
      uploadForm: {
        name: string
        namePlaceholder: string
        file: string
        namespace: string
        collection: string
        submit: string
        cancel: string
      }
      moveForm: {
        title: string
        targetNamespace: string
        targetCollection: string
        none: string
        submit: string
        cancel: string
      }
      addToCollectionForm: {
        title: string
        collection: string
        submit: string
        cancel: string
      }
      actions: {
        move: string
        delete: string
        deleteConfirm: string
        addToCollection: string
        moving: string
        deleting: string
        adding: string
      }
      headers: {
        id: string
        title: string
        namespace: string
        visibility: string
        mime: string
      }
      rag: {
        placeholder: string
        search: string
        searching: string
        empty: string
        maxResults: string
        resultsEmpty: string
        reindex: string
        reindexing: string
        reindexDone: string
      }
      errors: {
        list: string
        upload: string
        delete: string
        move: string
        addToCollection: string
        search: string
        reindex: string
        general: string
      }
    }
    collections: {
      title: string
      openCommand: string
      empty: string
      new: string
      createForm: {
        name: string
        namePlaceholder: string
        description: string
        color: string
        icon: string
        parentId: string
        create: string
        cancel: string
      }
      members: string
      addFile: string
      addFilePlaceholder: string
      removeFile: string
      noMembers: string
      headers: {
        id: string
        title: string
        description: string
        members: string
      }
      errors: {
        list: string
        create: string
        addFile: string
        removeFile: string
        general: string
      }
    }
    bindings: {
      title: string
      openCommand: string
      empty: string
      entityType: string
      entityTypePlaceholder: string
      entityId: string
      entityIdPlaceholder: string
      direction: string
      allDirections: string
      input: string
      output: string
      attach: string
      attachForm: {
        entityType: string
        entityTypePlaceholder: string
        entityId: string
        entityIdPlaceholder: string
        direction: string
        bindingId: string
        bindingIdPlaceholder: string
        targetRef: string
        syncMode: string
        publishMode: string
        ragIndex: string
        outputFormat: string
        nameTemplate: string
        submit: string
        cancel: string
      }
      detach: string
      detaching: string
      headers: {
        id: string
        entity: string
        direction: string
        binding: string
        sync: string
        publish: string
        rag: string
        output: string
      }
      errors: {
        list: string
        attach: string
        detach: string
        general: string
      }
    }
  }
  messaging: {
    title: string
    openCommand: string
    empty: string
    newThread: string
    allTypes: string
    threadType: string
    refTable: string
    refId: string
    back: string
    detail: string
    messagesEmpty: string
    postPlaceholder: string
    emojiPlaceholder: string
    fileId: string
    attachmentName: string
    headers: { id: string; title: string; type: string; created: string }
    form: {
      subject: string
      subjectPlaceholder: string
      create: string
      cancel: string
    }
    actions: {
      post: string
      react: string
      markRead: string
      uploadAttachment: string
      posting: string
      reacting: string
      uploading: string
    }
    errors: {
      list: string
      create: string
      post: string
      react: string
      markRead: string
      upload: string
      fetchMessages: string
      fetchThread: string
      general: string
    }
  }
  notifications: {
    title: string
    openCommand: string
    empty: string
    all: string
    unreadOnly: string
    unreadCount: string
    markAllRead: string
    markRead: string
    marking: string
    headers: { id: string; title: string; type: string; created: string }
    errors: {
      list: string
      markRead: string
      markAll: string
      general: string
    }
  }
  timeline: {
    title: string
    openCommand: string
    empty: string
    entityType: string
    entityId: string
    actorUserId: string
    eventGlob: string
    pin: string
    unpin: string
    addReaction: string
    removeReaction: string
    reactions: string
    headers: { id: string; event: string; entity: string; actor: string; at: string }
    actions: {
      pinning: string
      unpinning: string
      reacting: string
    }
    errors: {
      list: string
      pin: string
      unpin: string
      addReaction: string
      removeReaction: string
      general: string
    }
  }
  implementations: {
    title: string
    openCommand: string
    empty: string
    search: string
    allStatuses: string
    status: string
    clientVisible: string
    back: string
    detail: string
    phases: string
    phasesEmpty: string
    files: string
    filesEmpty: string
    messages: string
    messagesEmpty: string
    changeStatus: string
    complete: string
    completing: string
    cancel: string
    cancelling: string
    postMessage: string
    messagePlaceholder: string
    posting: string
    projectStatus: Partial<Record<ProjectStatus, string>>
    phaseStatus: Partial<Record<PhaseStatus, string>>
    headers: { id: string; title: string; status: string; clientVisible: string }
    phaseHeaders: { id: string; title: string; status: string }
    fileHeaders: { id: string; name: string; size: string }
    errors: {
      list: string
      fetchProject: string
      changeStatus: string
      complete: string
      cancel: string
      changePhaseStatus: string
      fetchPhases: string
      fetchFiles: string
      fetchMessages: string
      postMessage: string
      general: string
    }
  }
  workspaces: {
    title: string
    openCommand: string
    empty: string
    new: string
    search: string
    archivedOnly: string
    all: string
    back: string
    detail: string
    members: string
    membersEmpty: string
    role: string
    allRoles: string
    memberRoles: Partial<Record<WorkspaceRole, string>>
    addMember: string
    addMemberPlaceholder: string
    removeMember: string
    adding: string
    removing: string
    createForm: {
      name: string
      namePlaceholder: string
      description: string
      categoryId: string
      icon: string
      color: string
      create: string
      cancel: string
    }
    headers: { id: string; title: string; description: string; members: string }
    memberHeaders: { id: string; name: string; role: string }
    errors: {
      list: string
      create: string
      addMember: string
      removeMember: string
      fetchMembers: string
      general: string
    }
  }
  departments: {
    title: string
    openCommand: string
    empty: string
    new: string
    search: string
    activeOnly: string
    all: string
    back: string
    detail: string
    members: string
    membersEmpty: string
    role: string
    allRoles: string
    memberRoles: Partial<Record<DepartmentRole, string>>
    addMember: string
    addMemberPlaceholder: string
    removeMember: string
    adding: string
    removing: string
    createForm: {
      name: string
      namePlaceholder: string
      slugKey: string
      slugKeyPlaceholder: string
      areas: string
      areasPlaceholder: string
      headId: string
      headIdPlaceholder: string
      create: string
      cancel: string
    }
    headers: { id: string; title: string; slug: string; areas: string; active: string }
    memberHeaders: { id: string; name: string; role: string }
    actions: { remove: string }
    errors: {
      list: string
      create: string
      addMember: string
      removeMember: string
      fetchMembers: string
      general: string
    }
  }
  members: {
    title: string
    openCommand: string
    empty: string
    invite: string
    allRoles: string
    role: string
    inviteForm: {
      email: string
      emailPlaceholder: string
      role: string
      create: string
      cancel: string
    }
    revoke: string
    revoking: string
    updateRole: string
    updating: string
    headers: { id: string; name: string; email: string; role: string }
    errors: {
      list: string
      invite: string
      revoke: string
      updateRole: string
      general: string
    }
  }
  integrations: {
    title: string
    openCommand: string
    empty: string
    connect: string
    allProviders: string
    allStatuses: string
    allScopes: string
    providerCode: string
    status: string
    scope: string
    scopes: Partial<Record<IntegrationScope, string>>
    statuses: Partial<Record<IntegrationStatus, string>>
    connectForm: {
      providerCode: string
      providerCodePlaceholder: string
      appSlug: string
      appSlugPlaceholder: string
      scope: string
      mailboxKey: string
      mailboxKeyPlaceholder: string
      mailboxLabel: string
      mailboxLabelPlaceholder: string
      connect: string
      cancel: string
    }
    test: string
    testing: string
    disconnect: string
    disconnecting: string
    detail: string
    back: string
    headers: { id: string; provider: string; app: string; status: string; scope: string; mailbox: string }
    errors: {
      list: string
      connect: string
      test: string
      disconnect: string
      fetchIntegration: string
      general: string
    }
  }
  commerce: {
    openCommand: string
    orders: {
      title: string
      empty: string
      allStatuses: string
      allPaymentStatuses: string
      allFulfillmentStatuses: string
      searchPlaceholder: string
      statuses: Partial<Record<OrderStatus, string>>
      fulfillments: Partial<Record<FulfillmentStatus, string>>
      back: string
      detail: string
      changeStatus: string
      statusLabel: string
      fulfillmentLabel: string
      updateStatus: string
      cancellationReason: string
      cancellationReasonPlaceholder: string
      updating: string
      headers: {
        id: string
        status: string
        payment: string
        fulfillment: string
        customer: string
        total: string
      }
      detailHeaders: {
        id: string
        status: string
        payment: string
        fulfillment: string
        customer: string
        total: string
        created: string
      }
      errors: {
        list: string
        fetchOrder: string
        updateStatus: string
        general: string
      }
    }
    payments: {
      title: string
      empty: string
      allStatuses: string
      statuses: Partial<Record<PaymentStatus, string>>
      headers: {
        id: string
        status: string
        order: string
        customer: string
        amount: string
        created: string
      }
      linksTitle: string
      linksEmpty: string
      newLink: string
      cancelLink: string
      cancelling: string
      createForm: {
        email: string
        emailPlaceholder: string
        name: string
        namePlaceholder: string
        phone: string
        phonePlaceholder: string
        amountCents: string
        amountCentsPlaceholder: string
        currency: string
        currencyPlaceholder: string
        expiresInDays: string
        orderId: string
        orderIdPlaceholder: string
        create: string
        cancel: string
      }
      url: string
      cancelReason: string
      cancelReasonPlaceholder: string
      errors: {
        list: string
        fetchPayment: string
        createLink: string
        cancelLink: string
        general: string
      }
    }
  }
  governance: {
    openCommand: string
    tabs: {
      dsr: string
      consents: string
      processing: string
      retention: string
    }
    dsr: {
      title: string
      empty: string
      allStatuses: string
      allTypes: string
      requestTypes: Partial<Record<DsrRequestType, string>>
      statuses: Partial<Record<DsrStatus, string>>
      newRequest: string
      route: string
      routing: string
      createForm: {
        userId: string
        userIdPlaceholder: string
        requestType: string
        create: string
        cancel: string
      }
      processedBy: string
      processedByPlaceholder: string
      headers: {
        id: string
        type: string
        status: string
        user: string
        processedBy: string
        created: string
      }
      errors: {
        list: string
        create: string
        route: string
        invalidRequestType: string
        general: string
      }
    }
    consents: {
      title: string
      empty: string
      record: string
      recordForm: {
        userId: string
        userIdPlaceholder: string
        termsVersion: string
        privacyVersion: string
        termsDocumentId: string
        privacyDocumentId: string
        ipAddress: string
        userAgent: string
        record: string
        cancel: string
      }
      headers: {
        id: string
        user: string
        terms: string
        privacy: string
        ip: string
        created: string
      }
      errors: {
        list: string
        record: string
        general: string
      }
    }
    processing: {
      title: string
      empty: string
      allActivity: string
      activeOnly: string
      headers: {
        id: string
        entity: string
        status: string
        active: string
        started: string
      }
      errors: {
        list: string
        general: string
      }
    }
    retention: {
      title: string
      empty: string
      allActivity: string
      activeOnly: string
      headers: {
        id: string
        entity: string
        days: string
        active: string
      }
      errors: {
        list: string
        general: string
      }
    }
  }
  labels: {
    title: string
    openCommand: string
    empty: string
    searchPlaceholder: string
    new: string
    assignments: string
    assignmentsEmpty: string
    assign: string
    assigning: string
    unassign: string
    unassigning: string
    subjectTypePlaceholder: string
    subjectIdPlaceholder: string
    createForm: {
      code: string
      codePlaceholder: string
      name: string
      namePlaceholder: string
      color: string
      colorPlaceholder: string
      description: string
      descriptionPlaceholder: string
      create: string
      cancel: string
    }
    updateForm: {
      name: string
      color: string
      description: string
      update: string
      cancel: string
    }
    headers: { id: string; code: string; name: string; color: string }
    errors: {
      list: string
      create: string
      update: string
      assign: string
      unassign: string
      fetchAssignments: string
      general: string
    }
  }
  dashboards: {
    title: string
    openCommand: string
    empty: string
    new: string
    back: string
    detail: string
    widgets: string
    widgetsEmpty: string
    addWidget: string
    addingWidget: string
    removeWidget: string
    removingWidget: string
    createForm: {
      title: string
      titlePlaceholder: string
      icon: string
      iconPlaceholder: string
      position: string
      create: string
      cancel: string
    }
    widgetForm: {
      specTitle: string
      specTitlePlaceholder: string
      specKind: string
      specKindPlaceholder: string
      size: string
      positionIndex: string
      add: string
      cancel: string
    }
    sizes: Partial<Record<WidgetSize, string>>
    headers: { id: string; title: string; icon: string; position: string }
    widgetHeaders: { id: string; title: string; size: string }
    errors: {
      list: string
      fetchDashboard: string
      create: string
      fetchWidgets: string
      addWidget: string
      removeWidget: string
      general: string
    }
  }
  pricing: {
    title: string
    openCommand: string
    empty: string
    back: string
    detail: string
    all: string
    activeOnly: string
    searchPlaceholder: string
    new: string
    rules: string
    rulesEmpty: string
    exemptions: string
    exemptionsEmpty: string
    fees: string
    feesEmpty: string
    addExemption: string
    addingExemption: string
    createForm: {
      code: string
      codePlaceholder: string
      name: string
      namePlaceholder: string
      defaultRate: string
      defaultRatePlaceholder: string
      description: string
      descriptionPlaceholder: string
      exemptionReason: string
      exemptionReasonPlaceholder: string
      isDefault: string
      create: string
      cancel: string
    }
    updateForm: {
      name: string
      defaultRate: string
      description: string
      isActive: string
      update: string
      cancel: string
    }
    exemptionForm: {
      sourceType: string
      sourceId: string
      sourceIdPlaceholder: string
      vatNumber: string
      exemptionType: string
      reason: string
      reasonPlaceholder: string
      validFrom: string
      validUntil: string
      add: string
      cancel: string
    }
    sourceTypes: Partial<Record<ExemptionSourceType, string>>
    exemptionTypes: Partial<Record<ExemptionType, string>>
    headers: {
      id: string
      code: string
      name: string
      defaultRate: string
      active: string
      default: string
    }
    ruleHeaders: { id: string; kind: string; rate: string }
    exemptionHeaders: {
      id: string
      source: string
      vat: string
      type: string
      reason: string
    }
    feeHeaders: { id: string; name: string; code: string; rate: string; active: string }
    errors: {
      list: string
      fetchProfile: string
      create: string
      update: string
      fetchRules: string
      fetchExemptions: string
      addExemption: string
      fetchFees: string
      general: string
    }
  }
  attendance: {
    title: string
    openCommand: string
    empty: string
    back: string
    detail: string
    allKinds: string
    allStatuses: string
    allPriorities: string
    kindPlaceholder: string
    assigneeIdPlaceholder: string
    assign: string
    assigning: string
    updateStatus: string
    updatingStatus: string
    statuses: Partial<Record<AttendanceStatus, string>>
    priorities: Partial<Record<AttendancePriority, string>>
    detailHeaders: {
      id: string
      title: string
      kind: string
      status: string
      priority: string
      assignee: string
      created: string
    }
    headers: {
      id: string
      title: string
      kind: string
      status: string
      priority: string
      assignee: string
    }
    errors: {
      list: string
      fetchItem: string
      assign: string
      updateStatus: string
      general: string
    }
  }
  llmStudio: {
    title: string
    openCommand: string
    tabs: { datasets: string; jobs: string; adapters: string; preferences: string }
    datasets: {
      title: string
      empty: string
      allStatuses: string
      allSourceTypes: string
      statusPlaceholder: string
      sourceTypePlaceholder: string
      headers: { id: string; name: string; status: string; source: string; created: string }
      errors: { list: string; general: string }
    }
    jobs: {
      title: string
      empty: string
      allStatuses: string
      statusPlaceholder: string
      headers: { id: string; name: string; status: string; dataset: string; created: string }
      errors: { list: string; general: string }
    }
    adapters: {
      title: string
      empty: string
      allStatuses: string
      allScopes: string
      statusPlaceholder: string
      scopePlaceholder: string
      toggle: string
      toggling: string
      headers: { id: string; name: string; status: string; scope: string; active: string }
      errors: { list: string; toggle: string; general: string }
    }
    preferences: {
      title: string
      empty: string
      activeAdapterId: string
      activeAdapterIdPlaceholder: string
      inferenceBackend: string
      fallbackToGeneric: string
      save: string
      saving: string
      backends: Partial<Record<InferenceBackend, string>>
      errors: { fetch: string; save: string; general: string }
    }
  }
  workbench: {
    title: string
    openCommand: string
    empty: string
    newPin: string
    notePlaceholder: string
    setNote: string
    settingNote: string
    clearNote: string
    toggleForm: {
      subjectType: string
      subjectTypePlaceholder: string
      subjectId: string
      subjectIdPlaceholder: string
      title: string
      titlePlaceholder: string
      toggle: string
      toggling: string
      cancel: string
    }
    headers: { id: string; subject: string; title: string; note: string }
    errors: {
      list: string
      toggle: string
      setNote: string
      general: string
    }
  }
  errors: {
    fetch: string
    general: string
    mcp_not_configured: string
    mcp_unreachable: string
    tenant_not_found: string
  }
}

/** Registered via `ctx.i18n.register` at plugin load (disposer tracked). The
 *  `pt`/`fr` keys are NOT in the core `Locale` union yet — that's the branding
 *  fork's later wave — so the map keeps them via an intersection while still
 *  looking like a `PluginLocaleBundles` to the SDK's `register`. */
export const CEODIGITAL_LOCALES: PluginLocaleBundles & Record<'en' | 'pt' | 'fr', PluginMessages> = { en, pt, fr }

// Bind the message SHAPE to a plugin translator: every leaf resolves forward
// through `t(path)`. One tiny generic instead of a hand-written accessor.
type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => string
    ? (...args: Parameters<T[K]>) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

function bind<T extends object>(t: PluginTranslate, template: T, prefix = ''): Bound<T> {
  const out = {} as Record<string, unknown>

  for (const [key, value] of Object.entries(template)) {
    const path = prefix ? `${prefix}.${key}` : key
    out[key] =
      value && typeof value === 'object'
        ? bind(t, value as object, path)
        : (() => t(path))()
  }

  return out as Bound<T>
}

export type CEODIGITALText = Bound<CeodigitalMessages>

/** The CEODigital strings for the active locale — one hook every page reads. */
export function useCeodigital(): CEODIGITALText {
  const t = usePluginI18n('ceodigital')

  return useMemo(() => bind(t, en), [t])
}

/** Status label — named statuses get their bundle copy, anything else its raw id. */
export const statusLabel = (k: CEODIGITALText, status: string) =>
  k.workitem.status[status as WorkItemStatus] ?? status

/** Proposal status label — named statuses get their bundle copy, else the raw id. */
export const proposalStatusLabel = (k: CEODIGITALText, status: string) =>
  k.services.proposals.status[status] ?? status