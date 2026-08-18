/**
 * CEODigital Conversations page (W4) — browse, create, archive and share the
 * tenant's automation conversations, all proxied via
 * `/api/plugins/ceodigital/automation/conversations` (MCP `conversations.*`):
 *   * list    (GET  /automation/conversations?isArchived&search&limit)
 *   * create  (POST /automation/conversations)
 *   * archive (POST /automation/conversations/{id}/archive)
 *   * share   (POST /automation/conversations/{id}/share {enabled})
 *
 * The list carries an isArchived filter + a free-text search; the create form
 * is hidden behind a toolbar toggle. Row actions expand an inline confirm
 * (run/archive/share), showing pending state, optimistically painting the list
 * cache, and rolling back on error; an authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import {
  archiveConversation,
  CONVERSATIONS_KEY,
  createConversation,
  fetchConversations,
  shareConversation
} from '../api'
import { useCeodigital } from '../i18n'
import type { AutomationActionEnvelope, CeodigitalErrorCode, ConversationRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function conversationErrorCode(err: unknown): CeodigitalErrorCode | null {
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

type RowAction = 'archive' | 'share' | 'unshare'

export function ConversationsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [archived, setArchived] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionFor, setActionFor] = useState<{ id: string; action: RowAction } | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create form fields.
  const [title, setTitle] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [model, setModel] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [tags, setTags] = useState('')

  const listQ = useQuery({
    queryKey: [...CONVERSATIONS_KEY, archived, search] as unknown[],
    queryFn: () =>
      fetchConversations({
        isArchived: archived || undefined,
        search: search.trim() || undefined
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { conversations: ConversationRow[] }).conversations }
    }
    return { code: conversationErrorCode(listQ.error), rows: [] as ConversationRow[] }
  }, [listQ.data, listQ.error])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  function resetForm() {
    setTitle(''); setSystemPrompt(''); setModel(''); setWorkspaceId(''); setTags('')
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () => {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      return createConversation({
        title: title.trim() || undefined,
        systemPrompt: systemPrompt.trim() || undefined,
        model: model.trim() || undefined,
        workspaceId: workspaceId.trim() || undefined,
        tags: tagList.length ? tagList : undefined
      })
    },
    onSuccess: () => {
      setCreating(false)
      resetForm()
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    },
    onError: err => setActionError(conversationErrorCode(err) ?? k.errors.general)
  })

  const archiveMut = useMutation({
    mutationFn: (id: string) => archiveConversation(id),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: CONVERSATIONS_KEY })
      const prev = qc.getQueryData(CONVERSATIONS_KEY)
      if (prev && isOk(prev)) {
        qc.setQueryData(CONVERSATIONS_KEY, {
          ...prev,
          conversations: (prev as { conversations: ConversationRow[] }).conversations.map(c =>
            c.id === id ? { ...c, is_archived: true } : c
          )
        })
      }
      return { prev }
    },
    onError: (_err: unknown, _id: string, ctx?: { prev?: unknown }) => {
      if (ctx?.prev) qc.setQueryData(CONVERSATIONS_KEY, ctx.prev)
      setActionError(k.errors.general)
    },
    onSettled: (_d, _e, id: string) => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    }
  })

  const pendingId = (): string | null =>
    actionFor && (archiveMut.isPending || shareMut.isPending) ? actionFor.id : null

  const shareMut = useMutation({
    mutationFn: (id: string) => shareConversation(id, actionFor?.action === 'share'),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: CONVERSATIONS_KEY })
      const prev = qc.getQueryData(CONVERSATIONS_KEY)
      if (prev && isOk(prev)) {
        qc.setQueryData(CONVERSATIONS_KEY, {
          ...prev,
          conversations: (prev as { conversations: ConversationRow[] }).conversations.map(c =>
            c.id === id ? { ...c, shared: actionFor?.action === 'share' } : c
          )
        })
      }
      return { prev }
    },
    onError: (_err: unknown, _id: string, ctx?: { prev?: unknown }) => {
      if (ctx?.prev) qc.setQueryData(CONVERSATIONS_KEY, ctx.prev)
      setActionError(k.errors.general)
    },
    onSettled: (_d, _e, id: string) => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
    }
  })

  const openAction = (id: string, action: RowAction) => {
    setActionError(null)
    setActionFor({ id, action })
  }

  const submitAction = (row: ConversationRow) => {
    const id = row.id
    if (actionFor?.action === 'archive') archiveMut.mutate(id)
    else if (actionFor?.action === 'share' || actionFor?.action === 'unshare') shareMut.mutate(id)
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.automation.conversations.title}</h1>
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
            {k.automation.conversations.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <div className="flex items-center gap-1">
          {(['all', 'archivedOnly'] as const).map(f => (
            <button
              key={f}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                (f === 'archivedOnly' ? archived : !archived)
                  ? 'bg-(--ui-bg-quaternary) text-foreground'
                  : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setArchived(f === 'archivedOnly')}
            >
              {k.automation.conversations[f]}
            </button>
          ))}
        </div>
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.automation.conversations.search}
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
            <input
              className={inp}
              placeholder={k.automation.conversations.form.titlePlaceholder}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className={inp}
              placeholder={k.automation.conversations.form.systemPrompt}
              rows={2}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.automation.conversations.form.model}
                value={model}
                onChange={e => setModel(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.automation.conversations.form.workspaceId}
                value={workspaceId}
                onChange={e => setWorkspaceId(e.target.value)}
              />
            </div>
            <input
              className={inp}
              placeholder={k.automation.conversations.form.tags}
              value={tags}
              onChange={e => setTags(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.automation.conversations.form.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetForm()
                }}
              >
                {k.automation.conversations.form.cancel}
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
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="message" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.automation.conversations.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'model', 'archived', 'shared', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.automation.conversations.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <RowWithActions
                  key={row.id}
                  row={row}
                  k={k}
                  pending={pendingId()}
                  active={actionFor}
                  onAction={openAction}
                  archiveMut={archiveMut}
                  shareMut={shareMut}
                  onError={actionError}
                  onSubmit={() => submitAction(row)}
                  onCancel={() => { setActionFor(null); setActionError(null) }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RowWithActions({
  row,
  k,
  pending,
  active,
  onAction,
  archiveMut,
  shareMut,
  onError,
  onSubmit,
  onCancel
}: {
  row: ConversationRow
  k: ReturnType<typeof useCeodigital>
  pending: string | null
  active: { id: string; action: RowAction } | null
  onAction: (id: string, action: RowAction) => void
  archiveMut: UseMutationResult<AutomationActionEnvelope, unknown, string, { prev?: unknown }>
  shareMut: UseMutationResult<AutomationActionEnvelope, unknown, string, { prev?: unknown }>
  onError: string | null
  onSubmit: () => void
  onCancel: () => void
}) {
  const isActive = active?.id === row.id
  const isBusy = pending === row.id
  const shared = !!row.shared || (isActive && active?.action === 'share')

  return (
    <>
      <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
        <td className="px-4 py-2">
          <div className="text-[0.8125rem] text-foreground">{row.title}</div>
          {row.systemPrompt && (
            <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
              {row.systemPrompt}
            </div>
          )}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.model ?? ''}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
          {(row.is_archived || row.isArchived) ? '✓' : ''}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{shared ? '✓' : ''}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={k.automation.conversations.actions.archive}
              onClick={() => onAction(row.id, 'archive')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="archive" size="0.875rem" />
              {k.automation.conversations.actions.archive}
            </button>
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={shared ? k.automation.conversations.actions.unshare : k.automation.conversations.actions.share}
              onClick={() => onAction(row.id, shared ? 'unshare' : 'share')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="link" size="0.875rem" />
              {shared ? k.automation.conversations.actions.unshare : k.automation.conversations.actions.share}
            </button>
          </div>
        </td>
      </tr>
      {isActive && (
        <tr className="border-b border-(--ui-stroke-secondary)">
          <td colSpan={6} className="bg-(--ui-bg-quaternary) px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-(--ui-text-tertiary)">
                {active.action === 'archive'
                  ? k.automation.conversations.actions.archive
                  : active.action === 'share'
                    ? k.automation.conversations.actions.share
                    : k.automation.conversations.actions.unshare}
              </span>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={isBusy}
                onClick={onSubmit}
              >
                {isBusy
                  ? active.action === 'archive'
                    ? k.automation.conversations.actions.archiving
                    : active.action === 'share'
                      ? k.automation.conversations.actions.sharing
                      : k.agents.runs.executing
                  : active.action === 'archive'
                    ? k.automation.conversations.actions.archive
                    : active.action === 'share'
                      ? k.automation.conversations.actions.share
                      : k.automation.conversations.actions.unshare}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                disabled={isBusy}
                onClick={onCancel}
              >
                {k.automation.playbooks.cancel}
              </button>
              {onError && <span className="text-[0.75rem] text-red-500">{onError}</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}