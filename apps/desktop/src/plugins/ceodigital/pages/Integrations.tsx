/**
 * CEODigital Integrations page (W6b) — the tenant's connected integrations with
 * connect/test/disconnect, proxied via `/api/plugins/ceodigital/integrations`
 * (MCP `integrations.*`):
 *   * list       (GET  /integrations?providerCode&status&scope&limit)
 *   * connect    (POST /integrations {providerCode, appSlug, scope?, mailboxKey?, mailboxLabel?, metadata?})
 *   * test       (POST /integrations/{id}/test)
 *   * disconnect (POST /integrations/{id}/disconnect)
 *
 * Mutations invalidate the integrations list so an authoritative refetch wins.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  connectIntegration,
  disconnectIntegration,
  fetchIntegrations,
  INTEGRATIONS_KEY,
  testIntegration
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, IntegrationRow, IntegrationScope, IntegrationStatus } from '../types'
import { INTEGRATION_SCOPES, INTEGRATION_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function integrationsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function IntegrationsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [providerFilter, setProviderFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')

  const [connecting, setConnecting] = useState(false)
  const [providerCode, setProviderCode] = useState('')
  const [appSlug, setAppSlug] = useState('')
  const [scope, setScope] = useState<IntegrationScope>('user')
  const [mailboxKey, setMailboxKey] = useState('')
  const [mailboxLabel, setMailboxLabel] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...INTEGRATIONS_KEY, { providerFilter, statusFilter, scopeFilter }] as unknown[],
    queryFn: () =>
      fetchIntegrations({
        providerCode: providerFilter || undefined,
        status: (statusFilter || undefined) as IntegrationStatus | undefined,
        scope: (scopeFilter || undefined) as IntegrationScope | undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { integrations: IntegrationRow[] }).integrations }
    }
    return { code: integrationsErrorCode(listQ.error), rows: [] as IntegrationRow[] }
  })()

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const refresh = () => void qc.invalidateQueries({ queryKey: INTEGRATIONS_KEY })

  const connectMut = useMutation({
    mutationFn: () =>
      connectIntegration({
        providerCode: providerCode.trim(),
        appSlug: appSlug.trim(),
        scope,
        mailboxKey: mailboxKey.trim() || undefined,
        mailboxLabel: mailboxLabel.trim() || undefined
      }),
    onSuccess: () => {
      setConnecting(false)
      setProviderCode('')
      setAppSlug('')
      setScope('user')
      setMailboxKey('')
      setMailboxLabel('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(integrationsErrorCode(err) ?? k.integrations.errors.connect)
  })

  const testMut = useMutation({
    mutationFn: (id: string) => testIntegration(id),
    onError: err => setActionError(integrationsErrorCode(err) ?? k.integrations.errors.test),
    onSettled: refresh
  })

  const disconnectMut = useMutation({
    mutationFn: (id: string) => disconnectIntegration(id),
    onError: err => setActionError(integrationsErrorCode(err) ?? k.integrations.errors.disconnect),
    onSettled: refresh
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.integrations.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={connecting || connectMut.isPending}
            onClick={() => setConnecting(v => !v)}
          >
            {k.integrations.connect}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-44`}
          placeholder={k.integrations.providerCode}
          value={providerFilter}
          onChange={e => setProviderFilter(e.target.value)}
        />
        <select
          className={inp}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">{k.integrations.allStatuses}</option>
          {INTEGRATION_STATUSES.map(s => (
            <option key={s} value={s}>
              {k.integrations.statuses[s]}
            </option>
          ))}
        </select>
        <select
          className={inp}
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value)}
        >
          <option value="">{k.integrations.allScopes}</option>
          {INTEGRATION_SCOPES.map(s => (
            <option key={s} value={s}>
              {k.integrations.scopes[s]}
            </option>
          ))}
        </select>
      </div>

      {connecting && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!connectMut.isPending) connectMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.integrations.connectForm.providerCodePlaceholder}
                value={providerCode}
                onChange={e => setProviderCode(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.integrations.connectForm.appSlugPlaceholder}
                value={appSlug}
                onChange={e => setAppSlug(e.target.value)}
              />
              <select
                className={inp}
                value={scope}
                onChange={e => setScope(e.target.value as IntegrationScope)}
              >
                {INTEGRATION_SCOPES.map(s => (
                  <option key={s} value={s}>
                    {k.integrations.scopes[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.integrations.connectForm.mailboxKeyPlaceholder}
                value={mailboxKey}
                onChange={e => setMailboxKey(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.integrations.connectForm.mailboxLabelPlaceholder}
                value={mailboxLabel}
                onChange={e => setMailboxLabel(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={connectMut.isPending || !providerCode.trim() || !appSlug.trim()}
                type="submit"
              >
                {connectMut.isPending ? k.agents.runs.executing : k.integrations.connectForm.connect}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setConnecting(false)
                  setProviderCode('')
                  setAppSlug('')
                  setScope('user')
                  setMailboxKey('')
                  setMailboxLabel('')
                  setActionError(null)
                }}
              >
                {k.integrations.connectForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !connecting && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

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
            <Codicon className="text-(--ui-text-quaternary)" name="plug" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.integrations.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'provider', 'app', 'status', 'scope', 'mailbox'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.integrations.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const status = row.status ? (row.status as IntegrationStatus) : null
                return (
                  <tr key={row.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                    <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                      {row.id}
                    </td>
                    <td className="px-4 py-2 text-[0.8125rem] text-foreground">
                      {row.provider_code ?? row.providerCode ?? ''}
                    </td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                      {row.app_slug ?? row.appSlug ?? ''}
                    </td>
                    <td className="px-4 py-2">
                      {status && (
                        <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                          {k.integrations.statuses[status] ?? status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                      {row.scope ? k.integrations.scopes[row.scope as IntegrationScope] ?? row.scope : ''}
                    </td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                      {row.mailbox_key ?? row.mailboxKey ?? ''}
                      {row.mailbox_label ? ` — ${row.mailbox_label}` : ''}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                          disabled={testMut.isPending}
                          onClick={() => testMut.mutate(row.id)}
                        >
                          {testMut.isPending ? k.agents.runs.executing : k.integrations.test}
                        </button>
                        <button
                          className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
                          disabled={disconnectMut.isPending}
                          onClick={() => disconnectMut.mutate(row.id)}
                        >
                          <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                          {disconnectMut.isPending ? k.agents.runs.executing : k.integrations.disconnect}
                        </button>
                      </div>
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
