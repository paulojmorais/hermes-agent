/**
 * CEODigital Members page (W6b) — the tenant's members with invite + revoke +
 * role management, proxied via `/api/plugins/ceodigital/members` (MCP
 * `members.*`):
 *   * list       (GET  /members?role&limit)
 *   * invite     (POST /members/invite {email, role?})
 *   * revoke     (POST /members/{userId}/revoke)
 *   * updateRole (POST /members/{userId}/role {role})
 *
 * Mutations invalidate the members list so an authoritative refetch wins.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import { fetchMembers, inviteMember, revokeMember, updateMemberRole, MEMBERS_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, MemberRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function membersErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function MembersPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [roleFilter, setRoleFilter] = useState('')
  const [inviting, setInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [actionError, setActionError] = useState<string | null>(null)
  // Track which member is currently editing its role.
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({})

  const listQ = useQuery({
    queryKey: [...MEMBERS_KEY, roleFilter] as unknown[],
    queryFn: () => fetchMembers({ role: roleFilter || undefined })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { members: MemberRow[] }).members }
    }
    return { code: membersErrorCode(listQ.error), rows: [] as MemberRow[] }
  }, [listQ.data, listQ.error])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const refresh = () => void qc.invalidateQueries({ queryKey: MEMBERS_KEY })

  const inviteMut = useMutation({
    mutationFn: () =>
      inviteMember({
        email: email.trim(),
        role: inviteRole || undefined
      }),
    onSuccess: () => {
      setInviting(false)
      setEmail('')
      setInviteRole('member')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(membersErrorCode(err) ?? k.members.errors.invite)
  })

  const revokeMut = useMutation({
    mutationFn: (userId: string) => revokeMember(userId),
    onError: err => setActionError(membersErrorCode(err) ?? k.members.errors.revoke),
    onSettled: refresh
  })

  const roleMut = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateMemberRole(userId, role),
    onError: err => setActionError(membersErrorCode(err) ?? k.members.errors.updateRole),
    onSettled: refresh
  })

  const applyRole = (row: MemberRow) => {
    const next = roleDraft[row.id]
    if (!next || next === row.role) return
    roleMut.mutate({ userId: row.id, role: next })
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.members.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={inviting || inviteMut.isPending}
            onClick={() => setInviting(v => !v)}
          >
            {k.members.invite}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <select
          className={inp}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">{k.members.allRoles}</option>
          {['owner', 'admin', 'member'].map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {inviting && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!inviteMut.isPending) inviteMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <input
              className={inp}
              placeholder={k.members.inviteForm.emailPlaceholder}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <select
              className={inp}
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              {['owner', 'admin', 'member'].map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={inviteMut.isPending || !email.trim()}
                type="submit"
              >
                {inviteMut.isPending ? k.agents.runs.executing : k.members.inviteForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setInviting(false)
                  setEmail('')
                  setInviteRole('member')
                  setActionError(null)
                }}
              >
                {k.members.inviteForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !inviting && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

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
            <Codicon className="text-(--ui-text-quaternary)" name="account" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.members.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'name', 'email', 'role'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.members.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.title}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.email ?? ''}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <select
                        className={inp}
                        value={roleDraft[row.id] ?? row.role ?? ''}
                        onChange={e =>
                          setRoleDraft(prev => ({ ...prev, [row.id]: e.target.value }))
                        }
                      >
                        {row.role && <option value={row.role}>{row.role}</option>}
                        {['owner', 'admin', 'member']
                          .filter(r => r !== row.role)
                          .map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                      </select>
                      <button
                        className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                        disabled={roleMut.isPending || !roleDraft[row.id] || roleDraft[row.id] === row.role}
                        onClick={() => applyRole(row)}
                      >
                        {roleMut.isPending ? k.agents.runs.executing : k.members.updateRole}
                      </button>
                      <button
                        className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
                        disabled={revokeMut.isPending}
                        onClick={() => revokeMut.mutate(row.id)}
                      >
                        <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                        {revokeMut.isPending ? k.agents.runs.executing : k.members.revoke}
                      </button>
                    </div>
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
