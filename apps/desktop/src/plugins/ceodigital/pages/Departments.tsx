/**
 * CEODigital Departments page (W6b) — the tenant's departments with member
 * management, proxied via `/api/plugins/ceodigital/departments` (MCP
 * `departments.*`):
 *   * list     (GET  /departments?activeOnly&search&limit)
 *   * create   (POST /departments {name, slugKey, areas?, headId?})
 *   * members  (GET  /departments/{id}/members)
 *   * add      (POST /departments/{id}/members {userId, role?})
 *   * remove   (POST /departments/{id}/members/{userId}/remove)
 *
 * Each department expands to manage its members with a role picker. Mutations
 * invalidate the departments + members keys so an authoritative refetch wins.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  addDepartmentMember,
  createDepartment,
  fetchDepartmentMembers,
  fetchDepartments,
  removeDepartmentMember,
  DEPARTMENTS_KEY,
  departmentMembersKey
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, DepartmentMemberRow, DepartmentRole, DepartmentRow } from '../types'
import { DEPARTMENT_ROLES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function departmentsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function DepartmentsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [activeOnly, setActiveOnly] = useState(false)
  const [search, setSearch] = useState('')

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [slugKey, setSlugKey] = useState('')
  const [areas, setAreas] = useState('')
  const [headId, setHeadId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const [openId, setOpenId] = useState<string | null>(null)
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole] = useState<DepartmentRole>('member')

  const listQ = useQuery({
    queryKey: [...DEPARTMENTS_KEY, { activeOnly, search }] as unknown[],
    queryFn: () =>
      fetchDepartments({
        activeOnly: activeOnly || undefined,
        search: search || undefined
      })
  })

  const memberQ = useQuery({
    queryKey: departmentMembersKey(openId ?? ''),
    queryFn: () => fetchDepartmentMembers(openId ?? ''),
    enabled: !!openId
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { departments: DepartmentRow[] }).departments }
    }
    return { code: departmentsErrorCode(listQ.error), rows: [] as DepartmentRow[] }
  })()

  const members: DepartmentMemberRow[] = isOk(memberQ.data)
    ? (memberQ.data as { members: DepartmentMemberRow[] }).members
    : []
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const resetForm = () => {
    setName(''); setSlugKey(''); setAreas(''); setHeadId('')
    setActionError(null)
  }

  const refreshDepartments = () => void qc.invalidateQueries({ queryKey: DEPARTMENTS_KEY })

  const createMut = useMutation({
    mutationFn: () =>
      createDepartment({
        name: name.trim(),
        slugKey: slugKey.trim(),
        areas: areas
          .split(',')
          .map(a => a.trim())
          .filter(Boolean),
        headId: headId.trim() || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetForm()
      refreshDepartments()
    },
    onError: err => setActionError(departmentsErrorCode(err) ?? k.departments.errors.create)
  })

  const addMut = useMutation({
    mutationFn: ({ did, body }: { did: string; body: { userId: string; role: DepartmentRole } }) =>
      addDepartmentMember(did, body),
    onSuccess: () => {
      setAddUserId('')
      setAddRole('member')
      if (openId) void qc.invalidateQueries({ queryKey: departmentMembersKey(openId) })
      refreshDepartments()
    },
    onError: err => setActionError(departmentsErrorCode(err) ?? k.departments.errors.addMember)
  })

  const removeMut = useMutation({
    mutationFn: ({ did, userId }: { did: string; userId: string }) => removeDepartmentMember(did, userId),
    onSuccess: () => {
      if (openId) void qc.invalidateQueries({ queryKey: departmentMembersKey(openId) })
      refreshDepartments()
    },
    onError: err => setActionError(departmentsErrorCode(err) ?? k.departments.errors.removeMember)
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
        <h1 className="text-sm font-semibold text-foreground">{k.departments.title}</h1>
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
            {k.departments.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        {(['all', 'active'] as const).map(f => (
          <button
            key={f}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              (f === 'active' ? activeOnly : !activeOnly)
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setActiveOnly(f === 'active')}
          >
            {f === 'all' ? k.departments.all : k.departments.activeOnly}
          </button>
        ))}
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.departments.search}
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
                className={`${inp} flex-1`}
                placeholder={k.departments.createForm.namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.departments.createForm.slugKeyPlaceholder}
                value={slugKey}
                onChange={e => setSlugKey(e.target.value)}
              />
            </div>
            <input
              className={inp}
              placeholder={k.departments.createForm.areasPlaceholder}
              value={areas}
              onChange={e => setAreas(e.target.value)}
            />
            <input
              className={inp}
              placeholder={k.departments.createForm.headIdPlaceholder}
              value={headId}
              onChange={e => setHeadId(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending || !name.trim() || !slugKey.trim()}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.departments.createForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetForm()
                }}
              >
                {k.departments.createForm.cancel}
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
            <Codicon className="text-(--ui-text-quaternary)" name="organization" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.departments.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map(dep => (
            <DepartmentCard
              key={dep.id}
              dep={dep}
              k={k}
              open={openId === dep.id}
              onToggle={() => toggleOpen(dep.id)}
              members={openId === dep.id ? members : []}
              memberLoading={openId === dep.id && memberQ.isLoading}
              addUserId={addUserId}
              setAddUserId={setAddUserId}
              addRole={addRole}
              setAddRole={setAddRole}
              addPending={addMut.isPending}
              removePending={removeMut.isPending}
              onAdd={() => addMut.mutate({ did: dep.id, body: { userId: addUserId, role: addRole } })}
              onRemove={userId => removeMut.mutate({ did: dep.id, userId })}
              onError={actionError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DepartmentCard({
  dep,
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
  dep: DepartmentRow
  k: ReturnType<typeof useCeodigital>
  open: boolean
  onToggle: () => void
  members: DepartmentMemberRow[]
  memberLoading: boolean
  addUserId: string
  setAddUserId: (v: string) => void
  addRole: DepartmentRole
  setAddRole: (v: DepartmentRole) => void
  addPending: boolean
  removePending: boolean
  onAdd: () => void
  onRemove: (userId: string) => void
  onError: string | null
}) {
  const areas = Array.isArray(dep.areas) ? dep.areas : []
  return (
    <div className="border-b border-(--ui-stroke-secondary)">
      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-(--ui-bg-quaternary)" onClick={onToggle}>
        <Codicon
          className="text-(--ui-text-tertiary)"
          name={open ? 'chevron-down' : 'chevron-right'}
          size="1rem"
        />
        <Codicon className="text-(--ui-text-tertiary)" name="organization" size="1.125rem" />
        <span className="flex-1">
          <span className="block text-[0.8125rem] font-medium text-foreground">{dep.title}</span>
          <span className="block text-[0.6875rem] text-(--ui-text-secondary)">
            {dep.slug_key ?? dep.slugKey ?? ''}
            {areas.length > 0 && ` · ${areas.join(', ')}`}
          </span>
        </span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{dep.id}</span>
      </button>

      {open && (
        <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary/40) px-4 py-2">
          <div className="flex flex-col gap-1.5">
            <div className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">
              {k.departments.members}
            </div>
            {memberLoading ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
            ) : members.length === 0 ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.departments.membersEmpty}</p>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[0.75rem] text-foreground">
                    {m.name || m.full_name || m.email || m.id}
                    <span className="ml-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{m.id}</span>
                  </span>
                  <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                    {m.role ? k.departments.memberRoles[m.role as DepartmentRole] ?? m.role : ''}
                  </span>
                  <button
                    className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
                    disabled={removePending}
                    onClick={() => onRemove(m.id)}
                  >
                    <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                    {k.departments.removeMember}
                  </button>
                </div>
              ))
            )}
            {onError && <p className="text-[0.75rem] text-red-500">{onError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <input
                className={`${inp} min-w-0 flex-1`}
                placeholder={k.departments.addMemberPlaceholder}
                value={addUserId}
                onChange={e => setAddUserId(e.target.value)}
              />
              <select
                className={inp}
                value={addRole}
                onChange={e => setAddRole(e.target.value as DepartmentRole)}
              >
                {DEPARTMENT_ROLES.map(r => (
                  <option key={r} value={r}>
                    {k.departments.memberRoles[r]}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={addPending || !addUserId.trim()}
                onClick={onAdd}
              >
                {addPending ? k.agents.runs.executing : k.departments.addMember}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
