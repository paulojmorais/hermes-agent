/**
 * CEODigital LLM Studio page (W8-UI-a) — a tabbed panel over the llm_studio.*
 * MCP tools, proxied via `/api/plugins/ceodigital/llmstudio/*`:
 *   * datasets     (GET  /llmstudio/datasets?status&sourceType)
 *   * jobs         (GET  /llmstudio/jobs?status&datasetId)
 *   * adapters     (GET  /llmstudio/adapters?status&scope)
 *   * preferences  (GET  /llmstudio/preferences, POST /llmstudio/preferences)
 *   * toggle       (POST /llmstudio/adapters/{id}/toggle {active})
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useEffect, useState } from 'react'

import {
  fetchDatasets,
  fetchLlmAdapters,
  fetchLlmJobs,
  fetchLlmPreferences,
  LLM_ADAPTERS_KEY,
  LLM_JOBS_KEY,
  LLM_PREFERENCES_KEY,
  DATASETS_KEY,
  toggleLlmAdapter,
  updateLlmPreferences
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type {
  CeodigitalErrorCode,
  DatasetRow,
  InferenceBackend,
  LlmAdapterRow,
  LlmJobRow,
  LlmPreferencesRow
} from '../types'
import { INFERENCE_BACKENDS } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function llmErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const TABLE_HEAD =
  'px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)'

type Tab = 'datasets' | 'jobs' | 'adapters' | 'preferences'

export function LlmStudioPage() {
  const k = useCeodigital()
  const [tab, setTab] = useState<Tab>('datasets')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-1 px-4 py-2">
        <h1 className="mr-2 text-sm font-semibold text-foreground">{k.llmStudio.title}</h1>
        {(['datasets', 'jobs', 'adapters', 'preferences'] as const).map(t => (
          <button
            key={t}
            className={`rounded-md px-2.5 py-1 text-[0.75rem] transition-colors ${
              tab === t
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-secondary) hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {k.llmStudio.tabs[t]}
          </button>
        ))}
      </header>

      <div className="min-h-0 flex-1">
        {tab === 'datasets' && <DatasetsPanel k={k} />}
        {tab === 'jobs' && <JobsPanel k={k} />}
        {tab === 'adapters' && <AdaptersPanel k={k} />}
        {tab === 'preferences' && <PreferencesPanel k={k} />}
      </div>
    </div>
  )
}

function EmptyHint({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="grid flex-1 place-items-center px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <Codicon className="text-(--ui-text-quaternary)" name={icon} size="1.25rem" />
        <p className="text-xs text-(--ui-text-tertiary)">{text}</p>
      </div>
    </div>
  )
}

function DatasetsPanel({ k }: { k: CEODIGITALText }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceTypeFilter, setSourceTypeFilter] = useState('')

  const listQ = useQuery({
    queryKey: [...DATASETS_KEY, { statusFilter, sourceTypeFilter }] as unknown[],
    queryFn: () =>
      fetchDatasets({
        status: statusFilter.trim() || undefined,
        sourceType: sourceTypeFilter.trim() || undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { datasets: DatasetRow[] }).datasets }
    }
    return { code: llmErrorCode(listQ.error), rows: [] as DatasetRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-44`}
          placeholder={k.llmStudio.datasets.statusPlaceholder}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
        <input
          className={`${inp} w-48`}
          placeholder={k.llmStudio.datasets.sourceTypePlaceholder}
          value={sourceTypeFilter}
          onChange={e => setSourceTypeFilter(e.target.value)}
        />
      </div>

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint icon="database" text={k.llmStudio.datasets.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'name', 'status', 'source', 'created'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.llmStudio.datasets.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.name ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.status ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.source_type ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-tertiary)">{row.created_at ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function JobsPanel({ k }: { k: CEODIGITALText }) {
  const [statusFilter, setStatusFilter] = useState('')

  const listQ = useQuery({
    queryKey: [...LLM_JOBS_KEY, { statusFilter }] as unknown[],
    queryFn: () => fetchLlmJobs({ status: statusFilter.trim() || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { jobs: LlmJobRow[] }).jobs }
    }
    return { code: llmErrorCode(listQ.error), rows: [] as LlmJobRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-44`}
          placeholder={k.llmStudio.jobs.statusPlaceholder}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
      </div>

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint icon="play" text={k.llmStudio.jobs.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'name', 'status', 'dataset', 'created'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.llmStudio.jobs.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.name ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.status ?? ''}</td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.dataset_id ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-tertiary)">{row.created_at ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AdaptersPanel({ k }: { k: CEODIGITALText }) {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...LLM_ADAPTERS_KEY, { statusFilter, scopeFilter }] as unknown[],
    queryFn: () =>
      fetchLlmAdapters({ status: statusFilter.trim() || undefined, scope: scopeFilter.trim() || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { adapters: LlmAdapterRow[] }).adapters }
    }
    return { code: llmErrorCode(listQ.error), rows: [] as LlmAdapterRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => toggleLlmAdapter(id, { active }),
    onSuccess: () => {
      setActionError(null)
      void qc.invalidateQueries({ queryKey: LLM_ADAPTERS_KEY })
    },
    onError: err => setActionError(llmErrorCode(err) ?? k.llmStudio.adapters.errors.toggle)
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-44`}
          placeholder={k.llmStudio.adapters.statusPlaceholder}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        />
        <input
          className={`${inp} w-44`}
          placeholder={k.llmStudio.adapters.scopePlaceholder}
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value)}
        />
      </div>

      {actionError && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : rows.length === 0 ? (
        <EmptyHint icon="plug" text={k.llmStudio.adapters.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'name', 'status', 'scope', 'active'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.llmStudio.adapters.headers[h]}
                  </th>
                ))}
                <th className={TABLE_HEAD} />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.name ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.status ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.scope ?? ''}</td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.active === true ? '✓' : row.active === false ? '—' : ''}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                      disabled={toggleMut.isPending}
                      onClick={() => toggleMut.mutate({ id: row.id, active: row.active !== true })}
                    >
                      {toggleMut.isPending
                        ? k.llmStudio.adapters.toggling
                        : `${k.llmStudio.adapters.toggle} ${row.active === true ? '—' : '✓'}`}
                    </button>
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

function PreferencesPanel({ k }: { k: CEODIGITALText }) {
  const qc = useQueryClient()

  const [activeAdapterId, setActiveAdapterId] = useState('')
  const [inferenceBackend, setInferenceBackend] = useState<InferenceBackend | ''>('')
  const [fallbackToGeneric, setFallbackToGeneric] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const prefsQ = useQuery({
    queryKey: LLM_PREFERENCES_KEY,
    queryFn: () => fetchLlmPreferences()
  })

  const prefs = isOk(prefsQ.data)
    ? (prefsQ.data as { preferences: LlmPreferencesRow }).preferences
    : null

  useEffect(() => {
    if (prefs && !loaded) {
      setActiveAdapterId(prefs.active_adapter_id ?? '')
      setInferenceBackend((prefs.inference_backend as InferenceBackend) ?? '')
      setFallbackToGeneric(prefs.fallback_to_generic === true)
      setLoaded(true)
    }
  }, [prefs, loaded])

  const saveMut = useMutation({
    mutationFn: () =>
      updateLlmPreferences({
        activeAdapterId: activeAdapterId.trim() || null,
        inferenceBackend: (inferenceBackend || undefined) as InferenceBackend | undefined,
        fallbackToGeneric
      }),
    onSuccess: () => {
      setActionError(null)
      void qc.invalidateQueries({ queryKey: LLM_PREFERENCES_KEY })
    },
    onError: err => setActionError(llmErrorCode(err) ?? k.llmStudio.preferences.errors.save)
  })

  const { code } = (() => {
    if (isOk(prefsQ.data)) {
      return { code: null as CeodigitalErrorCode | null }
    }
    return { code: llmErrorCode(prefsQ.error) }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {prefsQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <div className="flex max-w-xl flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[0.625rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                {k.llmStudio.preferences.activeAdapterId}
              </span>
              <input
                className={inp}
                placeholder={k.llmStudio.preferences.activeAdapterIdPlaceholder}
                value={activeAdapterId}
                onChange={e => setActiveAdapterId(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[0.625rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                {k.llmStudio.preferences.inferenceBackend}
              </span>
              <select
                className={inp}
                value={inferenceBackend}
                onChange={e => setInferenceBackend(e.target.value as InferenceBackend | '')}
              >
                <option value="">—</option>
                {INFERENCE_BACKENDS.map(b => (
                  <option key={b} value={b}>
                    {k.llmStudio.preferences.backends[b] ?? b}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
              <input
                type="checkbox"
                checked={fallbackToGeneric}
                onChange={e => setFallbackToGeneric(e.target.checked)}
              />
              <span>{k.llmStudio.preferences.fallbackToGeneric}</span>
            </label>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <button
              className="w-fit rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {saveMut.isPending ? k.llmStudio.preferences.saving : k.llmStudio.preferences.save}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}