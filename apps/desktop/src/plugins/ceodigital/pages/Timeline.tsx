/**
 * CEODigital Timeline page (W6a) — the tenant's activity feed with entity/actor
 * filters and per-event pin/unpin + reactions, proxied via
 * `/api/plugins/ceodigital/timeline` (MCP `timeline.*`):
 *   * events     (GET  /timeline/events?entityType&entityId&actorUserId&eventGlob&from&to&cursor&limit)
 *   * pin/unpin  (POST /timeline/events/{id}/pin | /unpin)
 *   * reactions  (POST /timeline/events/{id}/reactions[/remove] {reaction_type})
 *
 * Mutations show pending state, optimistically paint the feed cache, roll back
 * on error; an authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  addEventReaction,
  fetchTimelineEvents,
  pinEvent,
  removeEventReaction,
  TIMELINE_EVENTS_KEY,
  unpinEvent
} from '../api'
import { useCeodigital, type CEODIGITALText } from '../i18n'
import type { CeodigitalErrorCode, TimelineEventRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function timelineErrorCode(err: unknown): CeodigitalErrorCode | null {
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

function isPinned(row: TimelineEventRow): boolean {
  return !!row.pinned
}

export function TimelinePage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [eventGlob, setEventGlob] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...TIMELINE_EVENTS_KEY, entityType, entityId, actorUserId, eventGlob] as unknown[],
    queryFn: () =>
      fetchTimelineEvents({
        entityType: entityType.trim() || undefined,
        entityId: entityId.trim() || undefined,
        actorUserId: actorUserId.trim() || undefined,
        eventGlob: eventGlob.trim() || undefined
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { events: TimelineEventRow[] }).events }
    }
    return { code: timelineErrorCode(listQ.error), rows: [] as TimelineEventRow[] }
  }, [listQ.data, listQ.error])

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: TIMELINE_EVENTS_KEY })
  }

  const pinMut = useMutation({
    mutationFn: (id: string) => pinEvent(id),
    onError: err => setActionError(timelineErrorCode(err) ?? k.timeline.errors.pin),
    onSettled: refresh
  })

  const unpinMut = useMutation({
    mutationFn: (id: string) => unpinEvent(id),
    onError: err => setActionError(timelineErrorCode(err) ?? k.timeline.errors.unpin),
    onSettled: refresh
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.timeline.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-36`}
          placeholder={k.timeline.entityType}
          value={entityType}
          onChange={e => setEntityType(e.target.value)}
        />
        <input
          className={`${inp} w-36`}
          placeholder={k.timeline.entityId}
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
        />
        <input
          className={`${inp} w-36`}
          placeholder={k.timeline.actorUserId}
          value={actorUserId}
          onChange={e => setActorUserId(e.target.value)}
        />
        <input
          className={`${inp} w-40`}
          placeholder={k.timeline.eventGlob}
          value={eventGlob}
          onChange={e => setEventGlob(e.target.value)}
        />
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
            <Codicon className="text-(--ui-text-quaternary)" name="list-unordered" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.timeline.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'event', 'entity', 'actor', 'at'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.timeline.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <EventRowView
                  key={row.id}
                  k={k}
                  row={row}
                  pinned={isPinned(row)}
                  onPin={id => pinMut.mutate(id)}
                  onUnpin={id => unpinMut.mutate(id)}
                  onError={setActionError}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function EventRowView({
  k,
  row,
  pinned,
  onPin,
  onUnpin,
  onError
}: {
  k: CEODIGITALText
  row: TimelineEventRow
  pinned: boolean
  onPin: (id: string) => void
  onUnpin: (id: string) => void
  onError: (e: string) => void
}) {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<'none' | 'reaction'>('none')
  const [reactionType, setReactionType] = useState('')

  const refresh = () => void qc.invalidateQueries({ queryKey: TIMELINE_EVENTS_KEY })

  const addMut = useMutation({
    mutationFn: () => addEventReaction(row.id, reactionType.trim()),
    onSuccess: () => { setReactionType(''); setPanel('none') },
    onError: err => onError(timelineErrorCode(err) ?? k.timeline.errors.addReaction),
    onSettled: refresh
  })

  const removeMut = useMutation({
    mutationFn: (type: string) => removeEventReaction(row.id, type),
    onError: err => onError(timelineErrorCode(err) ?? k.timeline.errors.removeReaction),
    onSettled: refresh
  })

  const reactions = Array.isArray(row.reactions) ? (row.reactions as unknown[]) : []
  const reactionTypes = reactions
    .map(r => (r && typeof r === 'object' ? (r as { reaction_type?: unknown }).reaction_type : r))
    .filter((t): t is string => typeof t === 'string')

  return (
    <>
      <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5 text-[0.8125rem] text-foreground">
            {pinned && <Codicon className="text-(--ui-text-tertiary)" name="pinned" size="0.875rem" />}
            {row.title}
          </div>
          {(row.event_type ?? row.eventType) && (
            <div className="mt-0.5 text-[0.6875rem] text-(--ui-text-tertiary)">{row.event_type ?? row.eventType}</div>
          )}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
          {row.entity_type ?? row.entityType ?? ''}
          {row.entity_id ? `:${row.entity_id}` : ''}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.actor_name ?? row.actor_user_id ?? ''}</td>
        <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
          {row.happened_at ?? row.created_at ?? ''}
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={pinned ? k.timeline.unpin : k.timeline.pin}
              onClick={() => (pinned ? onUnpin(row.id) : onPin(row.id))}
            >
              <Codicon className="text-(--ui-text-tertiary)" name={pinned ? 'pinned' : 'pin'} size="0.875rem" />
              {pinned ? k.timeline.unpin : k.timeline.pin}
            </button>
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={k.timeline.addReaction}
              onClick={() => setPanel(panel === 'reaction' ? 'none' : 'reaction')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="smiley" size="0.875rem" />
              {k.timeline.addReaction}
            </button>
          </div>
        </td>
      </tr>
      {panel === 'reaction' && (
        <tr className="border-b border-(--ui-stroke-secondary)">
          <td colSpan={6} className="bg-(--ui-bg-quaternary) px-4 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} w-32`}
                placeholder={k.timeline.addReaction}
                value={reactionType}
                onChange={e => setReactionType(e.target.value)}
              />
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1 text-[0.75rem] font-medium text-white disabled:opacity-50"
                disabled={addMut.isPending || !reactionType.trim()}
                onClick={() => addMut.mutate()}
              >
                {addMut.isPending ? k.timeline.actions.reacting : k.timeline.addReaction}
              </button>
              {reactionTypes.length > 0 && (
                <span className="flex items-center gap-1 text-[0.75rem] text-(--ui-text-secondary)">
                  {k.timeline.reactions}:
                  {reactionTypes.map(type => (
                    <button
                      key={type}
                      className="rounded-full border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                      disabled={removeMut.isPending}
                      title={k.timeline.removeReaction}
                      onClick={() => removeMut.mutate(type)}
                    >
                      {type}
                    </button>
                  ))}
                </span>
              )}
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1 text-[0.75rem] text-foreground"
                type="button"
                onClick={() => setPanel('none')}
              >
                {k.messaging.form.cancel}
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}