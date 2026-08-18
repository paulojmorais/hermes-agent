/**
 * CEODigital Workspaces page (W6b) — the tenant's workspaces with member
 * management, proxied via `/api/plugins/ceodigital/workspaces` (MCP
 * `workspaces.*`):
 *   * list     (GET  /workspaces?archived&categoryId&search&limit)
 *   * create   (POST /workspaces {name, description?, categoryId?, icon?, color?})
 *   * members  (GET  /workspaces/{id}/members)
 *   * add      (POST /workspaces/{id}/members {userId, role?})
 *   * remove   (POST /workspaces/{id}/members/{memberId}/remove)
 *
 * Each workspace expands to manage its members with a role picker. Mutations
 * invalidate the workspaces + members keys so an authoritative refetch wins.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  addWorkspaceMember,
  createWorkspace,
  fetchWorkspaceMembers,
  fetchWorkspaces,
  removeWorkspaceMember,
  WORKSPACES_KEY,
  workspaceMembersKey
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, WorkspaceMemberRow, WorkspaceRow, WorkspaceRole } from '../types'
import { WORKSPACE_ROLES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function workspacesErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function WorkspacesPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [archivedOnly, setArchivedOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [color, setColor] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [openId, setOpenId] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState<WorkspaceRole>('member')

  const listQ = useQuery({
    queryKey: [...WORKSPACES_KEY, { archivedOnly, search, categoryId }] as unknown[],
    queryFn: () =>
      fetchWorkspaces({
        archived: archivedOnly || undefined,
        search: search || undefined,
        categoryId: categoryId || undefined
      })
  })

  const memberQ = useQuery({
    queryKey: workspaceMembersKey(openId ?? ''),
    queryFn: () => fetchWorkspaceMembers(openId ?? ''),
    enabled: !!openId
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { workspaces: WorkspaceRow[] }).workspaces }
    }
    return { code: workspacesErrorCode(listQ.error), rows: [] as WorkspaceRow[] }
  })()

  const members: WorkspaceMemberRow[] = isOk(memberQ.data) ? (memberQ.data as { members: WorkspaceMemberRow[] }).members : []
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const resetForm = () => {
    setName(''); setDescription(''); setIcon(''); setColor(''); setCategoryId('')
    setActionError(null)
  }

  const refreshWorkspaces = () => void qc.invalidateQueries({ queryKey: WORKSPACES_KEY })

  const createMut = useMutation({
    mutationFn: () =>
      createWorkspace({
        name: name.trim(),
        description: description.trim() || undefined,
        categoryId: categoryId.trim() || undefined,
        icon: icon.trim() || undefined,
        color: color.trim() || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetForm()
      refreshWorkspaces()
    },
    onError: err => setActionError(workspacesErrorCode(err) ?? k.workspaces.errors.create)
  })

  const addMut = useMutation({
    mutationFn: ({ wid, body }: { wid: string; body: { userId: string; role: WorkspaceRole } }) =>
      addWorkspaceMember(wid, body),
    onSuccess: () => {
      setAddUserId('')
      setAddRole('member')
      if (openId) void qc.invalidateQueries({ queryKey: workspaceMembersKey(openId) })
      refreshWorkspaces()
    },
    onError: err => setActionError(workspacesErrorCode(err) ?? k.workspaces.errors.addMember)
  })

  const removeMut = useMutation({
    mutationFn: ({ wid, memberId }: { wid: string; memberId: string }) => removeWorkspaceMember(wid, memberId),
    onSuccess: () => {
      if (openId) void qc.invalidateQueries({ queryKey: workspaceMembersKey(openId) })
      refreshWorkspaces()
    },
    onError: err => setActionError(workspacesErrorCode(err) ?? k.workspaces.errors.removeMember)
  })

  const toggleOpen = (id: string) => {
    setActionError(null)
    setAddUserId('')
    setAddRole('member')
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.workspaces.title}</h1>
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
            {k.workspaces.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        {(['all', 'archived'] as const).map(f => (
          <button
            key={f}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              (f === 'archived' ? archivedOnly : !archivedOnly)
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setArchivedOnly(f === 'archived')}
          >
            {f === 'all' ? k.workspaces.all : k.workspaces.archivedOnly}
          </button>
        ))}
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.workspaces.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          className={`${inp} w-40`}
          placeholder={k.workspaces.createForm.categoryId}
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
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
              placeholder={k.workspaces.createForm.namePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className={inp}
              placeholder={k.workspaces.createForm.description}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.workspaces.createForm.icon}
                value={icon}
                onChange={e => setIcon(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.workspaces.createForm.color}
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.workspaces.createForm.categoryId}
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending || !name.trim()}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.workspaces.createForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetForm()
                }}
              >
                {k.workspaces.createForm.cancel}
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
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="multiple-windows" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.workspaces.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map(ws => (
            <WorkspaceCard
              key={ws.id}
              ws={ws}
              k={k}
              open={openId === ws.id}
              onToggle={() => toggleOpen(ws.id)}
              members={openId === ws.id ? members : []}
              memberLoading={openId === ws.id && memberQ.isLoading}
              addUserId={addUserId}
              setAddUserId={setAddUserId}
              addRole={addRole}
              setAddRole={setAddRole}
              addPending={addMut.isPending}
              removePending={removeMut.isPending}
              onAdd={() => addMut.mutate({ wid: ws.id, body: { userId: addUserId, role: addRole } })}
              onRemove={memberId => removeMut.mutate({ wid: ws.id, memberId })}
              onError={actionError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkspaceCard({
  ws,
  k,
  open,
  onToggle,
  members,
  memberLoading,
  addUserId,
  setAddUserId,
  addRole,
  setAddRole,
  addPending,
  removePending,
  onAdd,
  onRemove,
  onError
}: {
  ws: WorkspaceRow
  k: ReturnType<typeof useCeodigital>
  open: boolean
  onToggle: () => void
  members: WorkspaceMemberRow[]
  memberLoading: boolean
  addUserId: string
  setAddUserId: (v: string) => void
  addRole: WorkspaceRole
  setAddRole: (v: WorkspaceRole) => void
  addPending: boolean
  removePending: boolean
  onAdd: () => void
  onRemove: (memberId: string) => void
  onError: string | null
}) {
  return (
    <div className="border-b border-(--ui-stroke-secondary)">
      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-(--ui-bg-quaternary)" onClick={onToggle}>
        <Codicon
          className="text-(--ui-text-tertiary)"
          name={open ? 'chevron-down' : 'chevron-right'}
          size="1rem"
        />
        <Codicon className="text-(--ui-text-tertiary)" name="multiple-windows" size="1.125rem" />
        <span className="flex-1">
          <span className="block text-[0.8125rem] font-medium text-foreground">{ws.title}</span>
          {ws.description && (
            <span className="block text-[0.6875rem] text-(--ui-text-secondary)">{ws.description}</span>
          )}
        </span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{ws.id}</span>
      </button>

      {open && (
        <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary/40) px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <div className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">
              {k.workspaces.members}
            </div>
            {memberLoading ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
            ) : members.length === 0 ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.workspaces.membersEmpty}</p>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[0.75rem] text-foreground">
                    {m.name || m.full_name || m.email || m.id}
                    <span className="ml-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{m.id}</span>
                  </span>
                  <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                    {m.role ? k.workspaces.memberRoles[m.role as WorkspaceRole] ?? m.role : ''}
                  </span>
                  <button
                    className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
                    disabled={removePending}
                    onClick={() => onRemove(m.id)}
                  >
                    <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                    {k.workspaces.removeMember}
                  </button>
                </div>
              ))
            )}
            {onError && <p className="text-[0.75rem] text-red-500">{onError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <input
                className={`${inp} min-w-0 flex-1`}
                placeholder={k.workspaces.addMemberPlaceholder}
                value={addUserId}
                onChange={e => setAddUserId(e.target.value)}
              />
              <select
                className={inp}
                value={addRole}
                onChange={e => setAddRole(e.target.value as WorkspaceRole)}
              >
                {WORKSPACE_ROLES.map(r => (
                  <option key={r} value={r}>
                    {k.workspaces.memberRoles[r]}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={addPending || !addUserId.trim()}
                onClick={onAdd}
              >
                {addPending ? k.agents.runs.executing : k.workspaces.addMember}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
