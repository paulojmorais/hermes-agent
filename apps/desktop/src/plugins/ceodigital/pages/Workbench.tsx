/**
 * CEODigital Workbench page (W8-UI-a) — the tenant's pinned subjects with note
 * editing, proxied via `/api/plugins/ceodigital/workbench` (MCP
 * `workbench.pins.*`):
 *   * list    (GET  /workbench/pins?subjectType&limit)
 *   * toggle  (POST /workbench/pins/toggle {subjectType, subjectId, title?})
 *   * note    (POST /workbench/pins/{id}/note {note})
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import { fetchWorkbenchPins, PINS_KEY, setPinNote, toggleWorkbenchPin } from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, PinRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function workbenchErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const TABLE_HEAD =
  'px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)'

export function WorkbenchPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [subjectTypeFilter, setSubjectTypeFilter] = useState('')

  const [togglingPin, setTogglingPin] = useState(false)
  const [subjectType, setSubjectType] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [title, setTitle] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...PINS_KEY, { subjectTypeFilter }] as unknown[],
    queryFn: () => fetchWorkbenchPins({ subjectType: subjectTypeFilter.trim() || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { pins: PinRow[] }).pins }
    }
    return { code: workbenchErrorCode(listQ.error), rows: [] as PinRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const refresh = () => void qc.invalidateQueries({ queryKey: PINS_KEY })

  const toggleMut = useMutation({
    mutationFn: () =>
      toggleWorkbenchPin({
        subjectType: subjectType.trim(),
        subjectId: subjectId.trim(),
        title: title.trim() || null
      }),
    onSuccess: () => {
      setTogglingPin(false)
      setSubjectType('')
      setSubjectId('')
      setTitle('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(workbenchErrorCode(err) ?? k.workbench.errors.toggle)
  })

  const noteMut = useMutation({
    mutationFn: ({ pinId, note }: { pinId: string; note: string }) => setPinNote(pinId, { note }),
    onSuccess: () => {
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(workbenchErrorCode(err) ?? k.workbench.errors.setNote)
  })

  const clearMut = useMutation({
    mutationFn: (pinId: string) => setPinNote(pinId, { note: null }),
    onSuccess: () => {
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(workbenchErrorCode(err) ?? k.workbench.errors.setNote)
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.workbench.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={togglingPin || toggleMut.isPending}
            onClick={() => setTogglingPin(v => !v)}
          >
            {k.workbench.newPin}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.workbench.toggleForm.subjectTypePlaceholder}
          value={subjectTypeFilter}
          onChange={e => setSubjectTypeFilter(e.target.value)}
        />
      </div>

      {togglingPin && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!toggleMut.isPending) toggleMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} w-40`}
                placeholder={k.workbench.toggleForm.subjectTypePlaceholder}
                value={subjectType}
                onChange={e => setSubjectType(e.target.value)}
              />
              <input
                className={`${inp} min-w-0 flex-1`}
                placeholder={k.workbench.toggleForm.subjectIdPlaceholder}
                value={subjectId}
                onChange={e => setSubjectId(e.target.value)}
              />
              <input
                className={`${inp} min-w-0 flex-1`}
                maxLength={300}
                placeholder={k.workbench.toggleForm.titlePlaceholder}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                type="submit"
                disabled={toggleMut.isPending || !subjectType.trim() || !subjectId.trim()}
              >
                {toggleMut.isPending ? k.workbench.toggleForm.toggling : k.workbench.toggleForm.toggle}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setTogglingPin(false)
                  setSubjectType('')
                  setSubjectId('')
                  setTitle('')
                  setActionError(null)
                }}
              >
                {k.workbench.toggleForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !togglingPin && (
        <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>
      )}

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
            <Codicon className="text-(--ui-text-quaternary)" name="pin" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.workbench.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'subject', 'title', 'note'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.workbench.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(pin => (
                <PinRow
                  key={pin.id}
                  k={k}
                  pin={pin}
                  notePending={noteMut.isPending}
                  clearPending={clearMut.isPending}
                  onSave={(note: string) => noteMut.mutate({ pinId: pin.id, note })}
                  onClear={() => clearMut.mutate(pin.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function PinRow({
  k,
  pin,
  notePending,
  clearPending,
  onSave,
  onClear
}: {
  k: CEODIGITALText
  pin: PinRow
  notePending: boolean
  clearPending: boolean
  onSave: (note: string) => void
  onClear: () => void
}) {
  const [note, setNote] = useState(pin.note ?? '')
  const [editing, setEditing] = useState(false)

  const beginEdit = () => {
    setNote(pin.note ?? '')
    setEditing(true)
  }

  return (
    <tr className="border-b border-(--ui-stroke-secondary) last:border-0">
      <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{pin.id}</td>
      <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
        {pin.subject_type ?? ''}
        <span className="ml-1 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{pin.subject_id ?? ''}</span>
      </td>
      <td className="px-4 py-2 text-[0.8125rem] text-foreground">{pin.title ?? ''}</td>
      <td className="px-4 py-2">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              className={`${inp} min-w-0 flex-1`}
              maxLength={2000}
              placeholder={k.workbench.notePlaceholder}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              className="rounded-md bg-(--ui-accent) px-2.5 py-1 text-[0.6875rem] font-medium text-white disabled:opacity-50"
              disabled={notePending}
              onClick={() => {
                onSave(note)
                setEditing(false)
              }}
            >
              {notePending ? k.workbench.settingNote : k.workbench.setNote}
            </button>
            <button
              className="rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.6875rem] text-(--ui-text-secondary)"
              disabled={clearPending}
              onClick={() => {
                onClear()
                setEditing(false)
              }}
            >
              {k.workbench.clearNote}
            </button>
          </div>
        ) : (
          <button
            className="block min-w-0 max-w-full truncate text-left text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
            title={pin.note ?? ''}
            onClick={beginEdit}
          >
            {pin.note ?? ''}
          </button>
        )}
      </td>
    </tr>
  )
}