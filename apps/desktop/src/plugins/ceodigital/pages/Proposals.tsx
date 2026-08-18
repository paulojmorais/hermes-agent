/**
 * CEODigital Proposals page (W3) — create, view and run the lifecycle of the
 * tenant's proposals, all proxied via `/api/plugins/ceodigital/services/
 * proposals` (MCP `services.proposals.*`):
 *   * create    (POST /proposals)
 *   * send      (POST /proposals/{id}/send)
 *   * accept    (POST /proposals/{id}/accept)
 *   * reject    (POST /proposals/{id}/reject  {reason?})
 *   * cancel    (POST /proposals/{id}/cancel)
 *   * duplicate (POST /proposals/{id}/duplicate)
 *   * expire    (POST /proposals/{id}/expire)
 *   * items     (POST .../items, .../items/{id}, .../items/{id}/remove)
 *   * tranches  (POST .../tranches, .../tranches/{id}, .../tranches/{id}/remove)
 *
 * The list carries a status filter; selecting a row opens the detail (same
 * window, back button restores the list). Lifecycle and line-item mutations
 * show pending state, optimistically paint the proposal cache, and roll back
 * on error; an authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  acceptProposal,
  addProposalItem,
  addTranche,
  cancelProposal,
  createProposal,
  duplicateProposal,
  expireProposal,
  fetchProposals,
  fetchProposal,
  proposalKey,
  PROPOSALS_KEY,
  rejectProposal,
  removeProposalItem,
  removeTranche,
  sendProposal,
  updateProposalItem,
  updateTranche
} from '../api'
import { proposalStatusLabel, useCeodigital, type CEODIGITALText } from '../i18n'
import type {
  CeodigitalErrorCode,
  ProposalItem,
  ProposalItemValues,
  ProposalRow,
  ProposalTranche,
  ProposalTrancheValues
} from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

/** Pull the typed failure code out of either failure shape (envelope or thrown). */
function proposalErrorCode(err: unknown): CeodigitalErrorCode | null {
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
function isOk(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object' && (data as { ok?: unknown }).ok === true
}

/** Backend timestamps — an ISO string, else epoch seconds, else the raw text. */
function fmtTime(raw: null | string | undefined): string {
  if (!raw) return ''
  const parsed = Date.parse(raw)
  const ms = Number.isNaN(parsed) ? Number(raw) * 1000 : parsed
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : raw
}

/** Format a money value with the proposal's currency (EUR default). */
function fmtMoney(value: unknown, currency?: unknown): string {
  if (value == null) return ''
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return String(value)
  const cur = typeof currency === 'string' && currency ? currency : 'EUR'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(num)
}

function cell(raw: unknown): string {
  return raw == null || raw === '' ? '' : String(raw)
}

/** Map MCP item values onto the optimistic preview shape (snake_case). */
function itemPreview(v: ProposalItemValues): Partial<ProposalItem> {
  return {
    description: v.description,
    service_catalog_id: v.serviceCatalogId,
    quantity: v.quantity,
    unit_price: v.unitPrice,
    discount: v.discount,
    vat_rate: v.vatRate,
    recurrence: v.recurrence,
    sort_order: v.sortOrder
  }
}

/** Map MCP tranche values onto the optimistic preview shape. */
function tranchePreview(v: ProposalTrancheValues): Partial<ProposalTranche> {
  return {
    label: v.label,
    amount: v.amount,
    due_date: v.dueDate,
    sort_order: v.sortOrder
  }
}

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

// ── List + create ──────────────────────────────────────────────────────────

export function ProposalsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Create form fields.
  const [title, setTitle] = useState('')
  const [leadId, setLeadId] = useState('')
  const [description, setDescription] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [paymentModel, setPaymentModel] = useState('')
  const [depositPercentage, setDepositPercentage] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [currency, setCurrency] = useState('')
  const [terms, setTerms] = useState('')

  const listQ = useQuery({
    queryKey: [...PROPOSALS_KEY, status] as unknown[],
    queryFn: () => fetchProposals(status === 'all' ? undefined : { status })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { proposals: ProposalRow[] }).proposals }
    }
    return { code: proposalErrorCode(listQ.error), rows: [] as ProposalRow[] }
  }, [listQ.data, listQ.error])

  // Distinct statuses across the unfiltered set feed the filter tabs.
  const statuses = useMemo(() => {
    const seen = new Set<string>()
    for (const row of rows) {
      if (row.status) seen.add(row.status)
    }
    return [...seen].sort()
  }, [rows])

  const errorCopy = code === null ? k.services.proposals.errors.fetchProposal : k.errors[code]

  function resetCreateForm() {
    setTitle(''); setLeadId(''); setDescription(''); setTotalValue('')
    setPaymentModel(''); setDepositPercentage(''); setValidUntil(''); setCurrency(''); setTerms('')
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createProposal({
        title: title.trim(),
        leadId: leadId.trim() || undefined,
        description: description.trim() || undefined,
        totalValue: totalValue.trim() ? Number(totalValue) : undefined,
        paymentModel: paymentModel.trim() || undefined,
        depositPercentage: depositPercentage.trim() ? Number(depositPercentage) : undefined,
        validUntil: validUntil.trim() || undefined,
        currency: currency.trim() || undefined,
        terms: terms.trim() || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetCreateForm()
      void qc.invalidateQueries({ queryKey: PROPOSALS_KEY })
    },
    onError: err => setActionError(proposalErrorCode(err) ?? k.services.proposals.errors.create)
  })

  if (selectedId) return <ProposalDetail k={k} id={selectedId} onBack={() => setSelectedId(null)} />

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.services.proposals.title}</h1>
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
            {k.services.proposals.new}
          </button>
        </div>
      </header>

      {statuses.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-1.5">
          {['all', ...statuses].map(s => (
            <button
              key={s}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                status === s ? 'bg-(--ui-bg-quaternary) text-foreground' : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setStatus(s)}
            >
              {s === 'all' ? k.workitems.filters.all : proposalStatusLabel(k, s)}
            </button>
          ))}
        </div>
      )}

      {creating && (
        <form
          className="max-h-72 shrink-0 overflow-y-auto border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (title.trim() && !createMut.isPending) createMut.mutate()
          }}
        >
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input className={inp} placeholder={k.services.proposals.form.title} value={title} onChange={e => setTitle(e.target.value)} />
            <input className={inp} placeholder={k.services.proposals.form.leadId} value={leadId} onChange={e => setLeadId(e.target.value)} />
            <textarea
              className={`${inp} sm:col-span-2`}
              placeholder={k.services.proposals.form.description}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <input className={inp} type="number" placeholder={k.services.proposals.form.totalValue} value={totalValue} onChange={e => setTotalValue(e.target.value)} />
            <input className={inp} placeholder={k.services.proposals.form.paymentModel} value={paymentModel} onChange={e => setPaymentModel(e.target.value)} />
            <input className={inp} type="number" placeholder={k.services.proposals.form.depositPercentage} value={depositPercentage} onChange={e => setDepositPercentage(e.target.value)} />
            <input className={inp} placeholder={k.services.proposals.form.validUntil} value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            <input className={inp} placeholder={k.services.proposals.form.currency} value={currency} onChange={e => setCurrency(e.target.value)} />
            <textarea
              className={`${inp} sm:col-span-2`}
              placeholder={k.services.proposals.form.terms}
              rows={2}
              value={terms}
              onChange={e => setTerms(e.target.value)}
            />
          </div>
          {actionError && <p className="mt-2 text-[0.75rem] text-red-500">{actionError}</p>}
          <div className="mt-2 flex items-center gap-2">
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              disabled={createMut.isPending || !title.trim()}
              type="submit"
            >
              {createMut.isPending ? k.agents.runs.executing : k.services.proposals.form.create}
            </button>
            <button
              className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
              type="button"
              onClick={() => {
                setCreating(false)
                resetCreateForm()
              }}
            >
              {k.services.proposals.form.cancel}
            </button>
          </div>
        </form>
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
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="file" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.services.proposals.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['title', 'status', 'totalValue'] as const).map(header => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={header}>
                    {k.services.proposals.fields[header]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  className="group cursor-pointer border-b border-(--ui-stroke-secondary) hover:bg-(--ui-bg-quaternary) last:border-0"
                  key={row.id}
                  onClick={() => {
                    setSelectedId(row.id)
                    setActionError(null)
                  }}
                >
                  <td className="px-4 py-2">
                    <div className="text-[0.8125rem] text-foreground">{row.title || row.name || row.id}</div>
                    {row.leadId && (
                      <div className="mt-0.5 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{String(row.leadId)}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{proposalStatusLabel(k, row.status)}</td>
                  <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
                    {fmtMoney(row.value ?? row.totalValue ?? row.total_value, row.currency)}
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

// ── Detail = fields + lifecycle + line items + tranches ────────────────────

function ProposalDetail({ k, id, onBack }: { k: CEODIGITALText; id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const detailQ = useQuery({ queryKey: proposalKey(id), queryFn: () => fetchProposal(id) })

  const proposal = useMemo(() => {
    if (!isOk(detailQ.data)) return null
    return (detailQ.data as { proposal: ProposalRow }).proposal
  }, [detailQ.data])

  const [actionError, setActionError] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  /** Optimistically paint the proposal cache; return its previous value for rollback. */
  function patchProposal(updater: (p: ProposalRow) => ProposalRow): unknown {
    const key = proposalKey(id)
    void qc.cancelQueries({ queryKey: key })
    const prev = qc.getQueryData<unknown>(key)
    if (prev && isOk(prev)) {
      qc.setQueryData(key, { ...(prev as object), proposal: updater((prev as { proposal: ProposalRow }).proposal) })
    }
    return prev
  }

  /** Authoritative refetch wins after every mutation. */
  function settle() {
    void qc.invalidateQueries({ queryKey: proposalKey(id) })
    void qc.invalidateQueries({ queryKey: PROPOSALS_KEY })
  }

  const sendMut = useMutation({
    mutationFn: () => sendProposal(id),
    onMutate: async () => ({ prev: patchProposal(p => ({ ...p, status: 'sent' })) }),
    onError: (_e, _v, ctx) => {
      if (ctx && ctx.prev) qc.setQueryData(proposalKey(id), ctx.prev)
      setActionError(k.services.proposals.errors.send)
    },
    onSettled: settle
  })

  const acceptMut = useMutation({
    mutationFn: () => acceptProposal(id),
    onMutate: async () => ({ prev: patchProposal(p => ({ ...p, status: 'accepted' })) }),
    onError: (_e, _v, ctx) => {
      if (ctx && ctx.prev) qc.setQueryData(proposalKey(id), ctx.prev)
      setActionError(k.services.proposals.errors.accept)
    },
    onSettled: settle
  })

  const rejectMut = useMutation({
    mutationFn: () => rejectProposal(id, rejectReason.trim() || undefined),
    onMutate: async () => ({ prev: patchProposal(p => ({ ...p, status: 'rejected' })) }),
    onError: (_e, _v, ctx) => {
      if (ctx && ctx.prev) qc.setQueryData(proposalKey(id), ctx.prev)
      setActionError(k.services.proposals.errors.reject)
    },
    onSettled: () => {
      setRejecting(false)
      setRejectReason('')
      settle()
    }
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelProposal(id),
    onMutate: async () => ({ prev: patchProposal(p => ({ ...p, status: 'cancelled' })) }),
    onError: (_e, _v, ctx) => {
      if (ctx && ctx.prev) qc.setQueryData(proposalKey(id), ctx.prev)
      setActionError(k.services.proposals.errors.cancel)
    },
    onSettled: settle
  })

  const expireMut = useMutation({
    mutationFn: () => expireProposal(id),
    onMutate: async () => ({ prev: patchProposal(p => ({ ...p, status: 'expired' })) }),
    onError: (_e, _v, ctx) => {
      if (ctx && ctx.prev) qc.setQueryData(proposalKey(id), ctx.prev)
      setActionError(k.services.proposals.errors.expire)
    },
    onSettled: settle
  })

  const duplicateMut = useMutation({
    mutationFn: () => duplicateProposal(id),
    onError: () => setActionError(k.services.proposals.errors.duplicate),
    onSettled: settle
  })

  if (detailQ.isLoading) {
    return (
      <div className="grid flex-1 place-items-center bg-(--ui-surface-background)">
        <Loader type="lemniscate-bloom" />
      </div>
    )
  }
  if (!proposal) {
    return (
      <div className="grid flex-1 place-items-center bg-(--ui-surface-background) px-4">
        <div className="flex flex-col items-center gap-3">
          <ErrorState title={k.services.proposals.errors.fetchProposal} />
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
            onClick={onBack}
          >
            {k.services.proposals.back}
          </button>
        </div>
      </div>
    )
  }

  const busy =
    sendMut.isPending || acceptMut.isPending || rejectMut.isPending ||
    cancelMut.isPending || expireMut.isPending || duplicateMut.isPending

  return (
    <div className="flex h-full flex-col bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <button
          className="flex items-center gap-1.5 rounded border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.services.proposals.back}
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">{proposal.title || proposal.name || proposal.id}</h1>
        <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-tertiary)">
          {proposalStatusLabel(k, proposal.status)}
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-x-6 gap-y-2 px-4 py-3 sm:grid-cols-2">
          <Field label={k.services.proposals.fields.description} value={proposal.description} wide />
          <Field label={k.services.proposals.fields.leadId} value={proposal.leadId ?? proposal.lead_id} mono />
          <Field label={k.services.proposals.fields.totalValue} value={fmtMoney(proposal.value ?? proposal.totalValue ?? proposal.total_value, proposal.currency)} />
          <Field label={k.services.proposals.fields.currency} value={proposal.currency} />
          <Field label={k.services.proposals.fields.paymentModel} value={proposal.paymentModel ?? proposal.payment_model} />
          <Field label={k.services.proposals.fields.depositPercentage} value={proposal.depositPercentage ?? proposal.deposit_percentage} />
          <Field label={k.services.proposals.fields.validUntil} value={fmtTime(proposal.validUntil ?? proposal.valid_until)} />
          <Field label={k.services.proposals.fields.terms} value={proposal.terms} wide />
        </div>

        {actionError && <p className="px-4 pb-1 text-[0.75rem] text-red-500">{actionError}</p>}

        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-t border-(--ui-stroke-secondary) px-4 py-2">
          <LifecycleBtn label={k.services.proposals.actions.send} pendingLabel={k.services.proposals.actions.sending} pending={sendMut.isPending} busy={busy} id="send" onClick={() => sendMut.mutate()} />
          <LifecycleBtn label={k.services.proposals.actions.accept} pendingLabel={k.services.proposals.actions.accepting} pending={acceptMut.isPending} busy={busy} id="check" onClick={() => acceptMut.mutate()} />
          <LifecycleBtn
            label={k.services.proposals.actions.reject}
            pendingLabel={k.services.proposals.actions.rejecting}
            pending={rejectMut.isPending}
            busy={busy}
            id="close"
            onClick={() => {
              if (!rejecting) {
                setRejecting(true)
                setRejectReason('')
                return
              }
              rejectMut.mutate()
            }}
          />
          {rejecting && (
            <>
              <input
                className="w-48 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1 text-[0.75rem] text-foreground"
                placeholder={k.services.proposals.reject.reasonPlaceholder}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
              />
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-foreground"
                onClick={() => setRejecting(false)}
              >
                {k.services.proposals.reject.cancel}
              </button>
            </>
          )}
          <LifecycleBtn label={k.services.proposals.actions.cancel} pendingLabel={k.services.proposals.actions.cancelling} pending={cancelMut.isPending} busy={busy} id="circle-slash" onClick={() => cancelMut.mutate()} />
          <LifecycleBtn label={k.services.proposals.actions.duplicate} pendingLabel={k.services.proposals.actions.duplicating} pending={duplicateMut.isPending} busy={busy} id="copy" onClick={() => duplicateMut.mutate()} />
          <LifecycleBtn label={k.services.proposals.actions.expire} pendingLabel={k.services.proposals.actions.expiring} pending={expireMut.isPending} busy={busy} id="history" onClick={() => expireMut.mutate()} />
        </div>

        <ItemsSection k={k} id={id} proposal={proposal} />
        <TranchesSection k={k} id={id} proposal={proposal} />
      </div>
    </div>
  )
}

function Field({ label, value, mono, wide }: { label: string; value: unknown; mono?: boolean; wide?: boolean }) {
  const shown = cell(value)
  return (
    <div className={`flex flex-col gap-0.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary) uppercase">{label}</span>
      <span className={mono ? 'font-mono text-[0.75rem] text-foreground' : 'text-[0.8125rem] text-foreground'}>
        {shown || '—'}
      </span>
    </div>
  )
}

function LifecycleBtn({
  label,
  pendingLabel,
  pending,
  busy,
  id,
  onClick
}: {
  label: string
  pendingLabel: string
  pending: boolean
  busy: boolean
  id: string
  onClick: () => void
}) {
  return (
    <button
      className="flex items-center gap-1.5 rounded-md border border-(--ui-stroke-secondary) px-2.5 py-1.5 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
      disabled={busy}
      onClick={onClick}
    >
      <Codicon className="text-(--ui-text-tertiary)" name={id} size="0.875rem" />
      {pending ? pendingLabel : label}
    </button>
  )
}

// ── Line items ─────────────────────────────────────────────────────────────

function ItemsSection({ k, id, proposal }: { k: CEODIGITALText; id: string; proposal: ProposalRow }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function patch(updater: (p: ProposalRow) => ProposalRow): unknown {
    const key = proposalKey(id)
    void qc.cancelQueries({ queryKey: key })
    const prev = qc.getQueryData<unknown>(key)
    if (prev && isOk(prev)) qc.setQueryData(key, { ...(prev as object), proposal: updater((prev as { proposal: ProposalRow }).proposal) })
    return prev
  }
  function rollback(prev: unknown) {
    if (prev) qc.setQueryData(proposalKey(id), prev)
  }
  function settle() {
    void qc.invalidateQueries({ queryKey: proposalKey(id) })
    void qc.invalidateQueries({ queryKey: PROPOSALS_KEY })
  }

  const addMut = useMutation({
    mutationFn: (values: ProposalItemValues) => addProposalItem(id, values),
    onError: () => setErr(k.services.proposals.errors.addItem),
    onSettled: () => {
      setShowAdd(false)
      settle()
    }
  })

  const updateMut = useMutation({
    mutationFn: (v: { itemId: string; values: ProposalItemValues }) => updateProposalItem(id, v.itemId, v.values),
    onMutate: async v => ({ prev: patch(p => ({ ...p, items: (p.items ?? []).map(i => (i.id === v.itemId ? { ...i, ...itemPreview(v.values) } : i)) })) }),
    onError: (_e, v, ctx) => {
      rollback(ctx?.prev)
      setErr(k.services.proposals.errors.updateItem)
      setEditingId(v.itemId)
    },
    onSettled: () => {
      setEditingId(null)
      settle()
    }
  })

  const removeMut = useMutation({
    mutationFn: (itemId: string) => removeProposalItem(id, itemId),
    onMutate: async itemId => ({ prev: patch(p => ({ ...p, items: (p.items ?? []).filter(i => i.id !== itemId) })) }),
    onError: (_e, _v, ctx) => {
      rollback(ctx?.prev)
      setErr(k.services.proposals.errors.removeItem)
    },
    onSettled: settle
  })

  const items = proposal.items ?? []
  const busy = addMut.isPending || updateMut.isPending || removeMut.isPending
  const editingItem = editingId ? items.find(i => i.id === editingId) ?? null : null

  return (
    <section className="border-t border-(--ui-stroke-secondary)">
      <div className="flex items-center gap-2 px-4 py-2">
        <Codicon className="text-(--ui-text-tertiary)" name="list-unordered" size="0.875rem" />
        <span className="text-[0.75rem] font-medium text-foreground">{k.services.proposals.actions.addItem}</span>
        <button
          className="ml-auto flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-2 py-1 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
          disabled={busy}
          onClick={() => setShowAdd(v => !v)}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="add" size="0.75rem" />
          {k.services.proposals.actions.addItem}
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-2">
          <ItemForm
            k={k}
            submitLabel={k.services.proposals.items.form.add}
            pending={addMut.isPending}
            onSubmit={v => addMut.mutate(v)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {err && <p className="px-4 pb-1 text-[0.75rem] text-red-500">{err}</p>}

      {items.length === 0 ? (
        <p className="px-4 pb-3 text-[0.75rem] text-(--ui-text-tertiary)">{k.services.proposals.items.empty}</p>
      ) : (
        <div className="pb-3">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['description', 'quantity', 'unitPrice', 'vatRate', 'recurrence', 'actions'] as const).map(h => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                    {h === 'actions' ? '' : k.services.proposals.items.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  k={k}
                  currency={proposal.currency}
                  id={id}
                  busy={busy}
                  onEdit={() => setEditingId(item.id)}
                  patcher={patch}
                  rollback={rollback}
                  settler={settle}
                />
              ))}
            </tbody>
          </table>
          {editingItem && (
            <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-2">
              <ItemForm
                k={k}
                submitLabel={k.services.proposals.items.form.update}
                pending={updateMut.isPending}
                initial={editingItem}
                onSubmit={values => updateMut.mutate({ itemId: editingItem.id, values })}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function ItemRow({
  item,
  k,
  currency,
  id,
  busy,
  onEdit,
  patcher,
  rollback,
  settler
}: {
  item: ProposalItem
  k: CEODIGITALText
  currency: unknown
  id: string
  busy: boolean
  onEdit: () => void
  patcher: (updater: (p: ProposalRow) => ProposalRow) => unknown
  rollback: (prev: unknown) => void
  settler: () => void
}) {
  const qc = useQueryClient()
  const removeMut = useMutation({
    mutationFn: () => removeProposalItem(id, item.id),
    onMutate: async () => ({ prev: patcher(p => ({ ...p, items: (p.items ?? []).filter(i => i.id !== item.id) })) }),
    onError: (_e, _v, ctx) => rollback(ctx?.prev),
    onSettled: settler
  })

  return (
    <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
      <td className="px-4 py-2 text-[0.75rem] text-foreground">
        {item.description || item.service_catalog_id || item.serviceCatalogId || item.id}
      </td>
      <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">{cell(item.quantity)}</td>
      <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
        {fmtMoney(item.unit_price ?? item.unitPrice, currency)}
      </td>
      <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">{item.vat_rate != null ? `${cell(item.vat_rate)}%` : ''}</td>
      <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{cell(item.recurrence)}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
            disabled={busy}
            title={k.services.proposals.actions.save}
            onClick={onEdit}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="edit" size="0.75rem" />
          </button>
          <button
            className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-red-500 disabled:opacity-50"
            disabled={busy || removeMut.isPending}
            title={k.services.proposals.actions.remove}
            onClick={() => removeMut.mutate()}
          >
            <Codicon className="text-red-500" name="trash" size="0.75rem" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function ItemForm({
  k,
  submitLabel,
  pending,
  initial,
  onSubmit,
  onCancel
}: {
  k: CEODIGITALText
  submitLabel: string
  pending: boolean
  initial?: ProposalItem
  onSubmit: (values: ProposalItemValues) => void
  onCancel: () => void
}) {
  const [serviceCatalogId, setServiceCatalogId] = useState(initial?.serviceCatalogId ?? initial?.service_catalog_id ?? '')
  const [serviceOfferingId, setServiceOfferingId] = useState(initial?.serviceOfferingId ?? '')
  const [quantity, setQuantity] = useState(initial?.quantity != null ? String(initial.quantity) : '')
  const [unitPrice, setUnitPrice] = useState(initial?.unit_price ?? initial?.unitPrice != null ? String(initial.unit_price ?? initial.unitPrice) : '')
  const [discount, setDiscount] = useState(initial?.discount != null ? String(initial.discount) : '')
  const [vatRate, setVatRate] = useState(initial?.vat_rate != null ? String(initial.vat_rate) : '')
  const [recurrence, setRecurrence] = useState(initial?.recurrence ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order != null ? String(initial.sort_order) : '')

  return (
    <form
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
      onSubmit={e => {
        e.preventDefault()
        if (!serviceCatalogId.trim() || !unitPrice.trim() || pending) return
        onSubmit({
          serviceCatalogId: serviceCatalogId.trim(),
          unitPrice: Number(unitPrice),
          serviceOfferingId: serviceOfferingId.trim() || undefined,
          quantity: quantity.trim() ? Number(quantity) : undefined,
          discount: discount.trim() ? Number(discount) : undefined,
          vatRate: vatRate.trim() ? Number(vatRate) : undefined,
          recurrence: recurrence.trim() || undefined,
          description: description.trim() || undefined,
          sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined
        })
      }}
    >
      <input className={inp} placeholder={k.services.proposals.items.form.serviceCatalogId} value={serviceCatalogId} onChange={e => setServiceCatalogId(e.target.value)} />
      <input className={inp} placeholder={k.services.proposals.items.form.serviceOfferingId} value={serviceOfferingId} onChange={e => setServiceOfferingId(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.items.form.quantity} value={quantity} onChange={e => setQuantity(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.items.form.unitPrice} value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.items.form.discount} value={discount} onChange={e => setDiscount(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.items.form.vatRate} value={vatRate} onChange={e => setVatRate(e.target.value)} />
      <input className={inp} placeholder={k.services.proposals.items.form.recurrence} value={recurrence} onChange={e => setRecurrence(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.items.form.sortOrder} value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
      <input className={`${inp} sm:col-span-4`} placeholder={k.services.proposals.items.form.description} value={description} onChange={e => setDescription(e.target.value)} />
      <div className="flex items-center gap-2 sm:col-span-4">
        <button className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50" type="submit" disabled={pending || !serviceCatalogId.trim() || !unitPrice.trim()}>
          {pending ? k.agents.runs.executing : submitLabel}
        </button>
        <button className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground" type="button" onClick={onCancel}>
          {k.services.proposals.items.form.cancel}
        </button>
      </div>
    </form>
  )
}

// ── Payment tranches ───────────────────────────────────────────────────────

function TranchesSection({ k, id, proposal }: { k: CEODIGITALText; id: string; proposal: ProposalRow }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function patch(updater: (p: ProposalRow) => ProposalRow): unknown {
    const key = proposalKey(id)
    void qc.cancelQueries({ queryKey: key })
    const prev = qc.getQueryData<unknown>(key)
    if (prev && isOk(prev)) qc.setQueryData(key, { ...(prev as object), proposal: updater((prev as { proposal: ProposalRow }).proposal) })
    return prev
  }
  function rollback(prev: unknown) {
    if (prev) qc.setQueryData(proposalKey(id), prev)
  }
  function settle() {
    void qc.invalidateQueries({ queryKey: proposalKey(id) })
    void qc.invalidateQueries({ queryKey: PROPOSALS_KEY })
  }

  const addMut = useMutation({
    mutationFn: (values: ProposalTrancheValues) => addTranche(id, values),
    onError: () => setErr(k.services.proposals.errors.addTranche),
    onSettled: () => {
      setShowAdd(false)
      settle()
    }
  })

  const updateMut = useMutation({
    mutationFn: (v: { trancheId: string; values: ProposalTrancheValues }) => updateTranche(id, v.trancheId, v.values),
    onMutate: async v => ({ prev: patch(p => ({ ...p, tranches: (p.tranches ?? []).map(t => (t.id === v.trancheId ? { ...t, ...tranchePreview(v.values) } : t)) })) }),
    onError: (_e, v, ctx) => {
      rollback(ctx?.prev)
      setErr(k.services.proposals.errors.updateTranche)
      setEditingId(v.trancheId)
    },
    onSettled: () => {
      setEditingId(null)
      settle()
    }
  })

  const removeMut = useMutation({
    mutationFn: (trancheId: string) => removeTranche(id, trancheId),
    onMutate: async trancheId => ({ prev: patch(p => ({ ...p, tranches: (p.tranches ?? []).filter(t => t.id !== trancheId) })) }),
    onError: (_e, _v, ctx) => {
      rollback(ctx?.prev)
      setErr(k.services.proposals.errors.removeTranche)
    },
    onSettled: settle
  })

  const tranches = proposal.tranches ?? []
  const busy = addMut.isPending || updateMut.isPending || removeMut.isPending
  const editingTranche = editingId ? tranches.find(t => t.id === editingId) ?? null : null

  return (
    <section className="border-t border-(--ui-stroke-secondary)">
      <div className="flex items-center gap-2 px-4 py-2">
        <Codicon className="text-(--ui-text-tertiary)" name="credit-card" size="0.875rem" />
        <span className="text-[0.75rem] font-medium text-foreground">{k.services.proposals.actions.addTranche}</span>
        <button
          className="ml-auto flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-2 py-1 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
          disabled={busy}
          onClick={() => setShowAdd(v => !v)}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="add" size="0.75rem" />
          {k.services.proposals.actions.addTranche}
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-2">
          <TrancheForm
            k={k}
            submitLabel={k.services.proposals.tranches.form.add}
            pending={addMut.isPending}
            onSubmit={v => addMut.mutate(v)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {err && <p className="px-4 pb-1 text-[0.75rem] text-red-500">{err}</p>}

      {tranches.length === 0 ? (
        <p className="px-4 pb-3 text-[0.75rem] text-(--ui-text-tertiary)">{k.services.proposals.tranches.empty}</p>
      ) : (
        <div className="pb-3">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['label', 'amount', 'dueDate', 'actions'] as const).map(h => (
                  <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                    {h === 'actions' ? '' : k.services.proposals.tranches.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tranches.map(tranche => (
                <TrancheRow
                  key={tranche.id}
                  tranche={tranche}
                  k={k}
                  currency={proposal.currency}
                  id={id}
                  busy={busy}
                  onEdit={() => setEditingId(tranche.id)}
                  patcher={patch}
                  rollback={rollback}
                  settler={settle}
                />
              ))}
            </tbody>
          </table>
          {editingTranche && (
            <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) px-4 py-2">
              <TrancheForm
                k={k}
                submitLabel={k.services.proposals.tranches.form.update}
                pending={updateMut.isPending}
                initial={editingTranche}
                onSubmit={values => updateMut.mutate({ trancheId: editingTranche.id, values })}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function TrancheRow({
  tranche,
  k,
  currency,
  id,
  busy,
  onEdit,
  patcher,
  rollback,
  settler
}: {
  tranche: ProposalTranche
  k: CEODIGITALText
  currency: unknown
  id: string
  busy: boolean
  onEdit: () => void
  patcher: (updater: (p: ProposalRow) => ProposalRow) => unknown
  rollback: (prev: unknown) => void
  settler: () => void
}) {
  const qc = useQueryClient()
  const removeMut = useMutation({
    mutationFn: () => removeTranche(id, tranche.id),
    onMutate: async () => ({ prev: patcher(p => ({ ...p, tranches: (p.tranches ?? []).filter(t => t.id !== tranche.id) })) }),
    onError: (_e, _v, ctx) => rollback(ctx?.prev),
    onSettled: settler
  })

  return (
    <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
      <td className="px-4 py-2 text-[0.75rem] text-foreground">{tranche.label || tranche.id}</td>
      <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">{fmtMoney(tranche.amount, currency)}</td>
      <td className="px-4 py-2 text-[0.6875rem] text-(--ui-text-tertiary)">{fmtTime(tranche.due_date)}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1.5">
          <button
            className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
            disabled={busy}
            title={k.services.proposals.actions.save}
            onClick={onEdit}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="edit" size="0.75rem" />
          </button>
          <button
            className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-red-500 disabled:opacity-50"
            disabled={busy || removeMut.isPending}
            title={k.services.proposals.actions.remove}
            onClick={() => removeMut.mutate()}
          >
            <Codicon className="text-red-500" name="trash" size="0.75rem" />
          </button>
        </div>
      </td>
    </tr>
  )
}

function TrancheForm({
  k,
  submitLabel,
  pending,
  initial,
  onSubmit,
  onCancel
}: {
  k: CEODIGITALText
  submitLabel: string
  pending: boolean
  initial?: ProposalTranche
  onSubmit: (values: ProposalTrancheValues) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '')
  const [dueDate, setDueDate] = useState(initial?.due_date ?? '')
  const [sortOrder, setSortOrder] = useState(initial?.sort_order != null ? String(initial.sort_order) : '')

  return (
    <form
      className="grid grid-cols-1 gap-2 sm:grid-cols-4"
      onSubmit={e => {
        e.preventDefault()
        if (!label.trim() || !amount.trim() || pending) return
        onSubmit({
          label: label.trim(),
          amount: Number(amount),
          dueDate: dueDate.trim() || undefined,
          sortOrder: sortOrder.trim() ? Number(sortOrder) : undefined
        })
      }}
    >
      <input className={inp} placeholder={k.services.proposals.tranches.form.label} value={label} onChange={e => setLabel(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.tranches.form.amount} value={amount} onChange={e => setAmount(e.target.value)} />
      <input className={inp} placeholder={k.services.proposals.tranches.form.dueDate} value={dueDate} onChange={e => setDueDate(e.target.value)} />
      <input className={inp} type="number" placeholder={k.services.proposals.tranches.form.sortOrder} value={sortOrder} onChange={e => setSortOrder(e.target.value)} />
      <div className="flex items-center gap-2 sm:col-span-4">
        <button className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50" type="submit" disabled={pending || !label.trim() || !amount.trim()}>
          {pending ? k.agents.runs.executing : submitLabel}
        </button>
        <button className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground" type="button" onClick={onCancel}>
          {k.services.proposals.tranches.form.cancel}
        </button>
      </div>
    </form>
  )
}