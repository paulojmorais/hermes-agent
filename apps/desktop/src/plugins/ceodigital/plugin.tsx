/**
 * CEODigital — the product plugin. A first-class `/ceodigital/projects` page +
 * sidebar row + ⌘K row, all read through the plugin's OWN REST namespace
 * (`/api/plugins/ceodigital/*`, served by the parallel backend wave's
 * `plugin_api.py` proxy over the CEODigital MCP server). No new core surface,
 * no renderer MCP tokens: the renderer only ever sees clean JSON via `ctx.rest`.
 *
 * Ships ON by default (`defaultEnabled: true`) — this is the product plugin,
 * not a demo. W3 is read-only; work-item editing arrives in W4.
 */

import {
  type HermesPlugin,
  host,
  type PaletteContribution,
  PALETTE_AREA,
  type RouteContribution,
  ROUTES_AREA,
  type SidebarNavContribution,
  SIDEBAR_NAV_AREA
} from '@hermes/plugin-sdk'

import { bindApi } from './api'
import { CEODIGITAL_LOCALES } from './i18n'
import { ActivitiesPage } from './pages/Activities'
import { AgentsPage } from './pages/Agents'
import { BindingsPage } from './pages/Bindings'
import { CatalogPage } from './pages/Catalog'
import { CollectionsPage } from './pages/Collections'
import { ConversationsPage } from './pages/Conversations'
import { DealsPage } from './pages/Deals'
import { DocumentsPage } from './pages/Documents'
import { ImplementationsPage } from './pages/Implementations'
import { LeadsPage } from './pages/Leads'
import { MessagingPage } from './pages/Messaging'
import { NotificationsPage } from './pages/Notifications'
import { OrganizationsPage } from './pages/Organizations'
import { PersonsPage } from './pages/Persons'
import { PipelinesPage } from './pages/Pipelines'
import { PlaybooksPage } from './pages/Playbooks'
import { ProjectsPage } from './pages/Projects'
import { ProposalsPage } from './pages/Proposals'
import { TimelinePage } from './pages/Timeline'
import { WorkflowsPage } from './pages/Workflows'
import { WorkitemsPage } from './pages/Workitems'

const plugin: HermesPlugin = {
  id: 'ceodigital',
  name: 'CEODigital',
  description: 'Manage your CEODigital tenant from the desktop — work items, CRM and agents across the MCP.',
  defaultEnabled: true,
  register(ctx) {
    ctx.i18n.register(CEODIGITAL_LOCALES)
    ctx.onDispose(bindApi(ctx.rest))

    // ⌘K row label — resolved once at load against the active locale; the
    // sidebar row uses i18n as well so the brand copy follows `display.language`.
    const t = ctx.i18n.t

    ctx.registerMany([
      {
        id: 'catalog-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/catalog' } satisfies RouteContribution,
        render: () => <CatalogPage />
      },
      {
        id: 'catalog-nav',
        area: SIDEBAR_NAV_AREA,
        order: 47,
        data: {
          codicon: 'package',
          label: t('services.catalog.title'),
          path: '/ceodigital/catalog'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-catalog',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openCatalog',
          label: t('services.catalog.title'),
          keywords: ['ceodigital', 'services', 'catalog', 'offerings'],
          run: () => host.navigate('/ceodigital/catalog')
        } satisfies PaletteContribution
      },
      {
        id: 'proposals-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/proposals' } satisfies RouteContribution,
        render: () => <ProposalsPage />
      },
      {
        id: 'proposals-nav',
        area: SIDEBAR_NAV_AREA,
        order: 48,
        data: {
          codicon: 'file',
          label: t('services.proposals.title'),
          path: '/ceodigital/proposals'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-proposals',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openProposals',
          label: t('services.proposals.title'),
          keywords: ['ceodigital', 'services', 'proposals', 'quotes'],
          run: () => host.navigate('/ceodigital/proposals')
        } satisfies PaletteContribution
      },
      {
        id: 'workitems-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/workitems' } satisfies RouteContribution,
        render: () => <WorkitemsPage />
      },
      {
        id: 'workitems-nav',
        area: SIDEBAR_NAV_AREA,
        order: 39,
        data: {
          codicon: 'checklist',
          label: t('workitems.title'),
          path: '/ceodigital/workitems'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-workitems',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openWorkitems',
          label: t('workitems.title'),
          keywords: ['ceodigital', 'workitems', 'work', 'sop'],
          run: () => host.navigate('/ceodigital/workitems')
        } satisfies PaletteContribution
      },
      {
        id: 'projects-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/projects' } satisfies RouteContribution,
        render: () => <ProjectsPage />
      },
      {
        id: 'projects-nav',
        area: SIDEBAR_NAV_AREA,
        order: 40,
        data: {
          codicon: 'folder',
          label: t('nav.label'),
          path: '/ceodigital/projects'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-projects',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openProjects',
          label: t('page.openCommand'),
          keywords: ['ceodigital', 'projects', 'work', 'crm', 'tenant'],
          run: () => host.navigate('/ceodigital/projects')
        } satisfies PaletteContribution
      },
      {
        id: 'leads-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/leads' } satisfies RouteContribution,
        render: () => <LeadsPage />
      },
      {
        id: 'leads-nav',
        area: SIDEBAR_NAV_AREA,
        order: 40,
        data: {
          codicon: 'account',
          label: t('crm.leads.title'),
          path: '/ceodigital/leads'
        } satisfies SidebarNavContribution
      },
      {
        id: 'deals-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/deals' } satisfies RouteContribution,
        render: () => <DealsPage />
      },
      {
        id: 'deals-nav',
        area: SIDEBAR_NAV_AREA,
        order: 41,
        data: {
          codicon: 'briefcase',
          label: t('crm.deals.title'),
          path: '/ceodigital/deals'
        } satisfies SidebarNavContribution
      },
      {
        id: 'persons-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/persons' } satisfies RouteContribution,
        render: () => <PersonsPage />
      },
      {
        id: 'persons-nav',
        area: SIDEBAR_NAV_AREA,
        order: 43,
        data: {
          codicon: 'person',
          label: t('crm.persons.title'),
          path: '/ceodigital/persons'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-persons',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openPersons',
          label: t('crm.persons.title'),
          keywords: ['ceodigital', 'crm', 'persons', 'people'],
          run: () => host.navigate('/ceodigital/persons')
        } satisfies PaletteContribution
      },
      {
        id: 'organizations-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/organizations' } satisfies RouteContribution,
        render: () => <OrganizationsPage />
      },
      {
        id: 'organizations-nav',
        area: SIDEBAR_NAV_AREA,
        order: 44,
        data: {
          codicon: 'organization',
          label: t('crm.organizations.title'),
          path: '/ceodigital/organizations'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-organizations',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openOrganizations',
          label: t('crm.organizations.title'),
          keywords: ['ceodigital', 'crm', 'organizations', 'companies'],
          run: () => host.navigate('/ceodigital/organizations')
        } satisfies PaletteContribution
      },
      {
        id: 'pipelines-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/pipelines' } satisfies RouteContribution,
        render: () => <PipelinesPage />
      },
      {
        id: 'pipelines-nav',
        area: SIDEBAR_NAV_AREA,
        order: 45,
        data: {
          codicon: 'git-branch',
          label: t('crm.pipelines.title'),
          path: '/ceodigital/pipelines'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-pipelines',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openPipelines',
          label: t('crm.pipelines.title'),
          keywords: ['ceodigital', 'crm', 'pipelines', 'stages'],
          run: () => host.navigate('/ceodigital/pipelines')
        } satisfies PaletteContribution
      },
      {
        id: 'activities-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/activities' } satisfies RouteContribution,
        render: () => <ActivitiesPage />
      },
      {
        id: 'activities-nav',
        area: SIDEBAR_NAV_AREA,
        order: 46,
        data: {
          codicon: 'history',
          label: t('crm.activities.title'),
          path: '/ceodigital/activities'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-activities',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openActivities',
          label: t('crm.activities.title'),
          keywords: ['ceodigital', 'crm', 'activities', 'notes'],
          run: () => host.navigate('/ceodigital/activities')
        } satisfies PaletteContribution
      },
      {
        id: 'agents-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/agents' } satisfies RouteContribution,
        render: () => <AgentsPage />
      },
      {
        id: 'agents-nav',
        area: SIDEBAR_NAV_AREA,
        order: 42,
        data: {
          codicon: 'hubot',
          label: t('agents.title'),
          path: '/ceodigital/agents'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-agents',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openAgents',
          label: t('agents.title'),
          keywords: ['ceodigital', 'agents', 'ceo', 'nativeflow'],
          run: () => host.navigate('/ceodigital/agents')
        } satisfies PaletteContribution
      },
      {
        id: 'conversations-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/automation/conversations' } satisfies RouteContribution,
        render: () => <ConversationsPage />
      },
      {
        id: 'conversations-nav',
        area: SIDEBAR_NAV_AREA,
        order: 50,
        data: {
          codicon: 'comment',
          label: t('automation.conversations.title'),
          path: '/ceodigital/automation/conversations'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-conversations',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openConversations',
          label: t('automation.conversations.title'),
          keywords: ['ceodigital', 'automation', 'conversations', 'chat'],
          run: () => host.navigate('/ceodigital/automation/conversations')
        } satisfies PaletteContribution
      },
      {
        id: 'playbooks-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/automation/playbooks' } satisfies RouteContribution,
        render: () => <PlaybooksPage />
      },
      {
        id: 'playbooks-nav',
        area: SIDEBAR_NAV_AREA,
        order: 51,
        data: {
          codicon: 'book',
          label: t('automation.playbooks.title'),
          path: '/ceodigital/automation/playbooks'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-playbooks',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openPlaybooks',
          label: t('automation.playbooks.title'),
          keywords: ['ceodigital', 'automation', 'playbooks', 'runbooks'],
          run: () => host.navigate('/ceodigital/automation/playbooks')
        } satisfies PaletteContribution
      },
      {
        id: 'workflows-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/automation/workflows' } satisfies RouteContribution,
        render: () => <WorkflowsPage />
      },
      {
        id: 'workflows-nav',
        area: SIDEBAR_NAV_AREA,
        order: 52,
        data: {
          codicon: 'hubot',
          label: t('automation.workflows.title'),
          path: '/ceodigital/automation/workflows'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-workflows',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openWorkflows',
          label: t('automation.workflows.title'),
          keywords: ['ceodigital', 'automation', 'workflows', 'nativeflow', 'agentflow'],
          run: () => host.navigate('/ceodigital/automation/workflows')
        } satisfies PaletteContribution
      },
      {
        id: 'documents-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/documents' } satisfies RouteContribution,
        render: () => <DocumentsPage />
      },
      {
        id: 'documents-nav',
        area: SIDEBAR_NAV_AREA,
        order: 53,
        data: {
          codicon: 'file',
          label: t('documents.files.title'),
          path: '/ceodigital/documents'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-documents',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openDocuments',
          label: t('documents.files.title'),
          keywords: ['ceodigital', 'documents', 'files', 'library', 'rag', 'search'],
          run: () => host.navigate('/ceodigital/documents')
        } satisfies PaletteContribution
      },
      {
        id: 'collections-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/collections' } satisfies RouteContribution,
        render: () => <CollectionsPage />
      },
      {
        id: 'collections-nav',
        area: SIDEBAR_NAV_AREA,
        order: 54,
        data: {
          codicon: 'library',
          label: t('documents.collections.title'),
          path: '/ceodigital/collections'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-collections',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openCollections',
          label: t('documents.collections.title'),
          keywords: ['ceodigital', 'documents', 'collections', 'library'],
          run: () => host.navigate('/ceodigital/collections')
        } satisfies PaletteContribution
      },
      {
        id: 'bindings-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/bindings' } satisfies RouteContribution,
        render: () => <BindingsPage />
      },
      {
        id: 'bindings-nav',
        area: SIDEBAR_NAV_AREA,
        order: 55,
        data: {
          codicon: 'link',
          label: t('documents.bindings.title'),
          path: '/ceodigital/bindings'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-bindings',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openBindings',
          label: t('documents.bindings.title'),
          keywords: ['ceodigital', 'documents', 'bindings', 'links'],
          run: () => host.navigate('/ceodigital/bindings')
        } satisfies PaletteContribution
      },
      {
        id: 'messaging-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/messaging' } satisfies RouteContribution,
        render: () => <MessagingPage />
      },
      {
        id: 'messaging-nav',
        area: SIDEBAR_NAV_AREA,
        order: 56,
        data: {
          codicon: 'comment-discussion',
          label: t('messaging.title'),
          path: '/ceodigital/messaging'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-messaging',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openMessaging',
          label: t('messaging.title'),
          keywords: ['ceodigital', 'messaging', 'threads', 'messages', 'chat'],
          run: () => host.navigate('/ceodigital/messaging')
        } satisfies PaletteContribution
      },
      {
        id: 'notifications-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/notifications' } satisfies RouteContribution,
        render: () => <NotificationsPage />
      },
      {
        id: 'notifications-nav',
        area: SIDEBAR_NAV_AREA,
        order: 57,
        data: {
          codicon: 'bell',
          label: t('notifications.title'),
          path: '/ceodigital/notifications'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-notifications',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openNotifications',
          label: t('notifications.title'),
          keywords: ['ceodigital', 'notifications', 'inbox', 'alerts'],
          run: () => host.navigate('/ceodigital/notifications')
        } satisfies PaletteContribution
      },
      {
        id: 'timeline-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/timeline' } satisfies RouteContribution,
        render: () => <TimelinePage />
      },
      {
        id: 'timeline-nav',
        area: SIDEBAR_NAV_AREA,
        order: 58,
        data: {
          codicon: 'list-unordered',
          label: t('timeline.title'),
          path: '/ceodigital/timeline'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-timeline',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openTimeline',
          label: t('timeline.title'),
          keywords: ['ceodigital', 'timeline', 'events', 'activity', 'feed'],
          run: () => host.navigate('/ceodigital/timeline')
        } satisfies PaletteContribution
      },
      {
        id: 'implementations-page',
        area: ROUTES_AREA,
        data: { path: '/ceodigital/implementations' } satisfies RouteContribution,
        render: () => <ImplementationsPage />
      },
      {
        id: 'implementations-nav',
        area: SIDEBAR_NAV_AREA,
        order: 59,
        data: {
          codicon: 'rocket',
          label: t('implementations.title'),
          path: '/ceodigital/implementations'
        } satisfies SidebarNavContribution
      },
      {
        id: 'open-implementations',
        area: PALETTE_AREA,
        data: {
          id: 'ceodigital.openImplementations',
          label: t('implementations.title'),
          keywords: ['ceodigital', 'implementations', 'projects', 'phases', 'delivery'],
          run: () => host.navigate('/ceodigital/implementations')
        } satisfies PaletteContribution
      }
    ])
  }
}

export default plugin