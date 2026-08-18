/**
 * CEODigital Attendance page (W8-UI-a) — the tenant's attendance items with
 * assign + status updates, proxied via `/api/plugins/ceodigital/attendance`
 * (MCP `attendance.*`):
 *   * list    (GET  /attendance/items?kind&status&priority&assigneeId&limit)
 *   * detail  (GET  /attendance/items/{id})
 *   * assign  (POST /attendance/items/{id}/assign {assigneeId})
 *   * status  (POST /attendance/items/{id}/status {status, metadata?})
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  assignAttendanceItem,
  ATTENDANCE_ITEMS_KEY,
  attendanceItemKey,
  fetchAttendanceItem,
  fetchAttendanceItems,
  updateAttendanceStatus
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type {
  AttendanceItemRow,
  AttendancePriority,
  AttendanceStatus,
  CeodigitalErrorCode
} from '../types'
import { ATTENDANCE_PRIORITIES, ATTENDANCE_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function attendanceErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const statusLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.attendance.statuses[status as AttendanceStatus] ?? status ?? '')
const priorityLabel = (k: CEODIGITALText, priority: null | string | undefined): string =>
  (k.attendance.priorities[priority as AttendancePriority] ?? priority ?? '')

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

const TABLE_HEAD =
  'px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)'

export function AttendancePage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [kindFilter, setKindFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [
      ...ATTENDANCE_ITEMS_KEY,
      { kindFilter, statusFilter, priorityFilter, assigneeFilter }
    ] as unknown[],
    queryFn: () =>
      fetchAttendanceItems({
        kind: kindFilter.trim() || undefined,
        status: (statusFilter || undefined) as AttendanceStatus | undefined,
        priority: (priorityFilter || undefined) as AttendancePriority | undefined,
        assigneeId: assigneeFilter.trim() || undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { items: AttendanceItemRow[] }).items }
    }
    return { code: attendanceErrorCode(listQ.error), rows: [] as AttendanceItemRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const detailQ = useQuery({
    queryKey: selectedId ? attendanceItemKey(selectedId) : [...attendanceItemKey(''), null],
    queryFn: () => fetchAttendanceItem(selectedId as string),
    enabled: !!selectedId
  })

  const selected =
    selectedId && isOk(detailQ.data) ? (detailQ.data as { item: AttendanceItemRow }).item : null

  const refresh = () => void qc.invalidateQueries({ queryKey: ATTENDANCE_ITEMS_KEY })

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
          <ErrorState title={k.attendance.errors.fetchItem} />
        </div>
      )
    }
    return <ItemDetail k={k} item={selected} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.attendance.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-36`}
          placeholder={k.attendance.kindPlaceholder}
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value)}
        />
        <select className={inp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{k.attendance.allStatuses}</option>
          {ATTENDANCE_STATUSES.map(s => (
            <option key={s} value={s}>
              {k.attendance.statuses[s] ?? s}
            </option>
          ))}
        </select>
        <select className={inp} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">{k.attendance.allPriorities}</option>
          {ATTENDANCE_PRIORITIES.map(p => (
            <option key={p} value={p}>
              {k.attendance.priorities[p] ?? p}
            </option>
          ))}
        </select>
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.attendance.assigneeIdPlaceholder}
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
        />
      </div>

      {actionError && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

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
            <Codicon className="text-(--ui-text-quaternary)" name="calendar" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.attendance.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'kind', 'status', 'priority', 'assignee'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.attendance.headers[h]}
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
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.kind ?? ''}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {statusLabel(k, row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {priorityLabel(k, row.priority)}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.assignee_id ?? ''}
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

function ItemDetail({
  k,
  item,
  onBack
}: {
  k: CEODIGITALText
  item: AttendanceItemRow
  onBack: () => void
}) {
  const qc = useQueryClient()

  const [assigneeId, setAssigneeId] = useState('')
  const [statusUpdate, setStatusUpdate] = useState<AttendanceStatus | ''>('')
  const [actionError, setActionError] = useState<string | null>(null)

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: attendanceItemKey(item.id) })
    void qc.invalidateQueries({ queryKey: ATTENDANCE_ITEMS_KEY })
  }

  const assignMut = useMutation({
    mutationFn: () => assignAttendanceItem(item.id, { assigneeId: assigneeId.trim() }),
    onSuccess: () => {
      setAssigneeId('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(attendanceErrorCode(err) ?? k.attendance.errors.assign)
  })

  const statusMut = useMutation({
    mutationFn: () => updateAttendanceStatus(item.id, { status: statusUpdate }),
    onSuccess: () => {
      setStatusUpdate('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(attendanceErrorCode(err) ?? k.attendance.errors.updateStatus)
  })

  return (
    <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.attendance.back}
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">{k.attendance.detail}</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[0.8125rem]">
          {(
            [
              ['id', item.id],
              ['title', item.title ?? ''],
              ['kind', item.kind ?? ''],
              ['status', statusLabel(k, item.status)],
              ['priority', priorityLabel(k, item.priority)],
              ['assignee', item.assignee_id ?? ''],
              ['created', item.created_at ?? '']
            ] as const
          ).map(([key, val]) => (
            <div key={key}>
              <dt className="text-[0.625rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                {k.attendance.detailHeaders[key]}
              </dt>
              <dd className="truncate text-foreground">{val}</dd>
            </div>
          ))}
        </dl>

        {item.metadata && (
          <pre className="mt-2 overflow-x-auto rounded-md border border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary/40) p-2 font-mono text-[0.6875rem] text-(--ui-text-secondary)">
            {JSON.stringify(item.metadata, null, 2)}
          </pre>
        )}

        <div className="mt-4 border-t border-(--ui-stroke-secondary) pt-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[0.625rem] text-(--ui-text-tertiary)">
                {k.attendance.assigneeIdPlaceholder}
              </span>
              <input
                className={inp}
                placeholder={k.attendance.assigneeIdPlaceholder}
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
              />
            </label>
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              disabled={assignMut.isPending || !assigneeId.trim()}
              onClick={() => assignMut.mutate()}
            >
              {assignMut.isPending ? k.attendance.assigning : k.attendance.assign}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1">
              <span className="text-[0.625rem] text-(--ui-text-tertiary)">
                {k.attendance.updateStatus}
              </span>
              <select
                className={inp}
                value={statusUpdate}
                onChange={e => setStatusUpdate(e.target.value as AttendanceStatus | '')}
              >
                <option value="">—</option>
                {ATTENDANCE_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {k.attendance.statuses[s] ?? s}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              disabled={statusMut.isPending || !statusUpdate}
              onClick={() => statusMut.mutate()}
            >
              {statusMut.isPending ? k.attendance.updatingStatus : k.attendance.updateStatus}
            </button>
          </div>

          {actionError && <p className="mt-2 text-[0.75rem] text-red-500">{actionError}</p>}
        </div>
      </div>
    </div>
  )
}