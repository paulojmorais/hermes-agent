/**
 * CEODigital Dashboards page (W8-UI-a) — the tenant's dashboards with widget
 * management, proxied via `/api/plugins/ceodigital/dashboards` (MCP
 * `dashboards.*`):
 *   * list     (GET  /dashboards?limit)
 *   * create   (POST /dashboards {title?, icon?, position?})
 *   * detail   (GET  /dashboards/{id})
 *   * widgets  (GET  /dashboards/{id}/widgets)
 *   * add      (POST /dashboards/{id}/widgets {spec, size?, positionIndex?})
 *   * remove   (POST /dashboards/widgets/{widgetId}/remove)
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  addDashboardWidget,
  createDashboard,
  DASHBOARDS_KEY,
  dashboardWidgetsKey,
  dashboardKey,
  fetchDashboard,
  fetchDashboardWidgets,
  fetchDashboards,
  removeDashboardWidget
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, DashboardRow, WidgetRow, WidgetSize } from '../types'
import { WIDGET_SIZES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function dashboardsErrorCode(err: unknown): CeodigitalErrorCode | null {
  if (err && typeof err === 'object' && 'error' in err) {
    const code = (err as { error?: unknown }).error
    return typeof code === 'string' ? asKnownCode(code) : null
  }
  const raw = err instanceof Error ? err.message : String(err)
  for (const code of KNOWN_CODES) {
    if (raw.includes(code)) return code
  }
  return null
}

function isOk(data: unknown): boolean {
  return !!data && typeof data === 'object' && (data as { ok?: unknown }).ok === true
}

const widgetTitle = (w: WidgetRow): string => {
  const spec = w.spec && typeof w.spec === 'object' ? (w.spec as Record<string, unknown>) : {}
  const title = typeof spec.title === 'string' ? spec.title : ''
  const kind = typeof spec.kind === 'string' ? spec.kind : ''
  return title || kind || w.id
}

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

export function DashboardsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('')
  const [position, setPosition] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: DASHBOARDS_KEY,
    queryFn: () => fetchDashboards()
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { dashboards: DashboardRow[] }).dashboards }
    }
    return { code: dashboardsErrorCode(listQ.error), rows: [] as DashboardRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const detailQ = useQuery({
    queryKey: selectedId ? dashboardKey(selectedId) : [...dashboardKey(''), null],
    queryFn: () => fetchDashboard(selectedId as string),
    enabled: !!selectedId
  })

  const selected = selectedId && isOk(detailQ.data) ? (detailQ.data as { dashboard: DashboardRow }).dashboard : null

  const refresh = () => void qc.invalidateQueries({ queryKey: DASHBOARDS_KEY })

  const resetCreateForm = () => {
    setTitle('')
    setIcon('')
    setPosition('')
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createDashboard({
        title: title.trim() || undefined,
        icon: icon.trim() || undefined,
        position: position.trim() !== '' ? Number(position) : undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetCreateForm()
      refresh()
    },
    onError: err => setActionError(dashboardsErrorCode(err) ?? k.dashboards.errors.create)
  })

  const openDetail = (id: string) => {
    setActionError(null)
    setSelectedId(id)
  }

  if (selectedId) {
    if (detailQ.isLoading) {
      return (
        <div className="grid h-full place-items-center bg-(--ui-surface-background)">
          <Loader type="lemniscate-bloom" />
        </div>
      )
    }
    if (!selected) {
      return (
        <div className="grid h-full place-items-center bg-(--ui-surface-background)">
          <ErrorState title={k.dashboards.errors.fetchDashboard} />
        </div>
      )
    }
    return (
      <DashboardDetail
        k={k}
        dashboard={selected}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.dashboards.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={creating || createMut.isPending}
            onClick={() => setCreating(v => !v)}
          >
            {k.dashboards.new}
          </button>
        </div>
      </header>

      {creating && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!createMut.isPending) createMut.mutate()
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inp} min-w-0 flex-1`}
              maxLength={200}
              placeholder={k.dashboards.createForm.titlePlaceholder}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className={`${inp} w-32`}
              maxLength={50}
              placeholder={k.dashboards.createForm.iconPlaceholder}
              value={icon}
              onChange={e => setIcon(e.target.value)}
            />
            <input
              className={`${inp} w-24`}
              inputMode="numeric"
              placeholder={k.dashboards.createForm.position}
              value={position}
              onChange={e => setPosition(e.target.value)}
            />
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              type="submit"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? k.agents.runs.executing : k.dashboards.createForm.create}
            </button>
            <button
              className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
              type="button"
              onClick={() => {
                setCreating(false)
                resetCreateForm()
              }}
            >
              {k.dashboards.createForm.cancel}
            </button>
          </div>
        </form>
      )}

      {actionError && !creating && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="graph" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.dashboards.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'icon', 'position'] as const).map(h => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                    {k.dashboards.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="group cursor-pointer border-b border-(--ui-stroke-secondary) last:border-0 hover:bg-(--ui-bg-quaternary)"
                  onClick={() => openDetail(row.id)}
                >
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.title ?? ''}</td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">{row.icon ?? ''}</td>
                  <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
                    {row.position ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DashboardDetail({
  k,
  dashboard,
  onBack
}: {
  k: CEODIGITALText
  dashboard: DashboardRow
  onBack: () => void
}) {
  const qc = useQueryClient()

  const [adding, setAdding] = useState(false)
  const [specTitle, setSpecTitle] = useState('')
  const [specKind, setSpecKind] = useState('')
  const [size, setSize] = useState<WidgetSize>('medium')
  const [positionIndex, setPositionIndex] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const widgetsQ = useQuery({
    queryKey: dashboardWidgetsKey(dashboard.id),
    queryFn: () => fetchDashboardWidgets(dashboard.id)
  })

  const { code, widgets } = (() => {
    if (isOk(widgetsQ.data)) {
      return { code: null as CeodigitalErrorCode | null, widgets: (widgetsQ.data as { widgets: WidgetRow[] }).widgets }
    }
    return { code: dashboardsErrorCode(widgetsQ.error), widgets: [] as WidgetRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: dashboardWidgetsKey(dashboard.id) })
    void qc.invalidateQueries({ queryKey: DASHBOARDS_KEY })
  }

  const resetForm = () => {
    setSpecTitle('')
    setSpecKind('')
    setSize('medium')
    setPositionIndex('')
    setActionError(null)
  }

  const addMut = useMutation({
    mutationFn: () => {
      const spec: Record<string, unknown> = {}
      if (specTitle.trim()) spec.title = specTitle.trim()
      if (specKind.trim()) spec.kind = specKind.trim()
      return addDashboardWidget(dashboard.id, {
        spec,
        size,
        positionIndex: positionIndex.trim() !== '' ? Number(positionIndex) : undefined
      })
    },
    onSuccess: () => {
      setAdding(false)
      resetForm()
      refresh()
    },
    onError: err => setActionError(dashboardsErrorCode(err) ?? k.dashboards.errors.addWidget)
  })

  const removeMut = useMutation({
    mutationFn: (widgetId: string) => removeDashboardWidget(widgetId),
    onSuccess: () => {
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(dashboardsErrorCode(err) ?? k.dashboards.errors.removeWidget)
  })

  return (
    <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.dashboards.back}
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">{k.dashboards.detail}</h1>
        <span className="truncate text-[0.8125rem] text-(--ui-text-secondary)">{dashboard.title ?? ''}</span>
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={adding || addMut.isPending}
            onClick={() => setAdding(v => !v)}
          >
            {k.dashboards.addWidget}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <span className="text-[0.75rem] font-semibold text-foreground">{k.dashboards.widgets}</span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{dashboard.id}</span>
      </div>

      {adding && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!addMut.isPending) addMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.dashboards.widgetForm.specTitlePlaceholder}
                value={specTitle}
                onChange={e => setSpecTitle(e.target.value)}
              />
              <input
                className={`${inp} w-40`}
                placeholder={k.dashboards.widgetForm.specKindPlaceholder}
                value={specKind}
                onChange={e => setSpecKind(e.target.value)}
              />
              <select className={inp} value={size} onChange={e => setSize(e.target.value as WidgetSize)}>
                {WIDGET_SIZES.map(s => (
                  <option key={s} value={s}>
                    {k.dashboards.sizes[s] ?? s}
                  </option>
                ))}
              </select>
              <input
                className={`${inp} w-24`}
                inputMode="numeric"
                placeholder={k.dashboards.widgetForm.positionIndex}
                value={positionIndex}
                onChange={e => setPositionIndex(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                type="submit"
                disabled={addMut.isPending}
              >
                {addMut.isPending ? k.agents.runs.executing : k.dashboards.widgetForm.add}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setAdding(false)
                  resetForm()
                }}
              >
                {k.dashboards.widgetForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !adding && (
        <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>
      )}

      {widgetsQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : widgets.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="symbol-method" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.dashboards.widgetsEmpty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'size'] as const).map(h => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                    {k.dashboards.widgetHeaders[h]}
                  </th>
                ))}
                <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" />
              </tr>
            </thead>
            <tbody>
              {widgets.map(w => (
                <tr key={w.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{w.id}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{widgetTitle(w)}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {w.size ? (k.dashboards.sizes[w.size as WidgetSize] ?? w.size) : ''}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500 disabled:opacity-50"
                      disabled={removeMut.isPending}
                      onClick={() => removeMut.mutate(w.id)}
                    >
                      <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                      {removeMut.isPending ? k.dashboards.removingWidget : k.dashboards.removeWidget}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}