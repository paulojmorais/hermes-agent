/**
 * CEODigital Workitems page (W2) — make work items actionable from the desktop.
 *
 * On top of the read-only GET /workitems + GET /workitems/{id}, this page adds
 * the operational surface, all proxied via `/api/plugins/ceodigital/workitems*`
 * over the W2 MCP tools:
 *   * create   (`POST /workitems`            → workitems.create)
 *   * run      (`POST /workitems/{id}/run`   → workitems.run)
 *   * assign   (`POST /workitems/{id}/assign`→ workitems.assign)
 *   * submit   (`POST /workitems/{id}/submit`→ workitems.submit_output)
 *   * checklist(`POST /workitems/{id}/checklist` → workitems.checklist.toggle)
 *   * suggest  (`GET  /workitems/suggest`    → workitems.suggest)
 *   * status   (`GET  /workitems/status`     → workitems.status)
 *
 * Approval/denial of work items is intentionally NOT here — it stays in the
 * tenant UI. Mutations show pending state and invalidate (or optimistically
 * update) the list; on error the optimistic paint rolls back.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  assignWorkItem,
  createWorkItem,
  fetchWorkItems,
  fetchWorkItemsStatus,
  runWorkItem,
  submitWorkItemOutput,
  suggestWorkItem,
  toggleChecklistItem,
  WORKITEMS_KEY,
  WORKITEMS_STATUS_KEY
} from '../api'
import { statusLabel, useCeodigital } from '../i18n'
import type {
  AssignWorkItemEnvelope,
  CeodigitalErrorCode,
  ChecklistToggleEnvelope,
  RunWorkItemEnvelope,
  SubmitWorkItemEnvelope,
  WorkItemRow,
  WorkItemStatusFilter
} from '../types'

/** UI filter tab keys — the i18n label keys (camelCase), decoupled from the
 *  MCP query values (snake_case) that ``WorkItemStatusFilter`` carries. */
type StatusFilterKey = 'all' | 'mine' | 'dueSoon' | 'awaitingApproval'

/** Map a UI filter tab to the MCP ``workitems.status`` ``filter`` value. */
const STATUS_FILTER_QUERY: Record<Exclude<StatusFilterKey, 'all'>, WorkItemStatusFilter> = {
  mine: 'mine',
  dueSoon: 'due_soon',
  awaitingApproval: 'awaiting_approval'
}

const STATUS_FILTERS: StatusFilterKey[] = ['all', 'mine', 'dueSoon', 'awaitingApproval']

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

export function workItemsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

/** The status filter tabs read both the raw list and the status lens. */
function formatUpdated(raw: null | string | undefined): string {
  if (!raw) return ''
  const parsed = Date.parse(raw)
  const ms = Number.isNaN(parsed) ? Number(raw) * 1000 : parsed
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : raw
}

type RowAction = 'run' | 'assign' | 'submit' | 'checklist'

export function WorkitemsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<StatusFilterKey>('all')
  const [creating, setCreating] = useState(false)
  const [suggestIntent, setSuggestIntent] = useState('')
  const [suggestions, setSuggestions] = useState<Array<Record<string, unknown>>>([])
  const [suggesting, setSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [actionFor, setActionFor] = useState<{ id: string; action: RowAction } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create form.
  const [title, setTitle] = useState('')
  const [subjectType, setSubjectType] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState('')

  // Submit form.
  const [runId, setRunId] = useState('')
  const [output, setOutput] = useState('')
  const [notes, setNotes] = useState('')

  // Assign form.
  const [add, setAdd] = useState('')
  const [remove, setRemove] = useState('')
  const [role, setRole] = useState('owner')

  // Checklist form.
  const [checklistItemId, setChecklistItemId] = useState('')
  const [checklistDone, setChecklistDone] = useState(true)

  const rowsQ = useQuery({
    queryKey: WORKITEMS_KEY,
    queryFn: fetchWorkItems as () => Promise<unknown>,
    enabled: filter === 'all'
  })
  const statusQ = useQuery({
    queryKey: [...WORKITEMS_STATUS_KEY, filter],
    queryFn: (() => fetchWorkItemsStatus(filter === 'all' ? undefined : STATUS_FILTER_QUERY[filter])) as () => Promise<unknown>,
    enabled: filter !== 'all'
  })

  const { code, rows } = useMemo(() => {
    const primary = filter === 'all' ? rowsQ : statusQ
    if (isOk(primary.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (primary.data as { workitems: WorkItemRow[] }).workitems }
    }
    const failure = primary.error
    return { code: workItemsErrorCode(failure), rows: [] as WorkItemRow[] }
  }, [filter, rowsQ.data, rowsQ.error, statusQ.data, statusQ.error])

  const loading = filter === 'all' ? rowsQ.isLoading : statusQ.isLoading
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  function resetForms() {
    setTitle(''); setSubjectType(''); setDescription(''); setDue('')
    setRunId(''); setOutput(''); setNotes('')
    setAdd(''); setRemove(''); setRole('owner')
    setChecklistItemId(''); setChecklistDone(true)
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createWorkItem({
        title: title.trim(),
        subject_type: subjectType.trim(),
        description: description.trim() || undefined,
        due_at: due || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetForms()
      void qc.invalidateQueries({ queryKey: WORKITEMS_KEY })
    },
    onError: err => setActionError(workItemsErrorCode(err) ?? k.workitems.errors.create)
  })

  const runMut = useMutation({
    mutationFn: (id: string) => runWorkItem(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: WORKITEMS_KEY })
      const prev = qc.getQueryData(WORKITEMS_KEY)
      if (prev && isOk(prev)) {
        qc.setQueryData(WORKITEMS_KEY, {
          ...prev,
          workitems: (prev as { workitems: WorkItemRow[] }).workitems.map(w =>
            w.id === id ? { ...w, status: 'running' } : w
          )
        })
      }
      return { prev }
    },
    onError: (_err: unknown, _id: string, ctx?: { prev?: unknown }) => {
      if (ctx?.prev) qc.setQueryData(WORKITEMS_KEY, ctx.prev)
      setActionError(k.workitems.errors.run)
    },
    onSettled: (_d, _e, id: string) => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: WORKITEMS_KEY })
    }
  })

  const assignMut = useMutation({
    mutationFn: (id: string) =>
      assignWorkItem(id, {
        add: add.split(',').map(s => s.trim()).filter(Boolean),
        remove: remove.split(',').map(s => s.trim()).filter(Boolean),
        role: role || undefined
      }),
    onSuccess: () => {
      setActionFor(null)
      resetForms()
      void qc.invalidateQueries({ queryKey: WORKITEMS_KEY })
    },
    onError: err => setActionError(workItemsErrorCode(err) ?? k.workitems.errors.assign)
  })

  const submitMut = useMutation({
    mutationFn: (id: string) => {
      let parsedOutput: Record<string, unknown> = {}
      try {
        parsedOutput = output.trim() ? JSON.parse(output) : {}
      } catch {
        throw new Error('invalid_json')
      }
      return submitWorkItemOutput(id, { run_id: runId.trim(), output: parsedOutput, notes: notes.trim() || undefined })
    },
    onSuccess: () => {
      setActionFor(null)
      resetForms()
      void qc.invalidateQueries({ queryKey: WORKITEMS_KEY })
    },
    onError: err =>
      setActionError(err instanceof Error && err.message === 'invalid_json' ? 'JSON inválido' : (workItemsErrorCode(err) ?? k.workitems.errors.submit))
  })

  const checklistMut = useMutation({
    mutationFn: (id: string) =>
      toggleChecklistItem(id, { checklist_item_id: checklistItemId.trim(), done: checklistDone }),
    onSuccess: () => {
      setActionFor(null)
      resetForms()
      void qc.invalidateQueries({ queryKey: WORKITEMS_KEY })
    },
    onError: err => setActionError(workItemsErrorCode(err) ?? k.workitems.errors.checklist)
  })

  async function runSuggest() {
    const intent = suggestIntent.trim()
    if (!intent || suggesting) return
    setSuggesting(true)
    setSuggestError(null)
    try {
      const res = await suggestWorkItem(intent)
      if (res && isOk(res)) {
        setSuggestions((res as { suggestions: Array<Record<string, unknown>> }).suggestions)
      } else {
        setSuggestions([])
        setSuggestError(k.workitems.errors.suggest)
      }
    } catch (err) {
      setSuggestions([])
      setSuggestError(workItemsErrorCode(err) ?? k.workitems.errors.suggest)
    } finally {
      setSuggesting(false)
    }
  }

  const openAction = (id: string, action: RowAction) => {
    setActionError(null)
    resetForms()
    setActionFor({ id, action })
  }

  const pendingFor = (id: string): 'run' | 'assign' | 'submit' | 'checklist' | null => {
    if (!actionFor || actionFor.id !== id) return null
    if (runMut.isPending) return 'run'
    if (assignMut.isPending) return 'assign'
    if (submitMut.isPending) return 'submit'
    if (checklistMut.isPending) return 'checklist'
    return null
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.workitems.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={creating}
            onClick={() => setCreating(v => !v)}
          >
            {k.workitems.toolbar.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-1.5">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              filter === f
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setFilter(f)}
          >
            {k.workitems.filters[f]}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground placeholder:text-(--ui-text-tertiary)"
          placeholder={k.workitems.toolbar.suggestPlaceholder}
          value={suggestIntent}
          disabled={suggesting}
          onChange={e => setSuggestIntent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && void runSuggest()}
        />
        <button
          className="shrink-0 rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground disabled:opacity-50"
          disabled={suggesting || !suggestIntent.trim()}
          onClick={() => void runSuggest()}
        >
          {suggesting ? k.agents.runs.executing : k.workitems.toolbar.suggestRun}
        </button>
      </div>

      {suggestError && <p className="px-4 py-1 text-[0.75rem] text-red-500">{suggestError}</p>}
      {suggestions.length > 0 && (
        <div className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
          {suggestions.map((s, i) => (
            <div className="flex items-center gap-2 py-0.5" key={i}>
              <Codicon className="text-(--ui-text-tertiary)" name="lightbulb" size="0.875rem" />
              <span className="text-foreground">{String(s.title ?? s.label ?? '')}</span>
              {s.score != null && <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary)">{String(s.score)}</span>}
            </div>
          ))}
        </div>
      )}

      {creating && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (title.trim() && subjectType.trim() && !createMut.isPending) createMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <input
              className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
              placeholder={k.workitems.form.title}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <input
              className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
              placeholder={k.workitems.form.subjectTypePlaceholder}
              value={subjectType}
              onChange={e => setSubjectType(e.target.value)}
            />
            <textarea
              className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
              placeholder={k.workitems.form.description}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input
              className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
              placeholder={k.workitems.form.due}
              value={due}
              onChange={e => setDue(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending || !title.trim() || !subjectType.trim()}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.workitems.form.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetForms()
                }}
              >
                {k.workitems.form.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
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
            <Codicon className="text-(--ui-text-quaternary)" name="folder" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.workitems.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'status', 'assignee', 'updated', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.workitem.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const active = actionFor?.id === row.id ? actionFor.action : null
                return (
                  <RowWithActions
                    key={row.id}
                    row={row}
                    k={k}
                    active={active}
                    pending={pendingFor(row.id)}
                    onAction={openAction}
                    runMut={runMut}
                    assignMut={assignMut}
                    submitMut={submitMut}
                    checklistMut={checklistMut}
                    form={{
                      runId, setRunId,
                      output, setOutput,
                      notes, setNotes,
                      add, setAdd,
                      remove, setRemove,
                      role, setRole,
                      checklistItemId, setChecklistItemId,
                      checklistDone, setChecklistDone,
                      actionError, setActionError,
                      assignDisabled: !add && !remove,
                      submitDisabled: !runId.trim() || !output.trim() || submitMut.isPending
                    }}
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface RowForm {
  runId: string
  setRunId: (v: string) => void
  output: string
  setOutput: (v: string) => void
  notes: string
  setNotes: (v: string) => void
  add: string
  setAdd: (v: string) => void
  remove: string
  setRemove: (v: string) => void
  role: string
  setRole: (v: string) => void
  checklistItemId: string
  setChecklistItemId: (v: string) => void
  checklistDone: boolean
  setChecklistDone: (v: boolean) => void
  actionError: string | null
  setActionError: (v: string | null) => void
  assignDisabled: boolean
  submitDisabled: boolean
}

function RowWithActions({
  row,
  k,
  active,
  pending,
  onAction,
  runMut,
  assignMut,
  submitMut,
  checklistMut,
  form
}: {
  row: WorkItemRow
  k: ReturnType<typeof useCeodigital>
  active: RowAction | null
  pending: 'run' | 'assign' | 'submit' | 'checklist' | null
  onAction: (id: string, action: RowAction) => void
  runMut: UseMutationResult<RunWorkItemEnvelope, unknown, string, { prev?: unknown }>
  assignMut: UseMutationResult<AssignWorkItemEnvelope, Error, string, unknown>
  submitMut: UseMutationResult<SubmitWorkItemEnvelope, Error, string, unknown>
  checklistMut: UseMutationResult<ChecklistToggleEnvelope, Error, string, unknown>
  form: RowForm
}) {
  return (
    <>
      <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
        <td className="px-4 py-2">
          <div className="text-[0.8125rem] text-foreground">{row.title}</div>
          {row.summary && (
            <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
              {row.summary}
            </div>
          )}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{statusLabel(k, row.status)}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.assignee ?? k.workitem.unassigned}</td>
        <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{formatUpdated(row.updated_at)}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <ActionBtn label={k.workitems.actions.run} icon="play" onClick={() => onAction(row.id, 'run')} />
            <ActionBtn label={k.workitems.actions.assign} icon="person-add" onClick={() => onAction(row.id, 'assign')} />
            <ActionBtn label={k.workitems.actions.submitOutput} icon="check" onClick={() => onAction(row.id, 'submit')} />
            <ActionBtn label={k.workitems.checklist.title} icon="list-unordered" onClick={() => onAction(row.id, 'checklist')} />
          </div>
        </td>
      </tr>
      {active && (
        <tr className="border-b border-(--ui-stroke-secondary)">
          <td colSpan={6} className="bg-(--ui-bg-quaternary) px-4 py-2">
            {active === 'run' && (
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={pending === 'run'}
                  onClick={() => runMut.mutate(row.id)}
                >
                  {pending === 'run' ? k.workitems.actions.running : k.workitems.actions.run}
                </button>
                <span className="text-[0.75rem] text-(--ui-text-tertiary)">{row.id}</span>
              </div>
            )}
            {active === 'assign' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-40 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                    placeholder={k.workitems.assign.add}
                    value={form.add}
                    onChange={e => form.setAdd(e.target.value)}
                  />
                  <input
                    className="w-40 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                    placeholder={k.workitems.assign.remove}
                    value={form.remove}
                    onChange={e => form.setRemove(e.target.value)}
                  />
                  <input
                    className="w-32 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                    placeholder={k.workitems.assign.role}
                    value={form.role}
                    onChange={e => form.setRole(e.target.value)}
                  />
                  <button
                    className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                    disabled={pending === 'assign' || form.assignDisabled}
                    onClick={() => assignMut.mutate(row.id)}
                  >
                    {pending === 'assign' ? k.workitems.actions.assigning : k.workitems.assign.save}
                  </button>
                </div>
                {form.actionError && <p className="text-[0.75rem] text-red-500">{form.actionError}</p>}
              </div>
            )}
            {active === 'submit' && (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    className="w-40 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                    placeholder={k.workitems.submit.runId}
                    value={form.runId}
                    onChange={e => form.setRunId(e.target.value)}
                  />
                  <input
                    className="w-40 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                    placeholder={k.workitems.submit.notes}
                    value={form.notes}
                    onChange={e => form.setNotes(e.target.value)}
                  />
                </div>
                <textarea
                  className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                  placeholder={k.workitems.submit.output}
                  rows={2}
                  value={form.output}
                  onChange={e => form.setOutput(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                    disabled={form.submitDisabled}
                    onClick={() => submitMut.mutate(row.id)}
                  >
                    {pending === 'submit' ? k.workitems.actions.submitting : k.workitems.submit.send}
                  </button>
                  {form.actionError && <span className="text-[0.75rem] text-red-500">{form.actionError}</span>}
                </div>
              </div>
            )}
            {active === 'checklist' && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_auto_auto_1fr]">
                <input
                  className="w-64 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground"
                  placeholder={k.workitems.checklist.itemLabel}
                  value={form.checklistItemId}
                  onChange={e => form.setChecklistItemId(e.target.value)}
                />
                <label className="flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
                  <input
                    type="checkbox"
                    checked={form.checklistDone}
                    onChange={e => form.setChecklistDone(e.target.checked)}
                  />
                  {k.workitems.checklist.doneLabel}
                </label>
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={pending === 'checklist' || !form.checklistItemId.trim()}
                  onClick={() => checklistMut.mutate(row.id)}
                >
                  {pending === 'checklist' ? k.agents.runs.executing : k.workitems.checklist.toggle}
                </button>
                {form.actionError && <span className="text-[0.75rem] text-red-500">{form.actionError}</span>}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function ActionBtn({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
      title={label}
      onClick={onClick}
    >
      <Codicon className="text-(--ui-text-tertiary)" name={icon} size="0.875rem" />
      {label}
    </button>
  )
}
