/**
 * CEODigital Labels page (W8-UI-a) — the tenant's label catalog with
 * assignments management, proxied via `/api/plugins/ceodigital/labels` (MCP
 * `labels.*`):
 *   * list        (GET  /labels?search&limit)
 *   * assignments (GET  /labels/assignments?labelId&subjectType&subjectId)
 *   * create      (POST /labels {code, name, color?, description?})
 *   * update      (POST /labels/{id}/update {name?, color?, description?})
 *   * assign      (POST /labels/{id}/assign {subjectType, subjectId})
 *   * unassign    (POST /labels/{id}/unassign)
 *
 * Each label expands to manage its assignments and edit its fields. Writes
 * flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  assignLabel,
  createLabel,
  fetchLabelAssignments,
  fetchLabels,
  LABELS_KEY,
  LABEL_ASSIGNMENTS_KEY,
  unassignLabel,
  updateLabel
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, LabelAssignmentRow, LabelRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function labelsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function LabelsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [openId, setOpenId] = useState<string | null>(null)
  const [subjectType, setSubjectType] = useState('')
  const [subjectId, setSubjectId] = useState('')

  const listQ = useQuery({
    queryKey: [...LABELS_KEY, { search }] as unknown[],
    queryFn: () => fetchLabels({ search: search.trim() || undefined })
  })

  const assignmentQ = useQuery({
    queryKey: [...LABEL_ASSIGNMENTS_KEY, openId] as unknown[],
    queryFn: () => fetchLabelAssignments({ labelId: openId ?? undefined }),
    enabled: !!openId
  })

  const { code: listCode, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { labels: LabelRow[] }).labels }
    }
    return { code: labelsErrorCode(listQ.error), rows: [] as LabelRow[] }
  })()
  const errorCopy = listCode === null ? k.errors.fetch : k.errors[listCode]

  const assignments: LabelAssignmentRow[] = isOk(assignmentQ.data)
    ? (assignmentQ.data as { assignments: LabelAssignmentRow[] }).assignments
    : []

  const refreshLabels = () => void qc.invalidateQueries({ queryKey: LABELS_KEY })

  const resetCreateForm = () => {
    setCode('')
    setName('')
    setColor('')
    setDescription('')
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createLabel({
        code: code.trim(),
        name: name.trim(),
        color: color.trim() || undefined,
        description: description.trim() || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetCreateForm()
      refreshLabels()
    },
    onError: err => setActionError(labelsErrorCode(err) ?? k.labels.errors.create)
  })

  const toggleOpen = (id: string) => {
    setActionError(null)
    setSubjectType('')
    setSubjectId('')
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.labels.title}</h1>
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
            {k.labels.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.labels.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {creating && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!createMut.isPending) createMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} w-40`}
                maxLength={120}
                placeholder={k.labels.createForm.codePlaceholder}
                value={code}
                onChange={e => setCode(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                maxLength={200}
                placeholder={k.labels.createForm.namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className={`${inp} w-32`}
                maxLength={30}
                placeholder={k.labels.createForm.colorPlaceholder}
                value={color}
                onChange={e => setColor(e.target.value)}
              />
            </div>
            <input
              className={inp}
              maxLength={500}
              placeholder={k.labels.createForm.descriptionPlaceholder}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending || !code.trim() || !name.trim()}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.labels.createForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetCreateForm()
                }}
              >
                {k.labels.createForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !creating && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : listCode ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="tag" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.labels.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map(label => (
            <LabelCard
              key={label.id}
              label={label}
              k={k}
              open={openId === label.id}
              onToggle={() => toggleOpen(label.id)}
              assignments={openId === label.id ? assignments : []}
              assignmentLoading={openId === label.id && assignmentQ.isLoading}
              subjectType={subjectType}
              setSubjectType={setSubjectType}
              subjectId={subjectId}
              setSubjectId={setSubjectId}
              onError={actionError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LabelCard({
  label,
  k,
  open,
  onToggle,
  assignments,
  assignmentLoading,
  subjectType,
  setSubjectType,
  subjectId,
  setSubjectId,
  onError
}: {
  label: LabelRow
  k: ReturnType<typeof useCeodigital>
  open: boolean
  onToggle: () => void
  assignments: LabelAssignmentRow[]
  assignmentLoading: boolean
  subjectType: string
  setSubjectType: (v: string) => void
  subjectId: string
  setSubjectId: (v: string) => void
  onError: string | null
}) {
  const qc = useQueryClient()

  const [updating, setUpdating] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('')
  const [description, setDescription] = useState('')
  const [cardError, setCardError] = useState<string | null>(null)

  const refreshLabels = () => void qc.invalidateQueries({ queryKey: LABELS_KEY })
  const refreshAssignments = () => {
    if (open) void qc.invalidateQueries({ queryKey: [...LABEL_ASSIGNMENTS_KEY, label.id] as unknown[] })
  }

  const beginEdit = () => {
    setName(label.name ?? '')
    setColor(label.color ?? '')
    setDescription(label.description ?? '')
    setUpdating(v => !v)
    setCardError(null)
  }

  const updateMut = useMutation({
    mutationFn: () =>
      updateLabel(label.id, {
        name: name.trim() || undefined,
        color: color.trim() || null,
        description: description.trim() || null
      }),
    onSuccess: () => {
      setUpdating(false)
      refreshLabels()
    },
    onError: err => setCardError(labelsErrorCode(err) ?? k.labels.errors.update)
  })

  const assignMut = useMutation({
    mutationFn: () => assignLabel(label.id, { subjectType: subjectType.trim(), subjectId: subjectId.trim() }),
    onSuccess: () => {
      setSubjectType('')
      setSubjectId('')
      setCardError(null)
      refreshAssignments()
    },
    onError: err => setCardError(labelsErrorCode(err) ?? k.labels.errors.assign)
  })

  const unassignMut = useMutation({
    mutationFn: (assignmentId: string) => unassignLabel(assignmentId),
    onSuccess: () => {
      setCardError(null)
      refreshAssignments()
    },
    onError: err => setCardError(labelsErrorCode(err) ?? k.labels.errors.unassign)
  })

  const effectiveError = onError ?? cardError

  return (
    <div className="border-b border-(--ui-stroke-secondary)">
      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-(--ui-bg-quaternary)" onClick={onToggle}>
        <Codicon className="text-(--ui-text-tertiary)" name={open ? 'chevron-down' : 'chevron-right'} size="1rem" />
        <Codicon className="text-(--ui-text-tertiary)" name="tag" size="1.125rem" />
        <span className="flex-1">
          <span className="block text-[0.8125rem] font-medium text-foreground">{label.name ?? ''}</span>
          <span className="block font-mono text-[0.6875rem] text-(--ui-text-secondary)">
            {label.code ?? ''}
            {label.color ? ` · ${label.color}` : ''}
          </span>
        </span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{label.id}</span>
      </button>

      {open && (
        <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary/40) px-4 py-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-2.5 py-1 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
                onClick={beginEdit}
              >
                {updating ? k.labels.updateForm.cancel : k.labels.updateForm.update}
              </button>
            </div>

            {updating && (
              <div className="flex flex-col gap-1.5">
                <input
                  className={`${inp} flex-1`}
                  maxLength={200}
                  placeholder={k.labels.updateForm.name}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <input
                  className={`${inp} w-40`}
                  maxLength={30}
                  placeholder={k.labels.updateForm.color}
                  value={color}
                  onChange={e => setColor(e.target.value)}
                />
                <input
                  className={inp}
                  maxLength={500}
                  placeholder={k.labels.updateForm.description}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
                <button
                  className="w-fit rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={updateMut.isPending}
                  onClick={() => updateMut.mutate()}
                >
                  {updateMut.isPending ? k.agents.runs.executing : k.labels.updateForm.update}
                </button>
              </div>
            )}

            <div className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">
              {k.labels.assignments}
            </div>
            {assignmentLoading ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
            ) : assignments.length === 0 ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.labels.assignmentsEmpty}</p>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[0.75rem] text-foreground">
                    {a.subject_type ?? ''}
                    <span className="ml-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{a.subject_id ?? ''}</span>
                  </span>
                  <button
                    className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500 disabled:opacity-50"
                    disabled={unassignMut.isPending}
                    onClick={() => unassignMut.mutate(a.id)}
                  >
                    <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                    {unassignMut.isPending ? k.labels.unassigning : k.labels.unassign}
                  </button>
                </div>
              ))
            )}

            {effectiveError && <p className="text-[0.75rem] text-red-500">{effectiveError}</p>}

            <div className="flex items-center gap-2 pt-1">
              <input
                className={`${inp} w-36`}
                placeholder={k.labels.subjectTypePlaceholder}
                value={subjectType}
                onChange={e => setSubjectType(e.target.value)}
              />
              <input
                className={`${inp} min-w-0 flex-1`}
                placeholder={k.labels.subjectIdPlaceholder}
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
              />
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={assignMut.isPending || !subjectType.trim() || !subjectId.trim()}
                onClick={() => assignMut.mutate()}
              >
                {assignMut.isPending ? k.labels.assigning : k.labels.assign}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}