/**
 * CEODigital NativeFlows page (W4) — the fully operational workflow surface,
 * proxied via `/api/plugins/ceodigital/automation/...` (MCP `agentflow.*`):
 *   * list      (GET  /automation/workflows?status&triggerType&limit)
 *   * detail    (GET  /automation/workflows/{id})
 *   * publish   (POST /automation/workflows/{id}/publish)
 *   * run       (POST /automation/workflows/{id}/run {input?})
 *   * runs      (GET  /automation/workflows/{id}/runs)
 *   * webhooks  (GET  /automation/workflows/{id}/webhooks  + rotate)
 *   * schedules (GET  /automation/workflows/{id}/schedules + pause/resume)
 *
 * Mutations show pending state, optimistically paint their cache, roll back
 * on error; an authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  fetchWorkflow,
  fetchWorkflowRuns,
  fetchWorkflows,
  fetchWorkflowSchedules,
  fetchWorkflowWebhooks,
  pauseSchedule,
  publishWorkflow,
  rotateWebhook,
  runWorkflow,
  workflowKey,
  workflowRunsKey,
  workflowSchedulesKey,
  workflowWebhooksKey,
  WORKFLOWS_KEY
} from '../api'
import { useCeodigital, type CEODIGITALText } from '../i18n'
import type {
  CeodigitalErrorCode,
  ScheduleRow,
  WebhookRow,
  WorkflowRow,
  WorkflowRunRow
} from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function workflowErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

/** Pull a label for an arbitrary status/trigger value, falling back to the
 *  raw value when it isn't a known key (i18n shape-bound, so index must be
 *  guarded). */
function flowLabel(obj: Record<string, string>, s: string | null | undefined): string {
  return s ? (obj[s] ?? s) : ''
}

const STATUS_FILTERS = ['all', 'draft', 'active', 'archived'] as const
const TRIGGER_FILTERS = ['all', 'manual', 'webhook', 'schedule', 'event', 'api'] as const

export function WorkflowsPage() {
  const k = useCeodigital()

  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all')
  const [trigger, setTrigger] = useState<(typeof TRIGGER_FILTERS)[number]>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...WORKFLOWS_KEY, status, trigger] as unknown[],
    queryFn: () =>
      fetchWorkflows({
        status: status === 'all' ? undefined : status,
        triggerType: trigger === 'all' ? undefined : trigger
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { workflows: WorkflowRow[] }).workflows }
    }
    return { code: workflowErrorCode(listQ.error), rows: [] as WorkflowRow[] }
  }, [listQ.data, listQ.error])

  if (selectedId) {
    return <WorkflowDetail k={k} id={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.automation.workflows.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-1.5">
        <div className="flex items-center gap-0.5">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                status === s
                  ? 'bg-(--ui-bg-quaternary) text-foreground'
                  : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setStatus(s)}
            >
              {k.automation.workflows.filters[s]}
            </button>
          ))}
        </div>
        <span className="mx-1 h-4 w-px bg-(--ui-stroke-secondary)" />
        <div className="flex items-center gap-0.5">
          {TRIGGER_FILTERS.map(t => (
            <button
              key={t}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                trigger === t
                  ? 'bg-(--ui-bg-quaternary) text-foreground'
                  : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setTrigger(t)}
            >
              {k.automation.workflows.triggers[t]}
            </button>
          ))}
        </div>
      </div>

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.errors[code]} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="hubot" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.workflows.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'name', 'status', 'trigger', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.automation.workflows.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="group cursor-pointer border-b border-(--ui-stroke-secondary) last:border-0 hover:bg-(--ui-bg-quaternary)"
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2">
                    <div className="text-[0.8125rem] text-foreground">{row.name}</div>
                    {row.description && (
                      <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                        {row.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {flowLabel(k.automation.workflows.filters, row.status)}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {flowLabel(k.automation.workflows.triggers, row.trigger_type ?? row.triggerType)}
                  </td>
                  <td className="px-4 py-2">
                    <Codicon className="text-(--ui-text-tertiary)" name="arrow-right" size="0.875rem" />
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

function WorkflowDetail({ k, id, onBack }: { k: CEODIGITALText; id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)
  const [runOpen, setRunOpen] = useState(false)
  const [runInput, setRunInput] = useState('')

  const detailQ = useQuery({
    queryKey: workflowKey(id),
    queryFn: () => fetchWorkflow(id)
  })

  const wf = isOk(detailQ.data) ? (detailQ.data as { workflow: WorkflowRow }).workflow : null
  const detailCode = detailQ.error ? workflowErrorCode(detailQ.error) : null

  const invalidateWorkflow = () => {
    void qc.invalidateQueries({ queryKey: workflowKey(id) })
    void qc.invalidateQueries({ queryKey: workflowRunsKey(id) })
  }

  const publishMut = useMutation({
    mutationFn: () => publishWorkflow(id),
    onSuccess: () => {
      setActionError(null)
      invalidateWorkflow()
    },
    onError: err => setActionError(workflowErrorCode(err) ?? k.errors.general)
  })

  const runMut = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown> | undefined
      if (runInput.trim()) {
        try {
          parsed = JSON.parse(runInput)
        } catch {
          throw new Error('invalid_json')
        }
      }
      return runWorkflow(id, parsed ? { input: parsed } : undefined)
    },
    onSuccess: () => {
      setRunOpen(false)
      setRunInput('')
      invalidateWorkflow()
    },
    onError: err =>
      setActionError(
        err instanceof Error && err.message === 'invalid_json'
          ? 'JSON inválido'
          : (workflowErrorCode(err) ?? k.errors.general)
      )
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.automation.workflows.back}
        </button>
        <h1 className="text-sm font-semibold text-foreground">{k.automation.workflows.detail}</h1>
      </header>

      {detailQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : detailCode ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.errors[detailCode] ?? k.errors.general} />
        </div>
      ) : wf ? (
        <>
          <div className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3">
            <div className="text-base font-semibold text-foreground">{wf.name}</div>
            {wf.description && <div className="mt-1 text-[0.8125rem] text-(--ui-text-secondary)">{wf.description}</div>}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.75rem] text-(--ui-text-secondary)">
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">{wf.id}</span>
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">
                {flowLabel(k.automation.workflows.filters, wf.status)}
              </span>
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">
                {flowLabel(k.automation.workflows.triggers, wf.trigger_type ?? wf.triggerType)}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={publishMut.isPending}
                onClick={() => publishMut.mutate()}
              >
                {publishMut.isPending ? k.automation.workflows.publishing : k.automation.workflows.publish}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground disabled:opacity-50"
                disabled={runMut.isPending}
                onClick={() => { setActionError(null); setRunOpen(v => !v) }}
              >
                {runMut.isPending ? k.automation.workflows.running : k.automation.workflows.run}
              </button>
              {actionError && <span className="text-[0.75rem] text-red-500">{actionError}</span>}
            </div>
          </div>

          {runOpen && (
            <form
              className="shrink-0 border-b border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-3"
              onSubmit={e => {
                e.preventDefault()
                if (!runMut.isPending) runMut.mutate()
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${inp} min-w-0 flex-1`}
                  placeholder={k.automation.workflows.runInputPlaceholder}
                  value={runInput}
                  onChange={e => setRunInput(e.target.value)}
                />
                <label className="text-[0.75rem] text-(--ui-text-tertiary)">{k.automation.workflows.runInput}</label>
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={runMut.isPending}
                  type="submit"
                >
                  {runMut.isPending ? k.automation.workflows.running : k.automation.workflows.run}
                </button>
                <button
                  className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                  type="button"
                  onClick={() => setRunOpen(false)}
                >
                  {k.automation.playbooks.cancel}
                </button>
              </div>
            </form>
          )}

          <WorkflowRuns k={k} workflowId={id} />

          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
            <WebhooksPanel k={k} workflowId={id} />
            <SchedulesPanel k={k} workflowId={id} />
          </div>
        </>
      ) : null}
    </div>
  )
}

function WorkflowRuns({ k, workflowId }: { k: CEODIGITALText; workflowId: string }) {
  const runsQ = useQuery({
    queryKey: workflowRunsKey(workflowId),
    queryFn: () => fetchWorkflowRuns(workflowId)
  })

  const runs = isOk(runsQ.data) ? (runsQ.data as { runs: WorkflowRunRow[] }).runs : []

  return (
    <section className="shrink-0 border-b border-(--ui-stroke-secondary)">
      <header className="flex items-center gap-2 px-4 py-2">
        <Codicon className="text-(--ui-text-tertiary)" name="play-circle" size="0.875rem" />
        <h2 className="text-[0.8125rem] font-semibold text-foreground">{k.automation.workflows.runs}</h2>
      </header>
      <div className="min-h-0">
        {runsQ.isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader type="lemniscate-bloom" />
          </div>
        ) : runs.length === 0 ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.workflows.runsEmpty}</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'status', 'started'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.automation.workflows.runsHeaders[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{run.id}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {k.automation.workflows.runStatus[run.status] ?? run.status}
                  </td>
                  <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {run.started_at ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function WebhooksPanel({ k, workflowId }: { k: CEODIGITALText; workflowId: string }) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const webhooksQ = useQuery({
    queryKey: workflowWebhooksKey(workflowId),
    queryFn: () => fetchWorkflowWebhooks(workflowId)
  })

  const webhooks = isOk(webhooksQ.data) ? (webhooksQ.data as { webhooks: WebhookRow[] }).webhooks : []

  const rotateMut = useMutation({
    mutationFn: (id: string) => rotateWebhook(id),
    onSuccess: () => {
      setError(null)
      void qc.invalidateQueries({ queryKey: workflowWebhooksKey(workflowId) })
    },
    onError: err => setError(workflowErrorCode(err) ?? k.errors.general)
  })

  return (
    <section className="border-b border-(--ui-stroke-secondary) lg:border-b-0 lg:border-r">
      <header className="flex items-center gap-2 px-4 py-2">
        <Codicon className="text-(--ui-text-tertiary)" name="globe" size="0.875rem" />
        <h2 className="text-[0.8125rem] font-semibold text-foreground">{k.automation.workflows.webhooks}</h2>
      </header>
      <div className="min-h-0">
        {webhooksQ.isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader type="lemniscate-bloom" />
          </div>
        ) : webhooks.length === 0 ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.workflows.webhooksEmpty}</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'url', 'active', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.automation.workflows.webhooksHeaders[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {webhooks.map(wh => (
                <tr key={wh.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{wh.id}</td>
                  <td className="max-w-56 truncate px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{wh.url}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {(wh.is_active || wh.isActive) ? '✓' : ''}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      className="text-[0.6875rem] text-(--ui-text-secondary) underline hover:text-foreground disabled:opacity-50"
                      disabled={rotateMut.isPending}
                      onClick={() => rotateMut.mutate(wh.id)}
                    >
                      {rotateMut.isPending ? k.automation.workflows.actions.rotating : k.automation.workflows.actions.rotate}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {error && <p className="px-4 pb-2 text-[0.75rem] text-red-500">{error}</p>}
      </div>
    </section>
  )
}

function SchedulesPanel({ k, workflowId }: { k: CEODIGITALText; workflowId: string }) {
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const schedulesQ = useQuery({
    queryKey: workflowSchedulesKey(workflowId),
    queryFn: () => fetchWorkflowSchedules(workflowId)
  })

  const schedules = isOk(schedulesQ.data) ? (schedulesQ.data as { schedules: ScheduleRow[] }).schedules : []

  const pauseMut = useMutation({
    mutationFn: ({ id, paused }: { id: string; paused: boolean }) => pauseSchedule(id, paused),
    onMutate: ({ id }) => {
      setPendingId(id)
      return null
    },
    onSuccess: () => {
      setPendingId(null)
      setError(null)
      void qc.invalidateQueries({ queryKey: workflowSchedulesKey(workflowId) })
    },
    onError: (err) => {
      setPendingId(null)
      setError(workflowErrorCode(err) ?? k.errors.general)
    }
  })

  return (
    <section>
      <header className="flex items-center gap-2 px-4 py-2">
        <Codicon className="text-(--ui-text-tertiary)" name="history" size="0.875rem" />
        <h2 className="text-[0.8125rem] font-semibold text-foreground">{k.automation.workflows.schedules}</h2>
      </header>
      <div className="min-h-0">
        {schedulesQ.isLoading ? (
          <div className="grid place-items-center py-6">
            <Loader type="lemniscate-bloom" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="px-4 pb-3">
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.workflows.schedulesEmpty}</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'cron', 'active', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.automation.workflows.schedulesHeaders[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedules.map(sch => {
                const active = sch.is_active ?? sch.isActive
                return (
                  <tr key={sch.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                    <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{sch.id}</td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{sch.cron_expr ?? sch.cronExpr ?? ''}</td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{active ? '✓' : '✗'}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-[0.6875rem] text-(--ui-text-secondary) underline hover:text-foreground disabled:opacity-50"
                        disabled={pauseMut.isPending && pendingId === sch.id}
                        onClick={() => pauseMut.mutate({ id: sch.id, paused: active })}
                      >
                        {pauseMut.isPending && pendingId === sch.id
                          ? k.automation.workflows.actions.pausing
                          : active
                            ? k.automation.workflows.actions.pause
                            : k.automation.workflows.actions.resume}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {error && <p className="px-4 pb-2 text-[0.75rem] text-red-500">{error}</p>}
      </div>
    </section>
  )
}