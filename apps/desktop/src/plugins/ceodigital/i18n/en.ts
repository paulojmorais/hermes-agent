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
  crm: {
    leads: {
      title: 'CEODigital Leads',
      empty: 'No CRM leads found for your tenant yet.'
    },
    deals: {
      title: 'CEODigital Deals',
      empty: 'No CRM deals found for your tenant yet.'
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
    }
  },
  errors: {
    fetch: 'Could not load CEODigital projects.',
    mcp_not_configured: 'CEODigital MCP is not configured. Connect it in your CEODigital settings first.',
    mcp_unreachable: 'CEODigital is unreachable right now. Check your connection and try again.',
    tenant_not_found: 'No CEODigital tenant is linked to this profile.'
  }
}