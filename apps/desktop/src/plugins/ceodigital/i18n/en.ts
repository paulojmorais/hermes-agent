import type { CeodigitalMessages } from '.'

/** English bundle — the shape template for the others. */
export const en: CeodigitalMessages = {
  nav: { label: 'CEODigital' },
  page: {
    title: 'CEODigital Projects',
    empty: 'No projects found for your tenant yet.',
    openCommand: 'CEODigital: Open Projects'
  },
  workitem: {
    status: {
      backlog: 'Backlog',
      ready: 'Ready',
      running: 'Running',
      review: 'Review',
      blocked: 'Blocked',
      done: 'Done',
      failed: 'Failed',
      archived: 'Archived'
    },
    headers: {
      id: 'ID',
      title: 'Title',
      status: 'Status',
      assignee: 'Assignee',
      updated: 'Updated'
    },
    unassigned: 'Unassigned'
  },
  workitems: {
    title: 'CEODigital Workitems',
    empty: 'No work items found for your tenant yet.',
    openCommand: 'CEODigital: Open Workitems',
    filters: {
      all: 'All',
      mine: 'Mine',
      dueSoon: 'Due soon',
      awaitingApproval: 'Awaiting approval'
    },
    toolbar: {
      new: 'New Work Item',
      suggest: 'Suggest',
      suggestPlaceholder: 'Describe what you need…',
      suggestRun: 'Find matching SOPs',
      suggestEmpty: 'No SOPs matched this intent.'
    },
    form: {
      title: 'Title',
      subjectType: 'Subject type',
      subjectTypePlaceholder: 'project, deal, lead…',
      description: 'Description',
      due: 'Due',
      create: 'Create work item',
      cancel: 'Cancel'
    },
    actions: {
      run: 'Run',
      assign: 'Assign',
      submitOutput: 'Submit output',
      running: 'Running…',
      assigning: 'Assigning…',
      submitting: 'Submitting…'
    },
    assign: {
      title: 'Assign',
      add: 'Add (user ids)',
      remove: 'Remove (user ids)',
      role: 'Role',
      save: 'Save assignment',
      empty: 'No users to show.'
    },
    submit: {
      title: 'Submit output',
      runId: 'Run id',
      output: 'Output (JSON)',
      notes: 'Notes',
      send: 'Submit'
    },
    checklist: {
      title: 'Checklist',
      itemLabel: 'Checklist item id',
      doneLabel: 'Done',
      toggle: 'Toggle',
      empty: 'No checklist item provided for this work item.'
    },
    errors: {
      create: 'Could not create the work item.',
      run: 'Could not run the work item.',
      assign: 'Could not update assignment.',
      submit: 'Could not submit the output.',
      checklist: 'Could not toggle the checklist item.',
      suggest: 'Could not fetch SOP suggestions.',
      general: 'The action failed. Try again.'
    }
  },
  crm: {
    leads: {
      title: 'CEODigital Leads',
      empty: 'No CRM leads found for your tenant yet.'
    },
    deals: {
      title: 'CEODigital Deals',
      empty: 'No CRM deals found for your tenant yet.'
    },
    persons: {
      title: 'CEODigital Persons',
      empty: 'No CRM persons found for your tenant yet.',
      headers: {
        email: 'Email',
        org: 'Organization'
      }
    },
    organizations: {
      title: 'CEODigital Organizations',
      empty: 'No CRM organizations found for your tenant yet.',
      headers: {
        industry: 'Industry'
      }
    },
    pipelines: {
      title: 'CEODigital Pipelines',
      empty: 'No CRM pipelines found for your tenant yet.',
      headers: {
        subject: 'Subject',
        stages: 'Stages'
      }
    },
    stages: {
      title: 'CEODigital Stages',
      empty: 'No CRM stages found for your tenant yet.',
      headers: {
        probability: 'Probability',
        won: 'Won'
      }
    },
    activities: {
      title: 'CEODigital Activities',
      empty: 'No CRM activities found for your tenant yet.',
      headers: {
        kind: 'Kind',
        created: 'Created'
      }
    },
    categories: {
      title: 'CEODigital Categories',
      empty: 'No CRM categories found for your tenant yet.',
      headers: {
        slug: 'Slug',
        active: 'Active'
      }
    },
    headers: {
      id: 'ID',
      title: 'Title',
      status: 'Status',
      value: 'Value'
    },
    unassigned: 'Unassigned'
  },
  agents: {
    title: 'CEODigital Agents',
    empty: 'No CEO agents found for your tenant yet.',
    headers: {
      name: 'Name',
      slug: 'Slug',
      status: 'Status',
      exposed: 'Exposed as MCP'
    },
    workflows: {
      title: 'NativeFlows',
      empty: 'No NativeFlow workflows found for your tenant yet.',
      headers: {
        name: 'Name',
        status: 'Status',
        trigger: 'Trigger'
      }
    },
    runs: {
      title: 'Run debrief',
      empty: 'No agent runs yet. Run an agent to see its debrief here.',
      runBtn: 'Run agent',
      promptPlaceholder: 'What should the agent do?',
      executing: 'Running…',
      runCompleted: 'Completed',
      runFailed: 'Failed',
      runPaused: 'Paused (approval required)',
      headers: {
        id: 'Run',
        status: 'Status',
        started: 'Started'
      },
      viewSteps: 'View steps',
      hideSteps: 'Hide steps',
      steps: 'Steps'
    },
    schedules: {
      title: 'Agent schedules',
      empty: 'No autonomous agent schedules found for this tenant.',
      headers: {
        name: 'Name',
        cron: 'Cron',
        active: 'Active',
        lastRun: 'Last run'
      }
    },
    pending: {
      title: 'Pending approvals',
      empty: 'No pending HITL approvals.',
      headers: {
        tool: 'Tool',
        run: 'Run',
        status: 'Status'
      },
      goToTenant: 'Open approvals'
    }
  },
  services: {
    catalog: {
      title: 'Services Catalog',
      empty: 'No services catalog items found for your tenant yet.',
      searchPlaceholder: 'Search the catalog…',
      produces: 'Produces',
      allProduces: 'All',
      activeOnly: 'Active only',
      offerings: 'Offerings',
      offeringsEmpty: 'No offerings found for this catalog item.',
      back: 'Back to catalog',
      detail: 'Catalog item',
      headers: { name: 'Name', code: 'Code', pricing: 'Pricing', model: 'Model' }
    },
    offerings: {
      title: 'Service offerings',
      empty: 'No service offerings found for your tenant yet.'
    },
    categories: {
      title: 'Services categories',
      empty: 'No services categories found for your tenant yet.'
    },
    proposals: {
      title: 'CEODigital Proposals',
      openCommand: 'CEODigital: Open Proposals',
      empty: 'No proposals found for your tenant yet.',
      new: 'New Proposal',
      back: 'Back to proposals',
      detail: 'Proposal detail',
      fields: {
        title: 'Title',
        status: 'Status',
        description: 'Description',
        currency: 'Currency',
        totalValue: 'Total value',
        paymentModel: 'Payment model',
        depositPercentage: 'Deposit %',
        validUntil: 'Valid until',
        terms: 'Terms',
        leadId: 'Lead id'
      },
      status: {
        draft: 'Draft',
        sent: 'Sent',
        accepted: 'Accepted',
        rejected: 'Rejected',
        cancelled: 'Cancelled',
        expired: 'Expired',
        pending: 'Pending'
      },
      actions: {
        send: 'Send',
        accept: 'Accept',
        reject: 'Reject',
        cancel: 'Cancel',
        duplicate: 'Duplicate',
        expire: 'Expire',
        addItem: 'Add line item',
        addTranche: 'Add tranche',
        save: 'Save',
        remove: 'Remove',
        sending: 'Sending…',
        accepting: 'Accepting…',
        rejecting: 'Rejecting…',
        cancelling: 'Cancelling…',
        duplicating: 'Duplicating…',
        expiring: 'Expiring…'
      },
      reject: { reasonPlaceholder: 'Reason (optional)…', cancel: 'Cancel' },
      items: {
        headers: {
          description: 'Description',
          quantity: 'Qty',
          unitPrice: 'Unit price',
          discount: 'Discount',
          vatRate: 'VAT %',
          recurrence: 'Recurrence'
        },
        empty: 'No line items on this proposal yet.',
        form: {
          serviceCatalogId: 'Service catalog id',
          serviceOfferingId: 'Offering id',
          quantity: 'Quantity',
          unitPrice: 'Unit price',
          discount: 'Discount',
          vatRate: 'VAT %',
          recurrence: 'Recurrence',
          description: 'Description',
          sortOrder: 'Sort order',
          add: 'Add item',
          update: 'Update item',
          cancel: 'Cancel'
        }
      },
      tranches: {
        headers: { label: 'Label', amount: 'Amount', dueDate: 'Due date', sortOrder: 'Sort order' },
        empty: 'No payment tranches on this proposal yet.',
        form: {
          label: 'Label',
          amount: 'Amount',
          dueDate: 'Due date',
          sortOrder: 'Sort order',
          add: 'Add tranche',
          update: 'Update tranche',
          cancel: 'Cancel'
        }
      },
      form: {
        title: 'Title',
        leadId: 'Lead id',
        description: 'Description',
        totalValue: 'Total value',
        paymentModel: 'Payment model',
        depositPercentage: 'Deposit %',
        validUntil: 'Valid until',
        currency: 'Currency',
        terms: 'Terms',
        create: 'Create proposal',
        cancel: 'Cancel'
      },
      errors: {
        create: 'Could not create the proposal.',
        send: 'Could not send the proposal.',
        accept: 'Could not accept the proposal.',
        reject: 'Could not reject the proposal.',
        cancel: 'Could not cancel the proposal.',
        duplicate: 'Could not duplicate the proposal.',
        expire: 'Could not expire the proposal.',
        addItem: 'Could not add the line item.',
        updateItem: 'Could not update the line item.',
        removeItem: 'Could not remove the line item.',
        addTranche: 'Could not add the tranche.',
        updateTranche: 'Could not update the tranche.',
        removeTranche: 'Could not remove the tranche.',
        fetchProposal: 'Could not load this proposal.',
        general: 'The action failed. Try again.'
      }
    }
  },
  automation: {
    conversations: {
      title: 'CEODigital Conversations',
      openCommand: 'CEODigital: Open Conversations',
      empty: 'No automation conversations found for your tenant yet.',
      search: 'Search conversations…',
      archivedOnly: 'Archived only',
      all: 'All',
      new: 'New Conversation',
      form: {
        title: 'Title',
        titlePlaceholder: 'Conversation title',
        systemPrompt: 'System prompt',
        model: 'Model',
        workspaceId: 'Workspace id',
        tags: 'Tags (comma-separated)',
        create: 'Create conversation',
        cancel: 'Cancel'
      },
      actions: {
        archive: 'Archive',
        share: 'Share',
        unshare: 'Unshare',
        archiving: 'Archiving…',
        sharing: 'Sharing…'
      },
      headers: {
        id: 'ID',
        title: 'Title',
        model: 'Model',
        archived: 'Archived',
        shared: 'Shared'
      }
    },
    playbooks: {
      title: 'CEODigital Playbooks',
      openCommand: 'CEODigital: Open Playbooks',
      empty: 'No playbooks found for your tenant yet.',
      back: 'Back to playbooks',
      detail: 'Playbook detail',
      run: 'Run playbook',
      running: 'Running…',
      filters: { all: 'All', active: 'Active', inactive: 'Inactive' },
      subjectType: 'Subject type',
      subjectId: 'Subject id',
      runFormTitle: 'Run playbook',
      runFormSubjectType: 'Subject type (required)',
      runFormSubjectId: 'Subject id (optional)',
      cancel: 'Cancel',
      runs: 'Runs',
      runsEmpty: 'No runs of this playbook yet.',
      runStatus: {
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled'
      },
      headers: { id: 'ID', title: 'Title', subject: 'Subject', active: 'Active' },
      runsHeaders: { id: 'ID', status: 'Status', subject: 'Subject', started: 'Started' }
    },
    workflows: {
      title: 'CEODigital NativeFlows',
      openCommand: 'CEODigital: Open NativeFlows',
      empty: 'No NativeFlow workflows found for your tenant yet.',
      back: 'Back to workflows',
      detail: 'Workflow detail',
      publish: 'Publish',
      publishing: 'Publishing…',
      run: 'Run workflow',
      running: 'Running…',
      filters: {
        all: 'All',
        draft: 'Draft',
        active: 'Active',
        archived: 'Archived'
      },
      triggers: {
        all: 'All triggers',
        manual: 'Manual',
        webhook: 'Webhook',
        schedule: 'Schedule',
        event: 'Event',
        api: 'API'
      },
      runInput: 'Input (JSON)',
      runInputPlaceholder: '{ "key": "value" }',
      webhooks: 'Webhooks',
      webhooksEmpty: 'No webhooks on this workflow.',
      schedules: 'Schedules',
      schedulesEmpty: 'No schedules on this workflow.',
      runs: 'Runs',
      runsEmpty: 'No runs of this workflow yet.',
      runStatus: {
        active: 'Active',
        completed: 'Completed',
        cancelled: 'Cancelled',
        failed: 'Failed'
      },
      headers: { id: 'ID', name: 'Name', status: 'Status', trigger: 'Trigger' },
      runsHeaders: { id: 'ID', status: 'Status', started: 'Started' },
      webhooksHeaders: { id: 'ID', url: 'URL', active: 'Active' },
      schedulesHeaders: { id: 'ID', cron: 'Cron', active: 'Active' },
      actions: {
        rotate: 'Rotate',
        pausing: 'Updating…',
        pause: 'Pause',
        resume: 'Resume',
        rotating: 'Rotating…'
      }
    }
  },
  documents: {
    files: {
      title: 'CEODigital Documents',
      openCommand: 'CEODigital: Open Documents',
      empty: 'No document files found for your tenant yet.',
      searchPlaceholder: 'Search the file library…',
      namespacePlaceholder: 'All namespaces',
      allNamespaces: 'All namespaces',
      visibility: 'Visibility',
      allVisibilities: 'All visibilities',
      upload: 'Upload file',
      uploadForm: {
        name: 'Name',
        namePlaceholder: 'File name',
        file: 'Choose file',
        namespace: 'Namespace',
        collection: 'Collection',
        submit: 'Upload',
        cancel: 'Cancel'
      },
      moveForm: {
        title: 'Move file',
        targetNamespace: 'Target namespace',
        targetCollection: 'Target collection',
        none: 'None (remove from collection)',
        submit: 'Move',
        cancel: 'Cancel'
      },
      addToCollectionForm: {
        title: 'Add to collection',
        collection: 'Collection',
        submit: 'Add',
        cancel: 'Cancel'
      },
      actions: {
        move: 'Move',
        delete: 'Delete',
        deleteConfirm: 'Delete file',
        addToCollection: 'Add to collection',
        moving: 'Moving…',
        deleting: 'Deleting…',
        adding: 'Adding…'
      },
      headers: {
        id: 'ID',
        title: 'Title',
        namespace: 'Namespace',
        visibility: 'Visibility',
        mime: 'MIME'
      },
      rag: {
        placeholder: 'Search documents…',
        search: 'Search',
        searching: 'Searching…',
        empty: 'No documents uploaded yet.',
        maxResults: 'Max results',
        resultsEmpty: 'No documents matched your search.',
        reindex: 'Reindex',
        reindexing: 'Reindexing…',
        reindexDone: 'Reindex started.'
      },
      errors: {
        list: 'Could not load the document library.',
        upload: 'Could not upload the file.',
        delete: 'Could not delete the file.',
        move: 'Could not move the file.',
        addToCollection: 'Could not add the file to the collection.',
        search: 'Could not search documents.',
        reindex: 'Could not start the reindex.',
        general: 'The action failed. Try again.'
      }
    },
    collections: {
      title: 'CEODigital Collections',
      openCommand: 'CEODigital: Open Collections',
      empty: 'No document collections found for your tenant yet.',
      new: 'New Collection',
      createForm: {
        name: 'Name',
        namePlaceholder: 'Collection name',
        description: 'Description',
        color: 'Color',
        icon: 'Icon',
        parentId: 'Parent id',
        create: 'Create collection',
        cancel: 'Cancel'
      },
      members: 'Members',
      addFile: 'Add file',
      addFilePlaceholder: 'Add a file by id…',
      removeFile: 'Remove',
      noMembers: 'No files in this collection yet.',
      headers: { id: 'ID', title: 'Title', description: 'Description', members: 'Members' },
      errors: {
        list: 'Could not load the collections.',
        create: 'Could not create the collection.',
        addFile: 'Could not add the file.',
        removeFile: 'Could not remove the file.',
        general: 'The action failed. Try again.'
      }
    },
    bindings: {
      title: 'CEODigital Bindings',
      openCommand: 'CEODigital: Open Bindings',
      empty: 'No document bindings match this filter.',
      entityType: 'Entity type',
      entityTypePlaceholder: 'project, task, crm_org…',
      entityId: 'Entity id',
      entityIdPlaceholder: 'Entity id (required)',
      direction: 'Direction',
      allDirections: 'All directions',
      input: 'Input',
      output: 'Output',
      attach: 'Attach binding',
      attachForm: {
        entityType: 'Entity type',
        entityTypePlaceholder: 'project, task, crm_org, crm_deal, service_impl, chat_conv',
        entityId: 'Entity id',
        entityIdPlaceholder: 'Entity id (required)',
        direction: 'Direction',
        bindingId: 'Binding id',
        bindingIdPlaceholder: 'Binding id (required)',
        targetRef: 'Target ref (JSON)',
        syncMode: 'Sync mode',
        publishMode: 'Publish mode',
        ragIndex: 'RAG index',
        outputFormat: 'Output format',
        nameTemplate: 'Name template',
        submit: 'Attach',
        cancel: 'Cancel'
      },
      detach: 'Detach',
      detaching: 'Detaching…',
      headers: {
        id: 'ID',
        entity: 'Entity',
        direction: 'Direction',
        binding: 'Binding',
        sync: 'Sync',
        publish: 'Publish',
        rag: 'RAG',
        output: 'Output'
      },
      errors: {
        list: 'Could not load the bindings.',
        attach: 'Could not attach the binding.',
        detach: 'Could not detach the binding.',
        general: 'The action failed. Try again.'
      }
    }
  },
  messaging: {
    title: 'CEODigital Messaging',
    openCommand: 'CEODigital: Open Messaging',
    empty: 'No messaging threads found for your tenant yet.',
    newThread: 'New Thread',
    allTypes: 'All types',
    threadType: 'Thread type',
    refTable: 'Ref table',
    refId: 'Ref id',
    back: 'Back to threads',
    detail: 'Thread detail',
    messagesEmpty: 'No messages in this thread yet.',
    postPlaceholder: 'Write a message…',
    emojiPlaceholder: 'Emoji',
    fileId: 'File id',
    attachmentName: 'Attachment name',
    headers: { id: 'ID', title: 'Title', type: 'Type', created: 'Created' },
    form: {
      subject: 'Subject',
      subjectPlaceholder: 'Thread subject',
      create: 'Create thread',
      cancel: 'Cancel'
    },
    actions: {
      post: 'Send',
      react: 'React',
      markRead: 'Mark read',
      uploadAttachment: 'Attach',
      posting: 'Sending…',
      reacting: 'Reacting…',
      uploading: 'Uploading…'
    },
    errors: {
      list: 'Could not load the messaging threads.',
      create: 'Could not create the thread.',
      post: 'Could not post the message.',
      react: 'Could not react to the message.',
      markRead: 'Could not mark the message read.',
      upload: 'Could not attach the file.',
      fetchMessages: 'Could not load the messages.',
      fetchThread: 'Could not load this thread.',
      general: 'The action failed. Try again.'
    }
  },
  notifications: {
    title: 'CEODigital Notifications',
    openCommand: 'CEODigital: Open Notifications',
    empty: 'No notifications for you right now.',
    all: 'All',
    unreadOnly: 'Unread',
    unreadCount: 'Unread',
    markAllRead: 'Mark all read',
    markRead: 'Read',
    marking: 'Marking…',
    headers: { id: 'ID', title: 'Title', type: 'Type', created: 'Created' },
    errors: {
      list: 'Could not load your notifications.',
      markRead: 'Could not mark the notification read.',
      markAll: 'Could not mark all notifications read.',
      general: 'The action failed. Try again.'
    }
  },
  timeline: {
    title: 'CEODigital Timeline',
    openCommand: 'CEODigital: Open Timeline',
    empty: 'No timeline events found for your tenant yet.',
    entityType: 'Entity type',
    entityId: 'Entity id',
    actorUserId: 'Actor id',
    eventGlob: 'Event glob',
    pin: 'Pin',
    unpin: 'Unpin',
    addReaction: 'React',
    removeReaction: 'Remove',
    reactions: 'Reactions',
    headers: { id: 'ID', event: 'Event', entity: 'Entity', actor: 'Actor', at: 'At' },
    actions: {
      pinning: 'Pinning…',
      unpinning: 'Unpinning…',
      reacting: 'Reacting…'
    },
    errors: {
      list: 'Could not load the timeline events.',
      pin: 'Could not pin the event.',
      unpin: 'Could not unpin the event.',
      addReaction: 'Could not add the reaction.',
      removeReaction: 'Could not remove the reaction.',
      general: 'The action failed. Try again.'
    }
  },
  implementations: {
    title: 'CEODigital Implementations',
    openCommand: 'CEODigital: Open Implementations',
    empty: 'No implementation projects found for your tenant yet.',
    search: 'Search projects…',
    allStatuses: 'All statuses',
    status: 'Status',
    clientVisible: 'Client visible',
    back: 'Back to projects',
    detail: 'Project detail',
    phases: 'Phases',
    phasesEmpty: 'No phases on this project yet.',
    files: 'Files',
    filesEmpty: 'No files on this project yet.',
    messages: 'Messages',
    messagesEmpty: 'No messages on this project yet.',
    changeStatus: 'Change status',
    complete: 'Complete',
    completing: 'Completing…',
    cancel: 'Cancel',
    cancelling: 'Cancelling…',
    postMessage: 'Post message',
    messagePlaceholder: 'Write a message…',
    posting: 'Posting…',
    projectStatus: {
      planned: 'Planned',
      in_progress: 'In progress',
      on_hold: 'On hold',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    },
    phaseStatus: {
      planned: 'Planned',
      in_progress: 'In progress',
      done: 'Done',
      cancelled: 'Cancelled'
    },
    headers: { id: 'ID', title: 'Title', status: 'Status', clientVisible: 'Client' },
    phaseHeaders: { id: 'ID', title: 'Title', status: 'Status' },
    fileHeaders: { id: 'ID', name: 'Name', size: 'Size' },
    errors: {
      list: 'Could not load the implementation projects.',
      fetchProject: 'Could not load this project.',
      changeStatus: 'Could not change the project status.',
      complete: 'Could not complete the project.',
      cancel: 'Could not cancel the project.',
      changePhaseStatus: 'Could not change the phase status.',
      fetchPhases: 'Could not load the phases.',
      fetchFiles: 'Could not load the files.',
      fetchMessages: 'Could not load the messages.',
      postMessage: 'Could not post the message.',
      general: 'The action failed. Try again.'
    }
  },
  workspaces: {
    title: 'CEODigital Workspaces',
    openCommand: 'CEODigital: Open Workspaces',
    empty: 'No workspaces found for your tenant yet.',
    new: 'New Workspace',
    search: 'Search workspaces…',
    archivedOnly: 'Archived only',
    all: 'All',
    back: 'Back to workspaces',
    detail: 'Workspace detail',
    members: 'Members',
    membersEmpty: 'No members in this workspace yet.',
    role: 'Role',
    allRoles: 'All roles',
    memberRoles: { lead: 'Lead', member: 'Member', viewer: 'Viewer' },
    addMember: 'Add member',
    addMemberPlaceholder: 'Add a member by user id…',
    removeMember: 'Remove',
    adding: 'Adding…',
    removing: 'Removing…',
    createForm: {
      name: 'Name',
      namePlaceholder: 'Workspace name',
      description: 'Description',
      categoryId: 'Category id',
      icon: 'Icon',
      color: 'Color',
      create: 'Create workspace',
      cancel: 'Cancel'
    },
    headers: { id: 'ID', title: 'Title', description: 'Description', members: 'Members' },
    memberHeaders: { id: 'ID', name: 'Name', role: 'Role' },
    errors: {
      list: 'Could not load the workspaces.',
      create: 'Could not create the workspace.',
      addMember: 'Could not add the member.',
      removeMember: 'Could not remove the member.',
      fetchMembers: 'Could not load the members.',
      general: 'The action failed. Try again.'
    }
  },
  departments: {
    title: 'CEODigital Departments',
    openCommand: 'CEODigital: Open Departments',
    empty: 'No departments found for your tenant yet.',
    new: 'New Department',
    search: 'Search departments…',
    activeOnly: 'Active only',
    all: 'All',
    back: 'Back to departments',
    detail: 'Department detail',
    members: 'Members',
    membersEmpty: 'No members in this department yet.',
    role: 'Role',
    allRoles: 'All roles',
    memberRoles: { head: 'Head', member: 'Member' },
    addMember: 'Add member',
    addMemberPlaceholder: 'Add a member by user id…',
    removeMember: 'Remove',
    adding: 'Adding…',
    removing: 'Removing…',
    createForm: {
      name: 'Name',
      namePlaceholder: 'Department name',
      slugKey: 'Slug key',
      slugKeyPlaceholder: 'e.g. engineering',
      areas: 'Areas (comma-separated)',
      areasPlaceholder: 'Design, Backend, …',
      headId: 'Head (user id)',
      headIdPlaceholder: 'User id of the department head',
      create: 'Create department',
      cancel: 'Cancel'
    },
    headers: { id: 'ID', title: 'Title', slug: 'Slug', areas: 'Areas', active: 'Active' },
    memberHeaders: { id: 'ID', name: 'Name', role: 'Role' },
    actions: { remove: 'Remove' },
    errors: {
      list: 'Could not load the departments.',
      create: 'Could not create the department.',
      addMember: 'Could not add the member.',
      removeMember: 'Could not remove the member.',
      fetchMembers: 'Could not load the members.',
      general: 'The action failed. Try again.'
    }
  },
  members: {
    title: 'CEODigital Members',
    openCommand: 'CEODigital: Open Members',
    empty: 'No members found for your tenant yet.',
    invite: 'Invite member',
    allRoles: 'All roles',
    role: 'Role',
    inviteForm: {
      email: 'Email',
      emailPlaceholder: 'member@company.com',
      role: 'Role',
      create: 'Send invite',
      cancel: 'Cancel'
    },
    revoke: 'Revoke',
    revoking: 'Revoking…',
    updateRole: 'Update role',
    updating: 'Updating…',
    headers: { id: 'ID', name: 'Name', email: 'Email', role: 'Role' },
    errors: {
      list: 'Could not load the members.',
      invite: 'Could not invite the member.',
      revoke: 'Could not revoke the member.',
      updateRole: 'Could not update the role.',
      general: 'The action failed. Try again.'
    }
  },
  integrations: {
    title: 'CEODigital Integrations',
    openCommand: 'CEODigital: Open Integrations',
    empty: 'No integrations connected yet.',
    connect: 'Connect integration',
    allProviders: 'All providers',
    allStatuses: 'All statuses',
    allScopes: 'All scopes',
    providerCode: 'Provider',
    status: 'Status',
    scope: 'Scope',
    scopes: { user: 'User', tenant: 'Tenant' },
    statuses: { pending: 'Pending', active: 'Active', error: 'Error', revoked: 'Revoked' },
    connectForm: {
      providerCode: 'Provider code',
      providerCodePlaceholder: 'e.g. gmail',
      appSlug: 'App slug',
      appSlugPlaceholder: 'e.g. gmail',
      scope: 'Scope',
      mailboxKey: 'Mailbox key',
      mailboxKeyPlaceholder: 'e.g. default',
      mailboxLabel: 'Mailbox label',
      mailboxLabelPlaceholder: 'Display name for this mailbox',
      connect: 'Connect',
      cancel: 'Cancel'
    },
    test: 'Test',
    testing: 'Testing…',
    disconnect: 'Disconnect',
    disconnecting: 'Disconnecting…',
    detail: 'Integration detail',
    back: 'Back to integrations',
    headers: { id: 'ID', provider: 'Provider', app: 'App', status: 'Status', scope: 'Scope', mailbox: 'Mailbox' },
    errors: {
      list: 'Could not load the integrations.',
      connect: 'Could not connect the integration.',
      test: 'Could not test the integration.',
      disconnect: 'Could not disconnect the integration.',
      fetchIntegration: 'Could not load this integration.',
      general: 'The action failed. Try again.'
    }
  },
  errors: {
    fetch: 'Could not load CEODigital projects.',
    general: 'The action failed. Try again.',
    mcp_not_configured: 'CEODigital MCP is not configured. Connect it in your CEODigital settings first.',
    mcp_unreachable: 'CEODigital is unreachable right now. Check your connection and try again.',
    tenant_not_found: 'No CEODigital tenant is linked to this profile.'
  }
}