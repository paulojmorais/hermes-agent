/**
 * Generic CRM list page (W1) — a read-only table for the new CRM resources
 * (persons, organizations, pipelines, activities), proxied via
 * `/api/plugins/ceodigital/{resource}`. Same three render states and typed
 * failure-code handling as Projects/Crm; each resource page supplies its own
 * columns and envelope rows key so they stay thin declarations.
 */

import { Codicon, ErrorState, Loader, useQuery } from '@hermes/plugin-sdk'
import { type ReactNode, useMemo } from 'react'

import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

/** Pull the typed failure code out of either failure shape (envelope or thrown). */
export function crmListErrorCode(err: unknown): CeodigitalErrorCode | null {
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

/** Type guard: a CRM success envelope bearing ok:true. */
function isOkEnvelope(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object' && (data as { ok?: unknown }).ok === true
}

/** One table column. `header` is already translated by the owning page. */
export interface CrmColumn<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
}

export interface CrmListProps<T> {
  title: string
  empty: string
  /** React Query key (from api.ts, e.g. PERSONS_KEY). */
  queryKey: readonly unknown[]
  /** Envelope fetch (from api.ts, e.g. fetchPersons). */
  queryFn: () => Promise<unknown>
  /** Envelope field that carries the rows (e.g. 'persons'). */
  rowsKey: string
  getRowKey: (row: T) => string
  columns: CrmColumn<T>[]
}

export function CrmListPage<T>(props: CrmListProps<T>) {
  const k = useCeodigital()
  const { title, empty, queryKey, queryFn, rowsKey, getRowKey, columns } = props

  const { data, error, isLoading } = useQuery({ queryKey, queryFn })

  const { code, rows } = useMemo(() => {
    if (!isOkEnvelope(data)) {
      return { code: crmListErrorCode(error), rows: [] as T[] }
    }
    const list = data[rowsKey]
    return {
      code: null as CeodigitalErrorCode | null,
      rows: (Array.isArray(list) ? list : []) as T[]
    }
  }, [data, error, rowsKey])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
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
            <p className="text-xs text-(--ui-text-tertiary)">{empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {columns.map(column => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={column.key}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr className="group border-b border-(--ui-stroke-secondary) last:border-0" key={getRowKey(row)}>
                  {columns.map(column => (
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)" key={column.key}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
