/**
 * CEODigital Notifications page (W6a) — the caller's notification inbox with an
 * unread filter, an unread-count badge and per-row/full mark-read, proxied via
 * `/api/plugins/ceodigital/notifications` (MCP `notifications.*`):
 *   * list        (GET  /notifications?unreadOnly&cursor&limit)
 *   * unread count (GET /notifications/unread-count)
 *   * mark read   (POST /notifications/{id}/read)
 *   * mark all    (POST /notifications/read-all)
 *
 * Mutations show pending state and invalidate both the list and the badge; an
 * authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_KEY,
  UNREAD_COUNT_KEY
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, NotificationRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function notificationsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

function isUnread(row: NotificationRow): boolean {
  return row.is_read === false || row.isRead === false || row.read === false
}

export function NotificationsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [unreadOnly, setUnreadOnly] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, unreadOnly] as unknown[],
    queryFn: () => fetchNotifications({ unreadOnly: unreadOnly || undefined })
  })

  const countQ = useQuery({ queryKey: UNREAD_COUNT_KEY, queryFn: fetchUnreadCount })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return {
        code: null as CeodigitalErrorCode | null,
        rows: (listQ.data as { notifications: NotificationRow[] }).notifications
      }
    }
    return { code: notificationsErrorCode(listQ.error), rows: [] as NotificationRow[] }
  }, [listQ.data, listQ.error])

  const unreadCount = isOk(countQ.data) ? (countQ.data as { unread_count: number }).unread_count : 0

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY })
    void qc.invalidateQueries({ queryKey: UNREAD_COUNT_KEY })
  }

  const markReadMut = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onError: err => setActionError(notificationsErrorCode(err) ?? k.notifications.errors.markRead),
    onSettled: refresh
  })

  const markAllMut = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onError: err => setActionError(notificationsErrorCode(err) ?? k.notifications.errors.markAll),
    onSettled: refresh
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.notifications.title}</h1>
        {unreadCount > 0 && (
          <span className="rounded-full bg-(--ui-accent) px-1.5 py-px text-[0.625rem] tabular-nums text-white">
            {unreadCount}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
            disabled={markAllMut.isPending}
            onClick={() => markAllMut.mutate()}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="check-all" size="0.875rem" />
            {markAllMut.isPending ? k.notifications.marking : k.notifications.markAllRead}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        {(['all', 'unread'] as const).map(f => (
          <button
            key={f}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              (f === 'unread' ? unreadOnly : !unreadOnly)
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setUnreadOnly(f === 'unread')}
          >
            {f === 'all' ? k.notifications.all : k.notifications.unreadOnly}
          </button>
        ))}
      </div>

      {actionError && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

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
            <Codicon className="text-(--ui-text-quaternary)" name="bell" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.notifications.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'type', 'created'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.notifications.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const unread = isUnread(row)
                return (
                  <tr key={row.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                    <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                      {row.id}
                    </td>
                    <td className="px-4 py-2">
                      <div className={`text-[0.8125rem] ${unread ? 'font-medium text-foreground' : 'text-(--ui-text-secondary)'}`}>
                        {row.title}
                      </div>
                      {row.message && row.message !== row.title && (
                        <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                          {row.message}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.type ?? ''}</td>
                    <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                      {row.created_at ?? row.createdAt ?? ''}
                    </td>
                    <td className="px-4 py-2">
                      {unread && (
                        <button
                          className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                          disabled={markReadMut.isPending}
                          onClick={() => markReadMut.mutate(row.id)}
                        >
                          <Codicon className="text-(--ui-text-tertiary)" name="check" size="0.875rem" />
                          {k.notifications.markRead}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}