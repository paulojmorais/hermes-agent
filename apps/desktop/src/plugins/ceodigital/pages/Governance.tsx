/**
 * CEODigital Governance page (W7) — a tabbed panel over the governance.* MCP
 * tools, proxied via `/api/plugins/ceodigital/governance/*`:
 *   * DSR requests  (list GET, create POST, route POST)
 *   * Consents      (list GET, record POST)
 *   * Processing    (list GET)
 *   * Retention     (list GET)
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  CONSENTS_KEY,
  createDsrRequest,
  DSR_KEY,
  fetchConsents,
  fetchDsrRequests,
  fetchProcessingRecords,
  fetchRetentionPolicies,
  PROCESSING_RECORDS_KEY,
  recordConsent,
  RETENTION_KEY,
  routeDsrRequest
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type {
  CeodigitalErrorCode,
  ConsentRow,
  DsrRequestRow,
  DsrRequestType,
  DsrStatus,
  ProcessingRecordRow,
  RetentionPolicyRow
} from '../types'
import { DSR_REQUEST_TYPES, DSR_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function govErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const dsrStatusLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.governance.dsr.statuses[status as DsrStatus] ?? status ?? '')
const dsrTypeLabel = (k: CEODIGITALText, t: null | string | undefined): string =>
  (k.governance.dsr.requestTypes[t as DsrRequestType] ?? t ?? '')

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

type Tab = 'dsr' | 'consents' | 'processing' | 'retention'

const TABLE_HEAD =
  'px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)'

export function GovernancePage() {
  const k = useCeodigital()
  const [tab, setTab] = useState<Tab>('dsr')

  return (
    <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-1 px-4 py-2">
        <h1 className="mr-2 text-sm font-semibold text-foreground">Governance</h1>
        {(['dsr', 'consents', 'processing', 'retention'] as const).map(t => (
          <button
            key={t}
            className={`rounded-md px-2.5 py-1 text-[0.75rem] transition-colors ${
              tab === t
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-secondary) hover:text-foreground'
            }`}
            onClick={() => setTab(t)}
          >
            {k.governance.tabs[t]}
          </button>
        ))}
      </header>

      <div className="min-h-0 flex-1">
        {tab === 'dsr' && <DsrPanel k={k} />}
        {tab === 'consents' && <ConsentsPanel k={k} />}
        {tab === 'processing' && <ProcessingPanel k={k} />}
        {tab === 'retention' && <RetentionPanel k={k} />}
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

// ── DSR requests ─────────────────────────────────────────────────────────────

function DsrPanel({ k }: { k: CEODIGITALText }) {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [userId, setUserId] = useState('')
  const [requestType, setRequestType] = useState<DsrRequestType>('export')
  const [processedBy, setProcessedBy] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...DSR_KEY, { statusFilter, typeFilter }] as unknown[],
    queryFn: () =>
      fetchDsrRequests({
        status: (statusFilter || undefined) as DsrStatus | undefined,
        requestType: (typeFilter || undefined) as DsrRequestType | undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { requests: DsrRequestRow[] }).requests }
    }
    return { code: govErrorCode(listQ.error), rows: [] as DsrRequestRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]
  const refresh = () => void qc.invalidateQueries({ queryKey: DSR_KEY })

  const createMut = useMutation({
    mutationFn: () => createDsrRequest({ userId: userId.trim(), requestType }),
    onSuccess: () => {
      setCreating(false)
      setUserId('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(govErrorCode(err) ?? k.governance.dsr.errors.create)
  })

  const routeMut = useMutation({
    mutationFn: (id: string) =>
      routeDsrRequest(id, processedBy.trim() ? { processedBy: processedBy.trim() } : {}),
    onSuccess: () => {
      setProcessedBy('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(govErrorCode(err) ?? k.governance.dsr.errors.route)
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <select className={inp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{k.governance.dsr.allStatuses}</option>
          {DSR_STATUSES.map(s => (
            <option key={s} value={s}>
              {k.governance.dsr.statuses[s] ?? s}
            </option>
          ))}
        </select>
        <select className={inp} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">{k.governance.dsr.allTypes}</option>
          {DSR_REQUEST_TYPES.map(t => (
            <option key={t} value={t}>
              {k.governance.dsr.requestTypes[t] ?? t}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={creating || createMut.isPending}
            onClick={() => setCreating(v => !v)}
          >
            {k.governance.dsr.newRequest}
          </button>
        </div>
      </div>

      {creating && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (userId.trim() && !createMut.isPending) createMut.mutate()
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inp} flex-1`}
              placeholder={k.governance.dsr.createForm.userIdPlaceholder}
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
            <select
              className={inp}
              value={requestType}
              onChange={e => setRequestType(e.target.value as DsrRequestType)}
            >
              {DSR_REQUEST_TYPES.map(t => (
                <option key={t} value={t}>
                  {k.governance.dsr.requestTypes[t] ?? t}
                </option>
              ))}
            </select>
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              type="submit"
              disabled={createMut.isPending || !userId.trim()}
            >
              {createMut.isPending ? k.agents.runs.executing : k.governance.dsr.createForm.create}
            </button>
            <button
              className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
              type="button"
              onClick={() => {
                setCreating(false)
                setUserId('')
              }}
            >
              {k.governance.dsr.createForm.cancel}
            </button>
          </div>
        </form>
      )}

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
        <EmptyHint icon="verified" text={k.governance.dsr.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'type', 'status', 'user', 'processedBy', 'created'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.governance.dsr.headers[h]}
                  </th>
                ))}
                <th className={TABLE_HEAD} />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="group border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {dsrTypeLabel(k, row.request_type)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {dsrStatusLabel(k, row.status)}
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.user_id ?? ''}
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.processed_by ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-tertiary)">
                    {row.created_at ?? ''}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                      disabled={routeMut.isPending}
                      onClick={() => routeMut.mutate(row.id)}
                    >
                      {routeMut.isPending ? k.governance.dsr.routing : k.governance.dsr.route}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="shrink-0 border-t border-(--ui-stroke-secondary) px-4 py-2">
        <label className="flex items-center gap-2">
          <span className="text-[0.625rem] text-(--ui-text-tertiary)">
            {k.governance.dsr.processedBy}
          </span>
          <input
            className={`${inp} w-56`}
            placeholder={k.governance.dsr.processedByPlaceholder}
            value={processedBy}
            onChange={e => setProcessedBy(e.target.value)}
          />
        </label>
      </div>
    </div>
  )
}

// ── Consents ─────────────────────────────────────────────────────────────────

function ConsentsPanel({ k }: { k: CEODIGITALText }) {
  const qc = useQueryClient()
  const [recording, setRecording] = useState(false)
  const [userId, setUserId] = useState('')
  const [termsVersion, setTermsVersion] = useState('')
  const [privacyVersion, setPrivacyVersion] = useState('')
  const [termsDocumentId, setTermsDocumentId] = useState('')
  const [privacyDocumentId, setPrivacyDocumentId] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [userAgent, setUserAgent] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: CONSENTS_KEY,
    queryFn: () => fetchConsents()
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { consents: ConsentRow[] }).consents }
    }
    return { code: govErrorCode(listQ.error), rows: [] as ConsentRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]
  const refresh = () => void qc.invalidateQueries({ queryKey: CONSENTS_KEY })

  const recordMut = useMutation({
    mutationFn: () =>
      recordConsent({
        userId: userId.trim(),
        termsVersion: termsVersion.trim() || undefined,
        privacyVersion: privacyVersion.trim() || undefined,
        termsDocumentId: termsDocumentId.trim() || undefined,
        privacyDocumentId: privacyDocumentId.trim() || undefined,
        ipAddress: ipAddress.trim() || undefined,
        userAgent: userAgent.trim() || undefined
      }),
    onSuccess: () => {
      setRecording(false)
      setUserId('')
      setTermsVersion('')
      setPrivacyVersion('')
      setTermsDocumentId('')
      setPrivacyDocumentId('')
      setIpAddress('')
      setUserAgent('')
      setActionError(null)
      refresh()
    },
    onError: err => setActionError(govErrorCode(err) ?? k.governance.consents.errors.record)
  })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">{k.governance.consents.title}</h2>
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={recording || recordMut.isPending}
            onClick={() => setRecording(v => !v)}
          >
            {k.governance.consents.record}
          </button>
        </div>
      </div>

      {recording && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (userId.trim() && !recordMut.isPending) recordMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.governance.consents.recordForm.userIdPlaceholder}
                value={userId}
                onChange={e => setUserId(e.target.value)}
              />
              <input
                className={`${inp} w-40`}
                maxLength={32}
                placeholder={k.governance.consents.recordForm.termsVersion}
                value={termsVersion}
                onChange={e => setTermsVersion(e.target.value)}
              />
              <input
                className={`${inp} w-40`}
                maxLength={32}
                placeholder={k.governance.consents.recordForm.privacyVersion}
                value={privacyVersion}
                onChange={e => setPrivacyVersion(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.governance.consents.recordForm.termsDocumentId}
                value={termsDocumentId}
                onChange={e => setTermsDocumentId(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.governance.consents.recordForm.privacyDocumentId}
                value={privacyDocumentId}
                onChange={e => setPrivacyDocumentId(e.target.value)}
              />
              <input
                className={`${inp} w-40`}
                maxLength={45}
                placeholder={k.governance.consents.recordForm.ipAddress}
                value={ipAddress}
                onChange={e => setIpAddress(e.target.value)}
              />
            </div>
            <input
              className={`${inp} w-full`}
              maxLength={500}
              placeholder={k.governance.consents.recordForm.userAgent}
              value={userAgent}
              onChange={e => setUserAgent(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                type="submit"
                disabled={recordMut.isPending || !userId.trim()}
              >
                {recordMut.isPending ? k.agents.runs.executing : k.governance.consents.recordForm.record}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setRecording(false)
                  setUserId('')
                  setTermsVersion('')
                  setPrivacyVersion('')
                  setTermsDocumentId('')
                  setPrivacyDocumentId('')
                  setIpAddress('')
                  setUserAgent('')
                  setActionError(null)
                }}
              >
                {k.governance.consents.recordForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {actionError && !recording && (
        <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>
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
        <EmptyHint icon="link" text={k.governance.consents.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'user', 'terms', 'privacy', 'ip', 'created'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.governance.consents.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.user_id ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.terms_version ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.privacy_version ?? ''}
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.ip_address ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-tertiary)">
                    {row.created_at ?? ''}
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

// ── Processing records ───────────────────────────────────────────────────────

function ProcessingPanel({ k }: { k: CEODIGITALText }) {
  const [activeOnly, setActiveOnly] = useState(false)

  const listQ = useQuery({
    queryKey: [...PROCESSING_RECORDS_KEY, { activeOnly }] as unknown[],
    queryFn: () => fetchProcessingRecords({ isActive: activeOnly || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return {
        code: null as CeodigitalErrorCode | null,
        rows: (listQ.data as { records: ProcessingRecordRow[] }).records
      }
    }
    return { code: govErrorCode(listQ.error), rows: [] as ProcessingRecordRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">{k.governance.processing.title}</h2>
        <label className="ml-auto flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={e => setActiveOnly(e.target.checked)}
          />
          <span>{k.governance.processing.activeOnly}</span>
        </label>
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
        <EmptyHint icon="pulse" text={k.governance.processing.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'entity', 'status', 'active', 'started'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.governance.processing.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.entity_type ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.status ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.is_active === true ? '✓' : row.is_active === false ? '—' : ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-tertiary)">
                    {row.started_at ?? ''}
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

// ── Retention policies ───────────────────────────────────────────────────────

function RetentionPanel({ k }: { k: CEODIGITALText }) {
  const qc = useQueryClient()
  const [activeOnly, setActiveOnly] = useState(false)

  const listQ = useQuery({
    queryKey: [...RETENTION_KEY, { activeOnly }] as unknown[],
    queryFn: () => fetchRetentionPolicies({ isActive: activeOnly || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return {
        code: null as CeodigitalErrorCode | null,
        rows: (listQ.data as { policies: RetentionPolicyRow[] }).policies
      }
    }
    return { code: govErrorCode(listQ.error), rows: [] as RetentionPolicyRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]
  const refresh = () => void qc.invalidateQueries({ queryKey: RETENTION_KEY })

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">{k.governance.retention.title}</h2>
        <label className="ml-auto flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={e => setActiveOnly(e.target.checked)}
          />
          <button className="cursor-pointer" onClick={() => void refresh()}>
            {k.governance.retention.activeOnly}
          </button>
        </label>
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
        <EmptyHint icon="archive" text={k.governance.retention.empty} />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'entity', 'days', 'active'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.governance.retention.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.entity ?? ''}
                  </td>
                  <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
                    {row.retention_days ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.is_active === true ? '✓' : row.is_active === false ? '—' : ''}
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