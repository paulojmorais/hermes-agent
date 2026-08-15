import { type PluginContext, type PluginContribution } from '@hermes/plugin-sdk'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CEODIGITAL_LOCALES } from './i18n'
import plugin from './plugin'

interface Harness {
  contributions: PluginContribution[]
  i18nRegister: ReturnType<typeof vi.fn>
  onDispose: ReturnType<typeof vi.fn>
  rest: ReturnType<typeof vi.fn>
}

function makeCtx(): Harness & { register: () => void } {
  const contributions: PluginContribution[] = []
  const i18nRegister = vi.fn(() => () => undefined)
  const onDispose = vi.fn<() => void>()
  const rest = vi.fn()
  const t = vi.fn((key: string) => key)

  const ctx = {
    source: 'plugin:ceodigital',
    register: vi.fn(),
    registerMany: vi.fn((cs: PluginContribution[]) => {
      contributions.push(...cs)
    }),
    onDispose,
    rest,
    socket: vi.fn(),
    os: {},
    storage: {},
    i18n: { register: i18nRegister, t }
  } as unknown as PluginContext

  return {
    contributions,
    ctx,
    register: () => plugin.register(ctx),
    i18nRegister,
    onDispose,
    rest
  }
}

describe('ceodigital plugin', () => {
  let h: ReturnType<typeof makeCtx>

  beforeEach(() => {
    h = makeCtx()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ships ON by default — the product plugin, not a demo', () => {
    expect(plugin.id).toBe('ceodigital')
    expect(plugin.name).toBe('CEODigital')
    expect(plugin.defaultEnabled).toBe(true)
  })

  it('registers i18n bundles and binds the REST door on dispose', () => {
    h.register()

    expect(h.i18nRegister).toHaveBeenCalledTimes(1)
    expect(h.i18nRegister).toHaveBeenCalledWith(CEODIGITAL_LOCALES)
    expect(h.onDispose).toHaveBeenCalledTimes(2)
  })

  it('registers one route page, one sidebar row and one palette command', () => {
    h.register()

    expect(h.contributions.length).toBeGreaterThanOrEqual(3)
    expect(
      h.contributions.some(c => c.area === 'routes' && (c.data as { path?: string }).path === '/ceodigital/projects')
    ).toBe(true)
    expect(
      h.contributions.some(
        c => c.area === 'sidebar.nav' && (c.data as { codicon?: string }).codicon === 'folder'
      )
    ).toBe(true)
    expect(
      h.contributions.some(
        c => c.area === 'palette' && (c.data as { id?: string }).id === 'ceodigital.openProjects'
      )
    ).toBe(true)
  })

  it('registers the CRM pages (leads + deals) and their sidebar rows', () => {
    h.register()

    const paths = h.contributions
      .filter(c => c.area === 'routes')
      .map(c => (c.data as { path?: string }).path)
    expect(paths).toContain('/ceodigital/leads')
    expect(paths).toContain('/ceodigital/deals')

    const sidebarPaths = h.contributions
      .filter(c => c.area === 'sidebar.nav')
      .map(c => (c.data as { path?: string }).path)
    expect(sidebarPaths).toContain('/ceodigital/leads')
    expect(sidebarPaths).toContain('/ceodigital/deals')
  })

  it('routes the palette command to the projects page', () => {
    h.register()

    const palette = h.contributions.find(
      c => c.area === 'palette' && (c.data as { id?: string }).id === 'ceodigital.openProjects'
    )
    expect(palette).toBeDefined()
  })
})