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
import { CatalogPage } from './pages/Catalog'
import { DealsPage } from './pages/Deals'
import { LeadsPage } from './pages/Leads'
import { OrganizationsPage } from './pages/Organizations'
import { PersonsPage } from './pages/Persons'
import { PipelinesPage } from './pages/Pipelines'
import { ProjectsPage } from './pages/Projects'
import { ProposalsPage } from './pages/Proposals'
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
      }
    ])
  }
}

export default plugin