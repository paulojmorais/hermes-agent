/**
 * CEODigital Projects page — W3 scaffold. A READ-ONLY list of the tenant's
 * work items, proxied via `/api/plugins/ceodigital/workitems`. No forms, no
 * mutations (that's W4): the whole surface is a React Query `useQuery` + the
 * three states (loading / empty / error) with the typed MCP failure codes
 * rendered as distinct copy.
 */

import { Codicon, ErrorState, Loader, fmtDateTime, useQuery } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { fetchWorkItems, WORKITEMS_KEY } from '../api'
import { statusLabel, useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, WorkItemRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

/** Pull the typed failure code out of either failure shape (an `ok:false`
 *  envelope, or a thrown REST error whose message carries the code). */
export function workItemErrorCode(err: unknown): CeodigitalErrorCode | null {
  if (err && typeof err === 'object' && 'error' in err) {
    const code = (err as { error?: unknown }).error
    return typeof code === 'string' ? asKnownCode(code) : null
  }

  const raw = err instanceof Error ? err.message : String(err)

  for (const code of KNOWN_CODES) {
    if (raw.includes(code)) {
      return code
    }
  }

  return null
}

/** Only the backend's typed codes map to i18n `errors.*`; anything else is a
 *  generic fetch failure — never silently rendered as a raw exception. */
function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

/** Backend timestamps — an ISO string, else epoch seconds, else the raw text. */
function formatUpdated(raw: null | string | undefined): string {
  if (!raw) {
    return ''
  }

  const parsed = Date.parse(raw)
  const ms = Number.isNaN(parsed) ? Number(raw) * 1000 : parsed

  return Number.isFinite(ms) ? fmtDateTime.format(new Date(ms)) : raw
}

export function ProjectsPage() {
  const k = useCeodigital()

  const { data, error, isLoading } = useQuery({ queryKey: WORKITEMS_KEY, queryFn: fetchWorkItems })

  // The envelope is either a page of rows or a typed failure. Normalize both
  // into rows + a code so the three render states stay flat.
  const { code, rows } = useMemo(() => {
    if (data?.ok) {
      return { code: null as CeodigitalErrorCode | null, rows: data.workitems }
    }

    const failure = data && !data.ok ? data : error

    return { code: workItemErrorCode(failure), rows: [] as WorkItemRow[] }
  }, [data, error])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.page.title}</h1>
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
            <Codicon className="text-(--ui-text-quaternary)" name="folder" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.page.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'status', 'assignee', 'updated'] as const).map(header => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={header}
                  >
                    {k.workitem.headers[header]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr className="group border-b border-(--ui-stroke-secondary) last:border-0" key={row.id}>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-[0.8125rem] text-foreground">{row.title}</div>
                    {row.summary && (
                      <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                        {row.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{statusLabel(k, row.status)}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.assignee ?? k.workitem.unassigned}
                  </td>
                  <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {formatUpdated(row.updated_at)}
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