/**
 * CEODigital Payments page (W7) — the tenant's payments plus payment-link
 * creation/cancel, proxied via `/api/plugins/ceodigital/commerce/...`:
 *   * list     (GET  /commerce/payments?status&orderId&customerEmail&limit)
 *   * create   (POST /commerce/payment-links {orderId?, customerEmail?, customerName?,
 *               customerPhone?, amountCents?, currency?, expiresInDays?})
 *   * cancel   (POST /commerce/payment-links/{id}/cancel {reason?})
 *
 * There is no list endpoint for payment links (only create/cancel), so links
 * are cancelled by id in a dedicated mini-form. Writers flow through the MCP
 * adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  cancelPaymentLink,
  createPaymentLink,
  fetchPayments,
  PAYMENTS_KEY
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, PaymentRow, PaymentStatus } from '../types'
import { PAYMENT_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function paymentsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const statusLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.commerce.payments.statuses[status as PaymentStatus] ?? status ?? '')

const money = (cents: null | number | string | undefined, currency?: null | string) =>
  cents === null || cents === undefined || cents === '' ? '' : `${currency ?? ''} ${Number(cents) / 100}`

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

export function PaymentsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [orderFilter, setOrderFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [amountCents, setAmountCents] = useState('')
  const [currency, setCurrency] = useState('')
  const [expiresInDays, setExpiresInDays] = useState('')
  const [orderId, setOrderId] = useState('')
  const [cancelId, setCancelId] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...PAYMENTS_KEY, { statusFilter, orderFilter }] as unknown[],
    queryFn: () =>
      fetchPayments({
        status: (statusFilter || undefined) as PaymentStatus | undefined,
        orderId: orderFilter.trim() || undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { payments: PaymentRow[] }).payments }
    }
    return { code: paymentsErrorCode(listQ.error), rows: [] as PaymentRow[] }
  })()

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const createMut = useMutation({
    mutationFn: () =>
      createPaymentLink({
        orderId: orderId.trim() || undefined,
        customerEmail: email.trim() || undefined,
        customerName: name.trim() || undefined,
        customerPhone: phone.trim() || undefined,
        amountCents: amountCents ? Number(amountCents) : undefined,
        currency: currency.trim() || undefined,
        expiresInDays: expiresInDays ? Number(expiresInDays) : undefined
      }),
    onSuccess: () => {
      setCreating(false)
      setEmail('')
      setName('')
      setPhone('')
      setAmountCents('')
      setCurrency('')
      setExpiresInDays('')
      setOrderId('')
      setActionError(null)
    },
    onError: err => setActionError(paymentsErrorCode(err) ?? k.commerce.payments.errors.createLink)
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelPaymentLink(cancelId.trim(), cancelReason.trim() || undefined),
    onSuccess: () => {
      setCancelId('')
      setCancelReason('')
      setActionError(null)
    },
    onError: err => setActionError(paymentsErrorCode(err) ?? k.commerce.payments.errors.cancelLink)
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.commerce.payments.title}</h1>
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
            {k.commerce.payments.newLink}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <select className={inp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{k.commerce.payments.allStatuses}</option>
          {PAYMENT_STATUSES.map(s => (
            <option key={s} value={s}>
              {k.commerce.payments.statuses[s] ?? s}
            </option>
          ))}
        </select>
        <input
          className={`${inp} w-48`}
          placeholder={k.commerce.payments.headers.order}
          value={orderFilter}
          onChange={e => setOrderFilter(e.target.value)}
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
                placeholder={k.commerce.payments.createForm.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.commerce.payments.createForm.namePlaceholder}
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.commerce.payments.createForm.phonePlaceholder}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} w-32`}
                type="number"
                min={0}
                placeholder={k.commerce.payments.createForm.amountCentsPlaceholder}
                value={amountCents}
                onChange={e => setAmountCents(e.target.value)}
              />
              <input
                className={`${inp} w-24`}
                maxLength={3}
                placeholder={k.commerce.payments.createForm.currencyPlaceholder}
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              />
              <input
                className={`${inp} w-32`}
                type="number"
                min={1}
                placeholder={k.commerce.payments.createForm.expiresInDays}
                value={expiresInDays}
                onChange={e => setExpiresInDays(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.commerce.payments.createForm.orderIdPlaceholder}
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                type="submit"
                disabled={createMut.isPending || (!email.trim() && !orderId.trim() && (amountCents === '' || Number(amountCents) <= 0))}
              >
                {createMut.isPending ? k.agents.runs.executing : k.commerce.payments.createForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  setEmail('')
                  setName('')
                  setPhone('')
                  setAmountCents('')
                  setCurrency('')
                  setExpiresInDays('')
                  setOrderId('')
                  setActionError(null)
                }}
              >
                {k.commerce.payments.createForm.cancel}
              </button>
            </div>
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
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="credit-card" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.commerce.payments.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'status', 'order', 'customer', 'amount', 'created'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.commerce.payments.headers[h]}
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
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {statusLabel(k, row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                    {row.order_id ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.customer_email ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.8125rem] tabular-nums text-foreground">
                    {money(row.amount_cents, row.currency)}
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

      <div className="shrink-0 border-t border-(--ui-stroke-secondary) px-4 py-3">
        <h2 className="mb-2 text-[0.8125rem] font-semibold text-foreground">
          {k.commerce.payments.linksTitle}
        </h2>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={e => {
            e.preventDefault()
            if (cancelId.trim() && !cancelMut.isPending) cancelMut.mutate()
          }}
        >
          <input
            className={`${inp} w-52`}
            placeholder={k.commerce.payments.linksEmpty}
            value={cancelId}
            onChange={e => setCancelId(e.target.value)}
          />
          <input
            className={`${inp} flex-1`}
            maxLength={500}
            placeholder={k.commerce.payments.cancelReasonPlaceholder}
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
          />
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground disabled:opacity-50"
            disabled={cancelMut.isPending || !cancelId.trim()}
            type="submit"
          >
            {cancelMut.isPending ? k.commerce.payments.cancelling : k.commerce.payments.cancelLink}
          </button>
        </form>
      </div>
    </div>
  )
}