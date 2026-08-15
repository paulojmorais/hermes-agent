/**
 * CRM table page (W4) — a read-only table for CEODigital CRM leads/deals,
 * proxied via `/api/plugins/ceodigital/{resource}`. Reuses the typed failure
 * codes shared with the Projects page. No forms, no mutations (that's later).
 *
 * The page is generic over the resource ("leads" | "deals") so Leads and Deals
 * share one implementation instead of duplicated lists.
 */

import { Codicon, ErrorState, Loader, useQuery } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { DEALS_KEY, fetchDeals, fetchLeads, LEADS_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, CrmRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const
type Resource = 'leads' | 'deals'

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

/** Pull the typed failure code out of either failure shape (envelope or thrown). */
export function crmErrorCode(err: unknown): CeodigitalErrorCode | null {
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

/** Format a currency-ish value column defensively (may be a number or string). */
function fmtMoney(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number') {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(raw)
  }
  return String(raw)
}

/** Type guard: a CRM success envelope bearing ok:true. */
function isOkEnvelope(data: unknown): data is { ok: true } {
  return !!data && typeof data === 'object' && ('ok' in data) && (data as { ok?: unknown }).ok === true
}

export function CrmTablePage({ resource }: { resource: Resource }) {
  const k = useCeodigital()
  const isLeads = resource === 'leads'
  const copy = isLeads ? k.crm.leads : k.crm.deals

  // One React Query per resource; useQuery is called unconditionally so the
  // hook order is stable across renders.
  const queryKey = isLeads ? LEADS_KEY : DEALS_KEY
  const queryFn =
    isLeads
      ? (fetchLeads as () => Promise<unknown>)
      : (fetchDeals as () => Promise<unknown>)

  const { data, error, isLoading } = useQuery({ queryKey, queryFn })

  const { code, rows } = useMemo(() => {
    if (!isOkEnvelope(data)) {
      return { code: crmErrorCode(error), rows: [] as CrmRow[] }
    }
    const envelope = data as { leads?: CrmRow[]; deals?: CrmRow[] }
    const rows = isLeads ? (envelope.leads ?? []) : (envelope.deals ?? [])
    return { code: null as CeodigitalErrorCode | null, rows }
  }, [data, error, isLeads])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{copy.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      {isLoading ? (
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
            <Codicon className="text-(--ui-text-quaternary)" name="database" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{copy.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'status', 'value'] as const).map(header => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={header}>
                    {k.crm.headers[header]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr className="group border-b border-(--ui-stroke-secondary) last:border-0" key={row.id ?? row.title}>
                  <td className="px-3 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-3 py-2 text-[0.8125rem] text-foreground">{row.title}</td>
                  <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.status || k.crm.unassigned}</td>
                  <td className="px-3 py-2 text-[0.75rem] tabular-nums text-(--ui-text-secondary)">
                    {fmtMoney(row.value ?? row.amount)}
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