/**
 * CEODigital Pricing page (W8-UI-a) — the tenant's pricing profiles with rules,
 * exemptions and fees, proxied via `/api/plugins/ceodigital/pricing` (MCP
 * `pricing.*`):
 *   * profiles   (GET  /pricing/profiles?active&search&limit)
 *   * detail     (GET  /pricing/profiles/{id_or_code})
 *   * rules      (GET  /pricing/rules?profileId)
 *   * exemptions (GET  /pricing/exemptions, POST /pricing/exemptions)
 *   * fees       (GET  /pricing/fees?active&search)
 *   * create     (POST /pricing/profiles)
 *   * update     (POST /pricing/profiles/{id}/update)
 *
 * Writes flow through the CEODigital MCP adapter's human-in-the-loop approval.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  addPricingExemption,
  createPricingProfile,
  fetchPricingExemptions,
  fetchPricingFees,
  fetchPricingProfile,
  fetchPricingProfiles,
  fetchPricingRules,
  PRICING_EXEMPTIONS_KEY,
  PRICING_FEES_KEY,
  pricingProfileKey,
  PRICING_PROFILES_KEY,
  PRICING_RULES_KEY,
  updatePricingProfile
} from '../api'
import { type CEODIGITALText, useCeodigital } from '../i18n'
import type {
  CeodigitalErrorCode,
  ExemptionRow,
  ExemptionSourceType,
  ExemptionType,
  FeeRow,
  PricingProfileRow,
  PricingRuleRow
} from '../types'
import { EXEMPTION_SOURCE_TYPES, EXEMPTION_TYPES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function pricingErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function PricingPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [activeOnly, setActiveOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...PRICING_PROFILES_KEY, { activeOnly, search }] as unknown[],
    queryFn: () => fetchPricingProfiles({ active: activeOnly || undefined, search: search.trim() || undefined })
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { profiles: PricingProfileRow[] }).profiles }
    }
    return { code: pricingErrorCode(listQ.error), rows: [] as PricingProfileRow[] }
  })()
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const detailQ = useQuery({
    queryKey: selectedId ? pricingProfileKey(selectedId) : [...pricingProfileKey(''), null],
    queryFn: () => fetchPricingProfile(selectedId as string),
    enabled: !!selectedId
  })

  const selected =
    selectedId && isOk(detailQ.data)
      ? (detailQ.data as { profile: PricingProfileRow }).profile
      : null

  const refresh = () => void qc.invalidateQueries({ queryKey: PRICING_PROFILES_KEY })

  const closeCreate = () => {
    setCreating(false)
    setActionError(null)
  }

  const openDetail = (id: string) => {
    setActionError(null)
    setSelectedId(id)
  }

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
          <ErrorState title={k.pricing.errors.fetchProfile} />
        </div>
      )
    }
    return <ProfileDetail k={k} profile={selected} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.pricing.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={creating || listQ.isLoading}
            onClick={() => setCreating(v => !v)}
          >
            {k.pricing.new}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-(--ui-stroke-secondary) px-4 py-2">
        {(['all', 'active'] as const).map(f => (
          <button
            key={f}
            className={`rounded-md px-2 py-1 text-[0.6875rem] ${
              (f === 'active' ? activeOnly : !activeOnly)
                ? 'bg-(--ui-bg-quaternary) text-foreground'
                : 'text-(--ui-text-tertiary) hover:text-foreground'
            }`}
            onClick={() => setActiveOnly(f === 'active')}
          >
            {f === 'all' ? k.pricing.all : k.pricing.activeOnly}
          </button>
        ))}
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.pricing.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {creating && (
        <ProfileCreateForm k={k} onDone={refresh} onClose={closeCreate} />
      )}

      {actionError && !creating && <div className="shrink-0 px-4 py-1 text-[0.75rem] text-red-500">{actionError}</div>}

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
            <Codicon className="text-(--ui-text-quaternary)" name="percentage" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.pricing.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'code', 'name', 'defaultRate', 'active', 'default'] as const).map(h => (
                  <th className={TABLE_HEAD} key={h}>
                    {k.pricing.headers[h]}
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
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-secondary)">{row.code ?? ''}</td>
                  <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.name ?? ''}</td>
                  <td className="px-4 py-2 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
                    {row.default_rate ?? ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.is_active === true ? '✓' : row.is_active === false ? '—' : ''}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {row.is_default === true ? '✓' : row.is_default === false ? '—' : ''}
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

function ProfileCreateForm({
  k,
  onDone,
  onClose
}: {
  k: CEODIGITALText
  onDone: () => void
  onClose: () => void
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [defaultRate, setDefaultRate] = useState('')
  const [description, setDescription] = useState('')
  const [exemptionReason, setExemptionReason] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const createMut = useMutation({
    mutationFn: () =>
      createPricingProfile({
        code: code.trim(),
        name: name.trim(),
        defaultRate: defaultRate.trim() !== '' ? Number(defaultRate) : undefined,
        description: description.trim() || undefined,
        exemptionReason: exemptionReason.trim() || undefined,
        isDefault: isDefault || undefined
      }),
    onSuccess: () => {
      onDone()
      onClose()
    },
    onError: err => setActionError(pricingErrorCode(err) ?? k.pricing.errors.create)
  })

  return (
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
            className={`${inp} w-40`}
            maxLength={120}
            placeholder={k.pricing.createForm.codePlaceholder}
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <input
            className={`${inp} flex-1`}
            maxLength={200}
            placeholder={k.pricing.createForm.namePlaceholder}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className={`${inp} w-32`}
            inputMode="numeric"
            maxLength={3}
            placeholder={k.pricing.createForm.defaultRatePlaceholder}
            value={defaultRate}
            onChange={e => setDefaultRate(e.target.value)}
          />
        </div>
        <input
          className={`${inp} w-56`}
          maxLength={30}
          placeholder={k.pricing.createForm.exemptionReasonPlaceholder}
          value={exemptionReason}
          onChange={e => setExemptionReason(e.target.value)}
        />
        <input
          className={inp}
          maxLength={500}
          placeholder={k.pricing.createForm.descriptionPlaceholder}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <label className="flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
          <span>{k.pricing.createForm.isDefault}</span>
        </label>
        {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            type="submit"
            disabled={createMut.isPending || !code.trim() || !name.trim()}
          >
            {createMut.isPending ? k.agents.runs.executing : k.pricing.createForm.create}
          </button>
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
            type="button"
            onClick={onClose}
          >
            {k.pricing.createForm.cancel}
          </button>
        </div>
      </div>
    </form>
  )
}

function ProfileDetail({
  k,
  profile,
  onBack
}: {
  k: CEODIGITALText
  profile: PricingProfileRow
  onBack: () => void
}) {
  const qc = useQueryClient()

  const rulesQ = useQuery({
    queryKey: [...PRICING_RULES_KEY, profile.id] as unknown[],
    queryFn: () => fetchPricingRules({ profileId: profile.id })
  })
  const exemptionsQ = useQuery({
    queryKey: PRICING_EXEMPTIONS_KEY,
    queryFn: () => fetchPricingExemptions()
  })
  const feesQ = useQuery({
    queryKey: PRICING_FEES_KEY,
    queryFn: () => fetchPricingFees()
  })

  const rules = isOk(rulesQ.data) ? (rulesQ.data as { rules: PricingRuleRow[] }).rules : []
  const exemptions = isOk(exemptionsQ.data)
    ? (exemptionsQ.data as { exemptions: ExemptionRow[] }).exemptions
    : []
  const fees = isOk(feesQ.data) ? (feesQ.data as { fees: FeeRow[] }).fees : []

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: PRICING_RULES_KEY })
    void qc.invalidateQueries({ queryKey: PRICING_EXEMPTIONS_KEY })
    void qc.invalidateQueries({ queryKey: PRICING_FEES_KEY })
    void qc.invalidateQueries({ queryKey: pricingProfileKey(profile.id) })
    void qc.invalidateQueries({ queryKey: PRICING_PROFILES_KEY })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.pricing.back}
        </button>
        <h1 className="truncate text-sm font-semibold text-foreground">{k.pricing.detail}</h1>
        <span className="truncate text-[0.8125rem] text-(--ui-text-secondary)">
          {profile.code ?? ''} · {profile.name ?? ''}
        </span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{profile.id}</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ProfileUpdateForm k={k} profile={profile} onDone={refresh} />

        <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
          <h2 className="mb-2 text-[0.8125rem] font-semibold text-foreground">{k.pricing.rules}</h2>
          {rulesQ.isLoading ? (
            <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
          ) : rules.length === 0 ? (
            <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.pricing.rulesEmpty}</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-(--ui-stroke-secondary)">
                  {(['id', 'kind', 'rate'] as const).map(h => (
                    <th className={TABLE_HEAD} key={h}>
                      {k.pricing.ruleHeaders[h]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                    <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                      {rule.id}
                    </td>
                    <td className="px-4 py-1.5 text-[0.75rem] text-(--ui-text-secondary)">{rule.kind ?? ''}</td>
                    <td className="px-4 py-1.5 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">
                      {rule.rate ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <ExemptionsSection k={k} exemptions={exemptions} loading={exemptionsQ.isLoading} onDone={refresh} />

        <section className="px-4 py-3">
          <h2 className="mb-2 text-[0.8125rem] font-semibold text-foreground">{k.pricing.fees}</h2>
          {feesQ.isLoading ? (
            <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
          ) : fees.length === 0 ? (
            <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.pricing.feesEmpty}</p>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-(--ui-stroke-secondary)">
                  {(['id', 'name', 'code', 'rate', 'active'] as const).map(h => (
                    <th className={TABLE_HEAD} key={h}>
                      {k.pricing.feeHeaders[h]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                    <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{fee.id}</td>
                    <td className="px-4 py-1.5 text-[0.75rem] text-foreground">{fee.name ?? ''}</td>
                    <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">{fee.code ?? ''}</td>
                    <td className="px-4 py-1.5 tabular-nums text-[0.75rem] text-(--ui-text-secondary)">{fee.rate ?? ''}</td>
                    <td className="px-4 py-1.5 text-[0.75rem] text-(--ui-text-secondary)">
                      {fee.active === true ? '✓' : fee.active === false ? '—' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  )
}

function ProfileUpdateForm({
  k,
  profile,
  onDone
}: {
  k: CEODIGITALText
  profile: PricingProfileRow
  onDone: () => void
}) {
  const [updating, setUpdating] = useState(false)
  const [name, setName] = useState('')
  const [defaultRate, setDefaultRate] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  const begin = () => {
    setName(profile.name ?? '')
    setDefaultRate(profile.default_rate !== null && profile.default_rate !== undefined ? String(profile.default_rate) : '')
    setDescription(profile.description ?? '')
    setIsActive(profile.is_active !== false)
    setUpdating(v => !v)
    setActionError(null)
  }

  const updateMut = useMutation({
    mutationFn: () =>
      updatePricingProfile(profile.id, {
        name: name.trim() || undefined,
        defaultRate: defaultRate.trim() !== '' ? Number(defaultRate) : undefined,
        description: description.trim() || null,
        isActive: isActive || undefined
      }),
    onSuccess: () => {
      setUpdating(false)
      onDone()
    },
    onError: err => setActionError(pricingErrorCode(err) ?? k.pricing.errors.update)
  })

  return (
    <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[0.8125rem] font-semibold text-foreground">
          {profile.code ?? ''} · {profile.name ?? ''}
        </h2>
        <button
          className="rounded-md border border-(--ui-stroke-secondary) px-2.5 py-1 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={begin}
        >
          {updating ? k.pricing.updateForm.cancel : k.pricing.updateForm.update}
        </button>
      </div>
      {updating && (
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inp} flex-1`}
              maxLength={200}
              placeholder={k.pricing.updateForm.name}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className={`${inp} w-32`}
              inputMode="numeric"
              maxLength={3}
              placeholder={k.pricing.updateForm.defaultRate}
              value={defaultRate}
              onChange={e => setDefaultRate(e.target.value)}
            />
          </div>
          <input
            className={inp}
            maxLength={500}
            placeholder={k.pricing.updateForm.description}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <label className="flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
            <span>{k.pricing.updateForm.isActive}</span>
          </label>
          <button
            className="w-fit rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={updateMut.isPending}
            onClick={() => updateMut.mutate()}
          >
            {updateMut.isPending ? k.agents.runs.executing : k.pricing.updateForm.update}
          </button>
          {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
        </div>
      )}
    </section>
  )
}

function ExemptionsSection({
  k,
  exemptions,
  loading,
  onDone
}: {
  k: CEODIGITALText
  exemptions: ExemptionRow[]
  loading: boolean
  onDone: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [sourceType, setSourceType] = useState<ExemptionSourceType>('person')
  const [sourceId, setSourceId] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [exemptionType, setExemptionType] = useState<ExemptionType>('reverse_charge')
  const [reason, setReason] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const addMut = useMutation({
    mutationFn: () =>
      addPricingExemption({
        sourceType,
        sourceId: sourceId.trim(),
        vatNumber: vatNumber.trim() || undefined,
        exemptionType,
        reason: reason.trim() || undefined,
        validFrom: validFrom.trim() || undefined,
        validUntil: validUntil.trim() || null
      }),
    onSuccess: () => {
      setAdding(false)
      setSourceId('')
      setVatNumber('')
      setReason('')
      setValidFrom('')
      setValidUntil('')
      setActionError(null)
      onDone()
    },
    onError: err => setActionError(pricingErrorCode(err) ?? k.pricing.errors.addExemption)
  })

  return (
    <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[0.8125rem] font-semibold text-foreground">{k.pricing.exemptions}</h2>
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1 text-[0.75rem] font-medium text-white disabled:opacity-50"
            disabled={adding || addMut.isPending}
            onClick={() => setAdding(v => !v)}
          >
            {k.pricing.addExemption}
          </button>
        </div>
      </div>

      {adding && (
        <div className="mb-2 flex flex-col gap-2 rounded-md border border-(--ui-stroke-secondary) p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={inp}
              value={sourceType}
              onChange={e => setSourceType(e.target.value as ExemptionSourceType)}
            >
              {EXEMPTION_SOURCE_TYPES.map(s => (
                <option key={s} value={s}>
                  {k.pricing.sourceTypes[s] ?? s}
                </option>
              ))}
            </select>
            <input
              className={`${inp} min-w-0 flex-1`}
              placeholder={k.pricing.exemptionForm.sourceIdPlaceholder}
              value={sourceId}
              onChange={e => setSourceId(e.target.value)}
            />
            <input
              className={`${inp} w-40`}
              maxLength={40}
              placeholder={k.pricing.exemptionForm.vatNumber}
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className={inp}
              value={exemptionType}
              onChange={e => setExemptionType(e.target.value as ExemptionType)}
            >
              {EXEMPTION_TYPES.map(t => (
                <option key={t} value={t}>
                  {k.pricing.exemptionTypes[t] ?? t}
                </option>
              ))}
            </select>
            <input
              className={`${inp} flex-1`}
              maxLength={500}
              placeholder={k.pricing.exemptionForm.reasonPlaceholder}
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className={`${inp} w-48`}
              placeholder={k.pricing.exemptionForm.validFrom}
              value={validFrom}
              onChange={e => setValidFrom(e.target.value)}
            />
            <input
              className={`${inp} w-48`}
              placeholder={k.pricing.exemptionForm.validUntil}
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>
          {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
          <div className="flex items-center gap-2">
            <button
              className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
              disabled={addMut.isPending || !sourceId.trim()}
              onClick={() => addMut.mutate()}
            >
              {addMut.isPending ? k.agents.runs.executing : k.pricing.exemptionForm.add}
            </button>
            <button
              className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
              type="button"
              onClick={() => {
                setAdding(false)
                setActionError(null)
              }}
            >
              {k.pricing.exemptionForm.cancel}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
      ) : exemptions.length === 0 ? (
        <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.pricing.exemptionsEmpty}</p>
      ) : (
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-(--ui-stroke-secondary)">
              {(['id', 'source', 'vat', 'type', 'reason'] as const).map(h => (
                <th className={TABLE_HEAD} key={h}>
                  {k.pricing.exemptionHeaders[h]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {exemptions.map(exemption => (
              <tr key={exemption.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">
                  {exemption.id}
                </td>
                <td className="px-4 py-1.5 text-[0.75rem] text-(--ui-text-secondary)">
                  {exemption.source_type ?? ''}
                  <span className="ml-1 font-mono text-[0.625rem] text-(--ui-text-tertiary)">
                    {exemption.source_id ?? ''}
                  </span>
                </td>
                <td className="px-4 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">
                  {exemption.vat_number ?? ''}
                </td>
                <td className="px-4 py-1.5 text-[0.75rem] text-(--ui-text-secondary)">
                  {exemption.exemption_type
                    ? (k.pricing.exemptionTypes[exemption.exemption_type as ExemptionType] ??
                      exemption.exemption_type)
                    : ''}
                </td>
                <td className="px-4 py-1.5 text-[0.75rem] text-(--ui-text-secondary)">{exemption.reason ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}