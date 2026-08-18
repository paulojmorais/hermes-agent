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
  errors: {
    fetch: 'Could not load CEODigital projects.',
    general: 'The action failed. Try again.',
    mcp_not_configured: 'CEODigital MCP is not configured. Connect it in your CEODigital settings first.',
    mcp_unreachable: 'CEODigital is unreachable right now. Check your connection and try again.',
    tenant_not_found: 'No CEODigital tenant is linked to this profile.'
  }
}