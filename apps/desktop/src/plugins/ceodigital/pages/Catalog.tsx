/**
 * CEODigital Services Catalog page (W3, read-only) — the tenant's services
 * catalog, proxied via `/api/plugins/ceodigital/services/catalog` (MCP
 * `services.catalog.list`). Filters (search, produces, active-only) narrow the
 * server-side list; selecting a row shows its offerings (MCP
 * `services.offerings.list`, filtered by `serviceCatalogId`).
 *
 * Same three render states and typed failure handling as the rest of the
 * plugin; no mutations here (the proposals wave owns the editing).
 */

import { Codicon, ErrorState, Loader, useQuery } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import { CATALOG_KEY, fetchCatalog, fetchOfferings, OFFERINGS_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { CatalogRow, CeodigitalErrorCode, OfferingRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

/** Pull the typed failure code out of either failure shape (envelope or thrown). */
export function servicesErrorCode(err: unknown): CeodigitalErrorCode | null {
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

/** Type guard: a services success envelope bearing ok:true. */
function isOkEnvelope(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object' && (data as { ok?: unknown }).ok === true
}

/** Render a pricing/code cell defensively (title-vs-name normalization up-river). */
function cell(raw: unknown): string {
  return raw == null ? '' : String(raw)
}

export function CatalogPage() {
  const k = useCeodigital()
  const [search, setSearch] = useState('')
  const [produces, setProduces] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // React Query keys are scoped to the active filters so each combo caches.
  const queryKey = [...CATALOG_KEY, search, produces, activeOnly] as unknown[]
  const catalogQ = useQuery({
    queryKey,
    queryFn: () => fetchCatalog({ search: search || undefined, produces: produces || undefined, active: activeOnly || undefined })
  })

  const { code, rows } = useMemo(() => {
    if (isOkEnvelope(catalogQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (catalogQ.data as { catalog: CatalogRow[] }).catalog }
    }
    return { code: servicesErrorCode(catalogQ.error), rows: [] as CatalogRow[] }
  }, [catalogQ.data, catalogQ.error])

  // Distinct `produces` values across the current result set feed the select.
  const producesOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const row of rows) {
      if (row.produces) seen.add(row.produces)
    }
    return [...seen].sort()
  }, [rows])

  const selected = selectedId ? rows.find(r => r.id === selectedId) ?? null : null

  const offeringsQ = useQuery({
    queryKey: [...OFFERINGS_KEY, selectedId] as unknown[],
    queryFn: () => fetchOfferings({ serviceCatalogId: selectedId ?? undefined }),
    enabled: !!selectedId
  })

  const { code: offeringCode, offerings } = useMemo(() => {
    if (isOkEnvelope(offeringsQ.data)) {
      return { code: null as CeodigitalErrorCode | null, offerings: (offeringsQ.data as { offerings: OfferingRow[] }).offerings }
    }
    return { code: servicesErrorCode(offeringsQ.error), offerings: [] as OfferingRow[] }
  }, [offeringsQ.data, offeringsQ.error])

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.services.catalog.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground placeholder:text-(--ui-text-tertiary)"
          placeholder={k.services.catalog.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="shrink-0 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
          value={produces}
          onChange={e => setProduces(e.target.value)}
        >
          <option value="">{k.services.catalog.allProduces}</option>
          {producesOptions.map(p => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <label className="flex shrink-0 items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={e => setActiveOnly(e.target.checked)}
          />
          {k.services.catalog.activeOnly}
        </label>
      </div>

      {catalogQ.isLoading ? (
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
            <Codicon className="text-(--ui-text-quaternary)" name="package" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.services.catalog.empty}</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-(--ui-stroke-secondary)">
                  {(['name', 'code', 'pricing'] as const).map(header => (
                    <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={header}>
                      {k.services.catalog.headers[header]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr
                    className={`group cursor-pointer border-b border-(--ui-stroke-secondary) last:border-0 ${
                      row.id === selectedId ? 'bg-(--ui-bg-quaternary)' : 'hover:bg-(--ui-bg-quaternary)'
                    }`}
                    key={row.id}
                    onClick={() => setSelectedId(prev => (prev === row.id ? null : row.id))}
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 text-[0.8125rem] text-foreground">
                        <Codicon className="text-(--ui-text-tertiary)" name="package" size="0.875rem" />
                        {row.title || row.name || row.id}
                      </div>
                      {row.produces && (
                        <div className="mt-0.5 text-[0.6875rem] text-(--ui-text-tertiary)">{String(row.produces)}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">{cell(row.code)}</td>
                    <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{cell(row.pricing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="shrink-0 border-t border-(--ui-stroke-secondary)">
              <div className="flex items-center gap-2 px-4 py-2">
                <Codicon className="text-(--ui-text-tertiary)" name="layers" size="0.875rem" />
                <span className="text-[0.75rem] font-medium text-foreground">
                  {k.services.catalog.offerings}
                  {selected.title ? ` — ${selected.title}` : ''}
                </span>
                <button
                  className="ml-auto rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
                  onClick={() => setSelectedId(null)}
                >
                  <Codicon className="text-(--ui-text-tertiary)" name="close" size="0.75rem" />
                </button>
              </div>
              {offeringsQ.isLoading ? (
                <div className="grid place-items-center px-4 py-6">
                  <Loader type="lemniscate-bloom" />
                </div>
              ) : offeringCode ? (
                <p className="px-4 pb-3 text-[0.75rem] text-red-500">{k.errors[offeringCode]}</p>
              ) : offerings.length === 0 ? (
                <p className="px-4 pb-3 text-[0.75rem] text-(--ui-text-tertiary)">{k.services.catalog.offeringsEmpty}</p>
              ) : (
                <div className="max-h-56 overflow-y-auto pb-3">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-(--ui-stroke-secondary)">
                        {(['name', 'code', 'pricing'] as const).map(header => (
                          <th className="px-4 py-1 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={header}>
                            {k.services.catalog.headers[header]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {offerings.map(o => (
                        <tr className="border-b border-(--ui-stroke-secondary) last:border-0" key={o.id}>
                          <td className="px-4 py-1.5 text-[0.75rem] text-foreground">{o.title || o.name || o.id}</td>
                          <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">{cell(o.pricing_model ?? o.pricingModel)}</td>
                          <td className="px-4 py-1.5 text-[0.6875rem] text-(--ui-text-tertiary)">{cell(o.code)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}