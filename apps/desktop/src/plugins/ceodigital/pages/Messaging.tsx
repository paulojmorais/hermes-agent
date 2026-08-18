/**
 * CEODigital Messaging page (W6a) — browse threads, open a thread detail with
 * its messages, create threads and post/react/mark-read/attach on the fly,
 * all proxied via `/api/plugins/ceodigital/messaging` (MCP `messaging.*`):
 *   * threads list (GET /messaging/threads?threadType&refTable&refId&limit)
 *   * thread detail (GET /messaging/threads/{id}?messageLimit)
 *   * messages     (GET /messaging/threads/{id}/messages?limit)
 *   * create       (POST /messaging/threads)
 *   * post         (POST /messaging/threads/{id}/messages {body})
 *   * react        (POST /messaging/messages/{id}/react {emoji})
 *   * read        (POST /messaging/messages/{id}/read)
 *   * attachment  (POST /messaging/messages/{id}/attachments {fileId, name?})
 *
 * The list opens a detail view (same window, back restores the list). Mutations
 * show pending state, optimistically paint the cache, roll back on error; an
 * authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  createThread,
  fetchMessages,
  fetchThread,
  fetchThreads,
  markMessageRead,
  postMessage,
  reactToMessage,
  threadKey,
  threadMessagesKey,
  THREADS_KEY,
  uploadAttachment
} from '../api'
import { useCeodigital, type CEODIGITALText } from '../i18n'
import type {
  CeodigitalErrorCode,
  MessageRow,
  ThreadRow,
  ThreadType
} from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function messagingErrorCode(err: unknown): CeodigitalErrorCode | null {
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

type ThreadFilter = 'all' | ThreadType

export function MessagingPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [filter, setFilter] = useState<ThreadFilter>('all')
  const [refTable, setRefTable] = useState('')
  const [refId, setRefId] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...THREADS_KEY, filter, refTable, refId] as unknown[],
    queryFn: () =>
      fetchThreads({
        threadType: filter === 'all' ? undefined : filter,
        refTable: refTable.trim() || undefined,
        refId: refId.trim() || undefined
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { threads: ThreadRow[] }).threads }
    }
    return { code: messagingErrorCode(listQ.error), rows: [] as ThreadRow[] }
  }, [listQ.data, listQ.error])

  const [subject, setSubject] = useState('')
  const [createRefTable, setCreateRefTable] = useState('')
  const [createRefId, setCreateRefId] = useState('')
  const [createType, setCreateType] = useState<ThreadType>('internal')

  function resetCreate() {
    setSubject(''); setCreateRefTable(''); setCreateRefId(''); setCreateType('internal'); setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createThread({
        subject: subject.trim() || undefined,
        refTable: createRefTable.trim() || undefined,
        refId: createRefId.trim() || undefined,
        threadType: createType
      }),
    onSuccess: () => {
      setCreating(false)
      resetCreate()
      void qc.invalidateQueries({ queryKey: THREADS_KEY })
    },
    onError: err => setActionError(messagingErrorCode(err) ?? k.errors.general)
  })

  if (selectedId) {
    return <ThreadDetail k={k} id={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.messaging.title}</h1>
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
            {k.messaging.newThread}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <div className="flex items-center gap-1">
          {(['all', 'internal', 'client'] as const).map(f => (
            <button
              key={f}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                filter === f ? 'bg-(--ui-bg-quaternary) text-foreground' : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? k.messaging.allTypes : f}
            </button>
          ))}
        </div>
        <input
          className={`${inp} w-40`}
          placeholder={k.messaging.refTable}
          value={refTable}
          onChange={e => setRefTable(e.target.value)}
        />
        <input
          className={`${inp} w-40`}
          placeholder={k.messaging.refId}
          value={refId}
          onChange={e => setRefId(e.target.value)}
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
                className={`${inp} flex-1`}
                placeholder={k.messaging.form.subjectPlaceholder}
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
              <select
                className={`${inp}`}
                value={createType}
                onChange={e => setCreateType(e.target.value as ThreadType)}
              >
                <option value="internal">internal</option>
                <option value="client">client</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.messaging.refTable}
                value={createRefTable}
                onChange={e => setCreateRefTable(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.messaging.refId}
                value={createRefId}
                onChange={e => setCreateRefId(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.messaging.form.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetCreate()
                }}
              >
                {k.messaging.form.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

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
            <Codicon className="text-(--ui-text-quaternary)" name="comment-discussion" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.messaging.empty}</p>
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
                    {k.messaging.headers[h]}
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
                    {row.refTable && (
                      <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                        {row.refTable}: {row.refId ?? ''}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.thread_type ?? row.threadType ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.created_at ?? ''}
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

function ThreadDetail({ k, id, onBack }: { k: CEODIGITALText; id: string; onBack: () => void }) {
  const qc = useQueryClient()

  const detailQ = useQuery({ queryKey: threadKey(id), queryFn: () => fetchThread(id) })
  const msgsQ = useQuery({ queryKey: threadMessagesKey(id), queryFn: () => fetchMessages(id) })

  const thread = isOk(detailQ.data)
    ? (detailQ.data as { thread: ThreadRow & { messages?: MessageRow[] } }).thread
    : null
  const messages = isOk(msgsQ.data) ? (msgsQ.data as { messages: MessageRow[] }).messages : []

  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const postMut = useMutation({
    mutationFn: () => postMessage(id, body.trim()),
    onSuccess: () => {
      setBody('')
      void qc.invalidateQueries({ queryKey: threadMessagesKey(id) })
      void qc.invalidateQueries({ queryKey: threadKey(id) })
    },
    onError: err => setError(messagingErrorCode(err) ?? k.messaging.errors.post)
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.messaging.back}
        </button>
        <h1 className="text-sm font-semibold text-foreground">{k.messaging.detail}</h1>
      </header>

      {detailQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : !thread ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.messaging.errors.fetchThread} />
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3">
            <div className="text-base font-semibold text-foreground">{thread.title}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-[0.75rem] text-(--ui-text-secondary)">
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">{thread.id}</span>
              {(thread.thread_type ?? thread.threadType) && (
                <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5">
                  {k.messaging.threadType}: {thread.thread_type ?? thread.threadType}
                </span>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {msgsQ.isLoading ? (
              <div className="grid flex-1 place-items-center py-8">
                <Loader type="lemniscate-bloom" />
              </div>
            ) : messages.length === 0 ? (
              <div className="grid flex-1 place-items-center px-4 py-8 text-center">
                <p className="text-xs text-(--ui-text-tertiary)">{k.messaging.messagesEmpty}</p>
              </div>
            ) : (
              <div className="divide-y divide-(--ui-stroke-secondary)">
                {messages.map(msg => (
                  <MessageRowView key={msg.id} k={k} msg={msg} onError={setError} />
                ))}
              </div>
            )}
          </div>

          <form
            className="shrink-0 border-t border-(--ui-stroke-secondary) px-4 py-3"
            onSubmit={e => {
              e.preventDefault()
              if (body.trim() && !postMut.isPending) postMut.mutate()
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <textarea
                className={`${inp} min-w-0 flex-1`}
                rows={2}
                placeholder={k.messaging.postPlaceholder}
                value={body}
                onChange={e => setBody(e.target.value)}
              />
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={postMut.isPending || !body.trim()}
                type="submit"
              >
                {postMut.isPending ? k.messaging.actions.posting : k.messaging.actions.post}
              </button>
            </div>
          </form>
          {error && <div className="shrink-0 px-4 pb-3 text-[0.75rem] text-red-500">{error}</div>}
        </>
      )}
    </div>
  )
}

function MessageRowView({
  k,
  msg,
  onError
}: {
  k: CEODIGITALText
  msg: MessageRow
  onError: (e: string) => void
}) {
  const qc = useQueryClient()
  const [panel, setPanel] = useState<'none' | 'react' | 'attach'>('none')
  const [emoji, setEmoji] = useState('')
  const [fileId, setFileId] = useState('')
  const [name, setName] = useState('')

  const invalidate = () =>
    void qc.invalidateQueries({ queryKey: ['ceodigital', 'messaging', 'threads'] })

  const readMut = useMutation({
    mutationFn: () => markMessageRead(msg.id),
    onError: err => onError(messagingErrorCode(err) ?? k.messaging.errors.markRead),
    onSettled: invalidate
  })

  const reactMut = useMutation({
    mutationFn: () => reactToMessage(msg.id, emoji.trim()),
    onSuccess: () => { setEmoji(''); setPanel('none') },
    onError: err => onError(messagingErrorCode(err) ?? k.messaging.errors.react),
    onSettled: invalidate
  })

  const attachMut = useMutation({
    mutationFn: () => uploadAttachment(msg.id, { fileId: fileId.trim(), name: name.trim() || undefined }),
    onSuccess: () => { setFileId(''); setName(''); setPanel('none') },
    onError: err => onError(messagingErrorCode(err) ?? k.messaging.errors.upload),
    onSettled: invalidate
  })

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.6875rem] font-medium text-(--ui-text-tertiary)">
          {msg.author_name ?? msg.sender_id ?? msg.id}
        </span>
        <span className="text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{msg.created_at ?? msg.createdAt ?? ''}</span>
        {(msg.is_read || msg.isRead) && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-tertiary)">
            ✓
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
            title={k.messaging.actions.react}
            onClick={() => setPanel(panel === 'react' ? 'none' : 'react')}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="smiley" size="0.875rem" />
            {k.messaging.actions.react}
          </button>
          <button
            className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
            title={k.messaging.actions.uploadAttachment}
            onClick={() => setPanel(panel === 'attach' ? 'none' : 'attach')}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="paperclip" size="0.875rem" />
            {k.messaging.actions.uploadAttachment}
          </button>
          <button
            className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
            title={k.messaging.actions.markRead}
            onClick={() => readMut.mutate()}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="check" size="0.875rem" />
            {k.messaging.actions.markRead}
          </button>
        </div>
      </div>
      {msg.body && <div className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-foreground">{msg.body}</div>}

      {panel === 'react' && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={e => {
            e.preventDefault()
            if (emoji.trim() && !reactMut.isPending) reactMut.mutate()
          }}
        >
          <input
            className={`${inp} w-28`}
            placeholder={k.messaging.emojiPlaceholder}
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
          />
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1 text-[0.75rem] font-medium text-white disabled:opacity-50"
            disabled={reactMut.isPending || !emoji.trim()}
            type="submit"
          >
            {reactMut.isPending ? k.messaging.actions.reacting : k.messaging.actions.react}
          </button>
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1 text-[0.75rem] text-foreground"
            type="button"
            onClick={() => setPanel('none')}
          >
            {k.messaging.form.cancel}
          </button>
        </form>
      )}
      {panel === 'attach' && (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={e => {
            e.preventDefault()
            if (fileId.trim() && !attachMut.isPending) attachMut.mutate()
          }}
        >
          <input
            className={`${inp} w-40`}
            placeholder={k.messaging.fileId}
            value={fileId}
            onChange={e => setFileId(e.target.value)}
          />
          <input
            className={`${inp} w-40`}
            placeholder={k.messaging.attachmentName}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1 text-[0.75rem] font-medium text-white disabled:opacity-50"
            disabled={attachMut.isPending || !fileId.trim()}
            type="submit"
          >
            {attachMut.isPending ? k.messaging.actions.uploading : k.messaging.actions.uploadAttachment}
          </button>
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1 text-[0.75rem] text-foreground"
            type="button"
            onClick={() => setPanel('none')}
          >
            {k.messaging.form.cancel}
          </button>
        </form>
      )}
    </div>
  )
}