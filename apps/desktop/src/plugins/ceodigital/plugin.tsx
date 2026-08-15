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
import { DealsPage } from './pages/Deals'
import { LeadsPage } from './pages/Leads'
import { ProjectsPage } from './pages/Projects'

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
      }
    ])
  }
}

export default plugin