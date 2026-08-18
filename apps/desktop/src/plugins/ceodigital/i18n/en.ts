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
  errors: {
    fetch: 'Could not load CEODigital projects.',
    mcp_not_configured: 'CEODigital MCP is not configured. Connect it in your CEODigital settings first.',
    mcp_unreachable: 'CEODigital is unreachable right now. Check your connection and try again.',
    tenant_not_found: 'No CEODigital tenant is linked to this profile.'
  }
}