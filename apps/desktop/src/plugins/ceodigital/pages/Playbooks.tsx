/**
 * CEODigital Playbooks page (W4) — browse, open detail, run and inspect runs
 * of the tenant's playbooks, proxied via `/api/plugins/ceodigital/automation/
 * playbooks` (MCP `playbooks.*` / `playbook.runs.*`):
 *   * list    (GET  /automation/playbooks?subjectType&isActive&limit)
 *   * detail  (GET  /automation/playbooks/{id})
 *   * run     (POST /automation/playbooks/{id}/run {subjectType, subjectId?})
 *   * runs    (GET  /automation/playbooks/runs?playbookId&status&...)
 *
 * The list opens a detail view (same window, back restores the list). Run and
 * runs-list mutations show pending state, optimistically paint the cache,
 * roll back on error; an authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useEffect, useMemo, useState } from 'react'

import {
  fetchPlaybook,
  fetchPlaybookRuns,
  fetchPlaybooks,
  playbookKey,
  PLAYBOOK_RUNS_KEY,
  PLAYBOOKS_KEY,
  runPlaybook
} from '../api'
import { useCeodigital, type CEODIGITALText } from '../i18n'
import type { CeodigitalErrorCode, PlaybookRow, PlaybookRunRow, PlaybookRunsListParams, RunPlaybookInput } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function playbookErrorCode(err: unknown): CeodigitalErrorCode | null {
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

type ActiveFilter = 'all' | 'active' | 'inactive'

export function PlaybooksPage() {
  const k = useCeodigital()

  const [subjectType, setSubjectType] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...PLAYBOOKS_KEY, subjectType, activeFilter] as unknown[],
    queryFn: () =>
      fetchPlaybooks({
        subjectType: subjectType.trim() || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active'
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { playbooks: PlaybookRow[] }).playbooks }
    }
    return { code: playbookErrorCode(listQ.error), rows: [] as PlaybookRow[] }
  }, [listQ.data, listQ.error])

  if (selectedId) {
    return <PlaybookDetail k={k} id={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.automation.playbooks.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <div className="flex items-center gap-1">
          {(Object.keys(k.automation.playbooks.filters) as ActiveFilter[]).map(f => (
            <button
              key={f}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                activeFilter === f
                  ? 'bg-(--ui-bg-quaternary) text-foreground'
                  : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setActiveFilter(f)}
            >
              {k.automation.playbooks.filters[f]}
            </button>
          ))}
        </div>
        <input
          className={`${inp} w-56`}
          placeholder={k.automation.playbooks.subjectType}
          value={subjectType}
          onChange={e => setSubjectType(e.target.value)}
        />
      </div>

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={code === null ? k.errors.fetch : k.errors[code]} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="book" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.playbooks.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'subject', 'active', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.automation.playbooks.headers[h]}
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
                    <div className="text-[0.8125rem] text-foreground">{row.title}</div>
                    {row.description && (
                      <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                        {row.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.subject_type ?? row.subjectType ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {(row.is_active || row.isActive) ? '✓' : ''}
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

function PlaybookDetail({ k, id, onBack }: { k: CEODIGITALText; id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const detailQ = useQuery({
    queryKey: playbookKey(id),
    queryFn: () => fetchPlaybook({ id })
  })

  const pb = isOk(detailQ.data)
    ? (detailQ.data as { playbook: PlaybookRow }).playbook
    : null
  const detailCode = detailQ.error ? playbookErrorCode(detailQ.error) : null

  const [runOpen, setRunOpen] = useState(false)
  const [runSubjectType, setRunSubjectType] = useState('')
  const [runSubjectId, setRunSubjectId] = useState('')

  const initialId = id

  const runMut = useMutation({
    mutationFn: () => {
      const body: RunPlaybookInput = {
        subjectType: runSubjectType.trim(),
        subjectId: runSubjectId.trim() || undefined
      }
      return runPlaybook(initialId, body)
    },
    onSuccess: () => {
      setRunOpen(false)
      setRunSubjectType('')
      setRunSubjectId('')
      void qc.invalidateQueries({ queryKey: PLAYBOOK_RUNS_KEY })
    },
    onError: err => setActionError(playbookErrorCode(err) ?? k.errors.general)
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.automation.playbooks.back}
        </button>
        <h1 className="text-sm font-semibold text-foreground">{k.automation.playbooks.detail}</h1>
        {runMut.isPending && <span className="text-[0.75rem] text-(--ui-text-tertiary)">{k.automation.playbooks.running}</span>}
      </header>

      {detailQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : detailCode ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.errors[detailCode] ?? k.errors.general} />
        </div>
      ) : pb ? (
        <>
          <div className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3">
            <div className="text-base font-semibold text-foreground">{pb.title}</div>
            {pb.description && <div className="mt-1 text-[0.8125rem] text-(--ui-text-secondary)">{pb.description}</div>}
            <div className="mt-2 flex flex-wrap gap-2 text-[0.75rem] text-(--ui-text-secondary)">
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">{pb.id}</span>
              {(pb.subject_type ?? pb.subjectType) && (
                <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">{k.automation.playbooks.subjectType}: {pb.subject_type ?? pb.subjectType}</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                className="flex items-center gap-1 rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={runMut.isPending}
                onClick={() => { setActionError(null); setRunOpen(v => !v) }}
              >
                <Codicon name="play" size="0.875rem" />
                {k.automation.playbooks.run}
              </button>
            </div>
          </div>

          {runOpen && (
            <form
              className="shrink-0 border-b border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-3"
              onSubmit={e => {
                e.preventDefault()
                if (runSubjectType.trim() && !runMut.isPending) runMut.mutate()
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  className={`${inp} w-48`}
                  placeholder={k.automation.playbooks.runFormSubjectType}
                  value={runSubjectType}
                  onChange={e => setRunSubjectType(e.target.value)}
                />
                <input
                  className={`${inp} w-48`}
                  placeholder={k.automation.playbooks.runFormSubjectId}
                  value={runSubjectId}
                  onChange={e => setRunSubjectId(e.target.value)}
                />
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={runMut.isPending || !runSubjectType.trim()}
                  type="submit"
                >
                  {runMut.isPending ? k.automation.playbooks.running : k.automation.playbooks.run}
                </button>
                <button
                  className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                  type="button"
                  onClick={() => setRunOpen(false)}
                >
                  {k.automation.playbooks.cancel}
                </button>
                {actionError && <span className="text-[0.75rem] text-red-500">{actionError}</span>}
              </div>
            </form>
          )}

          <PlaybookRuns k={k} playbookId={pb.id} />
        </>
      ) : null}
    </div>
  )
}

function PlaybookRuns({ k, playbookId }: { k: CEODIGITALText; playbookId: string }) {
  const [status, setStatus] = useState<PlaybookRunsListParams['status'] | 'all'>('all')

  useEffect(() => {
    setStatus('all')
  }, [playbookId])

  const runsQ = useQuery({
    queryKey: [...PLAYBOOK_RUNS_KEY, playbookId, status] as unknown[],
    queryFn: () => fetchPlaybookRuns({ playbookId, status: status === 'all' ? undefined : status })
  })

  const runs = isOk(runsQ.data) ? (runsQ.data as { runs: PlaybookRunRow[] }).runs : []

  const statusOrder = ['all', 'active', 'completed', 'cancelled'] as const

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-1.5">
        <span className="text-[0.6875rem] font-medium text-(--ui-text-tertiary)">{k.automation.playbooks.runs}</span>
        {statusOrder.map(s => (
          <button
            key={s}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              status === s ? 'bg-(--ui-bg-quaternary) text-foreground' : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setStatus(s)}
          >
            {s === 'all'
              ? k.workitems.filters.all
              : k.automation.playbooks.runStatus[s] ?? s}
          </button>
        ))}
      </div>

      {runsQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : runs.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <p className="text-xs text-(--ui-text-tertiary)">{k.automation.playbooks.runsEmpty}</p>
        </div>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-(--ui-stroke-secondary)">
              {(['id', 'status', 'subject', 'started'] as const).map(h => (
                <th
                  className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                  key={h}
                >
                  {k.automation.playbooks.runsHeaders[h]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map(run => (
              <tr key={run.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{run.id}</td>
                <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                  {k.automation.playbooks.runStatus[run.status] ?? run.status}
                </td>
                <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                  {run.subject_type ?? run.subject_id ?? ''}
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
  )
}