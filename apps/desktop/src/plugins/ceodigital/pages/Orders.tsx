/**
 * CEODigital Orders page (W7) — the tenant's orders with status/fulfillment
 * filters, a detail view and status/fulfillment update, proxied via
 * `/api/plugins/ceodigital/commerce/orders` (MCP `orders.*`):
 *   * list    (GET  /commerce/orders?status&paymentStatus&fulfillmentStatus&customerId&search&limit)
 *   * detail  (GET  /commerce/orders/{id})
 *   * update  (POST /commerce/orders/{id}/status {status?, fulfillmentStatus?, cancellationReason?})
 *
 * Status updates flow through the CEODigital MCP adapter, which holds its own
 * human-in-the-loop approval; this renderer neither bypasses nor simulates it.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import { fetchOrder, fetchOrders, ORDERS_KEY, orderKey, updateOrderStatus } from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type {
  CeodigitalErrorCode,
  FulfillmentStatus,
  OrderRow,
  OrderStatus,
  PaymentStatus
} from '../types'
import { FULFILLMENT_STATUSES, ORDER_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function ordersErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const money = (cents: null | number | string | undefined, currency?: null | string) =>
  cents === null || cents === undefined || cents === '' ? '' : `${currency ?? ''} ${Number(cents) / 100}`

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

export function OrdersPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [fulfillmentFilter, setFulfillmentFilter] = useState('')
  const [search, setSearch] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<OrderStatus | ''>('')
  const [fulfillmentUpdate, setFulfillmentUpdate] = useState<FulfillmentStatus | ''>('')
  const [cancelReason, setCancelReason] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [
      ...ORDERS_KEY,
      { statusFilter, paymentFilter, fulfillmentFilter, search }
    ] as unknown[],
    queryFn: () =>
      fetchOrders({
        status: (statusFilter || undefined) as OrderStatus | undefined,
        paymentStatus: (paymentFilter || undefined) as PaymentStatus | undefined,
        fulfillmentStatus: (fulfillmentFilter || undefined) as FulfillmentStatus | undefined,
        search: search.trim() || undefined
      })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { orders: OrderRow[] }).orders }
    }
    return { code: ordersErrorCode(listQ.error), rows: [] as OrderRow[] }
  })()

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const refresh = () => void qc.invalidateQueries({ queryKey: ORDERS_KEY })

  const detailQ = useQuery({
    queryKey: selectedId ? orderKey(selectedId) : [...orderKey(''), null],
    queryFn: () => fetchOrder(selectedId as string),
    enabled: !!selectedId
  })

  const selected =
    selectedId && isOk(detailQ.data) ? (detailQ.data as { order: OrderRow }).order : null

  const openDetail = (id: string) => {
    setSelectedId(id)
    setStatusUpdate('')
    setFulfillmentUpdate('')
    setCancelReason('')
    setActionError(null)
  }

  const updateMut = useMutation({
    mutationFn: () => {
      const id = selectedId as string
      const body: {
        status?: string
        fulfillmentStatus?: string
        cancellationReason?: string
      } = {}
      if (statusUpdate) body.status = statusUpdate
      if (fulfillmentUpdate) body.fulfillmentStatus = fulfillmentUpdate
      if (statusUpdate === 'cancelled' && cancelReason.trim()) body.cancellationReason = cancelReason.trim()
      return updateOrderStatus(id, body)
    },
    onSuccess: () => {
      setActionError(null)
      setStatusUpdate('')
      setFulfillmentUpdate('')
      setCancelReason('')
      if (selectedId) void qc.invalidateQueries({ queryKey: orderKey(selectedId) })
      refresh()
    },
    onError: err => setActionError(ordersErrorCode(err) ?? k.commerce.orders.errors.updateStatus)
  })

  if (selectedId) {
    if (detailQ.isLoading) {
      return (
        <div className="grid h-full place-items-center bg-(--ui-surface-background)">
          <Loader type="lemniscate-bloom" />
        </div>
      )
    }
    if (!selected) {
      return (
        <div className="grid h-full place-items-center bg-(--ui-surface-background)">
          <ErrorState title={selectedId && code ? errorCopy : k.commerce.orders.errors.fetchOrder} />
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
        <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
          <button
            className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
            onClick={() => setSelectedId(null)}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
            {k.commerce.orders.back}
          </button>
          <h1 className="truncate text-sm font-semibold text-foreground">{k.commerce.orders.detail}</h1>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[0.8125rem]">
            {(
              [
                ['id', selected.id],
                ['status', statusLabel(k, selected.status)],
                ['payment', paymentLabel(k, selected.payment_status)],
                ['fulfillment', fulfillmentLabel(k, selected.fulfillment_status)],
                ['customer', selected.customer_email ?? selected.customer_id ?? ''],
                ['total', money(selected.total_cents, selected.currency)],
                ['created', selected.created_at ?? '']
              ] as const
            ).map(([key, val]) => (
              <div key={key}>
                <dt className="text-[0.625rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                  {k.commerce.orders.detailHeaders[key]}
                </dt>
                <dd className="truncate text-foreground">{val}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 border-t border-(--ui-stroke-secondary) pt-3">
            <h2 className="mb-2 text-[0.8125rem] font-semibold text-foreground">
              {k.commerce.orders.changeStatus}
            </h2>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[0.625rem] text-(--ui-text-tertiary)">
                  {k.commerce.orders.statusLabel}
                </span>
                <select
                  className={inp}
                  value={statusUpdate}
                  onChange={e => {
                    setStatusUpdate(e.target.value as OrderStatus | '')
                    if (e.target.value !== 'cancelled') setCancelReason('')
                  }}
                >
                  <option value="">—</option>
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {k.commerce.orders.statuses[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[0.625rem] text-(--ui-text-tertiary)">
                  {k.commerce.orders.fulfillmentLabel}
                </span>
                <select
                  className={inp}
                  value={fulfillmentUpdate}
                  onChange={e => setFulfillmentUpdate(e.target.value as FulfillmentStatus | '')}
                >
                  <option value="">—</option>
                  {FULFILLMENT_STATUSES.map(s => (
                    <option key={s} value={s}>
                      {k.commerce.orders.fulfillments[s] ?? s}
                    </option>
                  ))}
                </select>
              </label>
              {statusUpdate === 'cancelled' && (
                <label className="flex min-w-[220px] flex-1 flex-col gap-1">
                  <span className="text-[0.625rem] text-(--ui-text-tertiary)">
                    {k.commerce.orders.cancellationReason}
                  </span>
                  <input
                    className={inp}
                    placeholder={k.commerce.orders.cancellationReasonPlaceholder}
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                </label>
              )}
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={updateMut.isPending || (!statusUpdate && !fulfillmentUpdate)}
                onClick={() => updateMut.mutate()}
              >
                {updateMut.isPending ? k.commerce.orders.updating : k.commerce.orders.updateStatus}
              </button>
            </div>
            {actionError && <p className="mt-2 text-[0.75rem] text-red-500">{actionError}</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.commerce.orders.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} w-40`}
          placeholder={k.commerce.orders.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className={inp} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">{k.commerce.orders.allStatuses}</option>
          {ORDER_STATUSES.map(s => (
            <option key={s} value={s}>
              {k.commerce.orders.statuses[s] ?? s}
            </option>
          ))}
        </select>
        <select className={inp} value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}>
          <option value="">{k.commerce.orders.allPaymentStatuses}</option>
          {PAYMENT_STATUSES.map(p => (
            <option key={p} value={p}>
              {k.commerce.payments.statuses[p] ?? p}
            </option>
          ))}
        </select>
        <select
          className={inp}
          value={fulfillmentFilter}
          onChange={e => setFulfillmentFilter(e.target.value)}
        >
          <option value="">{k.commerce.orders.allFulfillmentStatuses}</option>
          {FULFILLMENT_STATUSES.map(f => (
            <option key={f} value={f}>
              {k.commerce.orders.fulfillments[f] ?? f}
            </option>
          ))}
        </select>
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
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="package" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.commerce.orders.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'status', 'payment', 'fulfillment', 'customer', 'total'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.commerce.orders.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="group cursor-pointer border-b border-(--ui-stroke-secondary) last:border-0 hover:bg-(--ui-bg-quaternary)"
                  onClick={() => openDetail(row.id)}
                >
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                    {row.id}
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill
                      label={statusLabel(k, row.status)}
                      tone={row.status === 'cancelled' ? 'bad' : row.status === 'delivered' ? 'good' : 'mid'}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <StatusPill
                      label={paymentLabel(k, row.payment_status)}
                      tone={
                        row.payment_status === 'paid'
                          ? 'good'
                          : row.payment_status === 'failed' || row.payment_status === 'refunded'
                            ? 'bad'
                            : 'mid'
                      }
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] text-(--ui-text-secondary)">
                      {fulfillmentLabel(k, row.fulfillment_status)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.customer_email ?? row.customer_id ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.8125rem] tabular-nums text-foreground">
                    {money(row.total_cents, row.currency)}
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

function StatusPill({ label, tone }: { label: string; tone: 'good' | 'bad' | 'mid' }) {
  const cls =
    tone === 'bad'
      ? 'bg-(--ui-bg-quaternary) text-red-500'
      : tone === 'good'
        ? 'bg-(--ui-bg-quaternary) text-(--ui-accent)'
        : 'bg-(--ui-bg-quaternary) text-(--ui-text-secondary)'
  return <span className={`rounded-full px-1.5 py-px text-[0.625rem] ${cls}`}>{label}</span>
}

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

const statusLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.commerce.orders.statuses[status as OrderStatus] ?? status ?? '')
const paymentLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.commerce.payments.statuses[status as PaymentStatus] ?? status ?? '')
const fulfillmentLabel = (k: CEODIGITALText, status: null | string | undefined): string =>
  (k.commerce.orders.fulfillments[status as FulfillmentStatus] ?? status ?? '')