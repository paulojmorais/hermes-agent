/**
 * CEODigital Bindings page (W5) — entity document-bindings, all proxied via
 * `/api/plugins/ceodigital/documents/*` (MCP `documents.bindings.*`):
 *   * list   (GET /documents/bindings?entityType&entityId&direction&limit)
 *   * attach (POST /documents/bindings)
 *   * detach (POST /documents/bindings/{rowId}/detach)
 *
 * The list is filterable by entityType + entityId (both required) plus an
 * optional direction. The attach form maps 1:1 to the MCP input schema;
 * detach is an inline confirm per row.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import { attachBinding, BINDINGS_KEY, detachBinding, fetchBindings } from '../api'
import { useCeodigital } from '../i18n'
import type { BindingRow, CeodigitalErrorCode } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function bindingsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

const ENTITY_TYPES = ['project', 'task', 'crm_org', 'crm_deal', 'service_impl', 'chat_conv'] as const

export function BindingsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  // Filters — entityType + entityId required to list.
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [direction, setDirection] = useState('')
  const [searched, setSearched] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Attach form fields.
  const [attachOpen, setAttachOpen] = useState(false)
  const [aEntityType, setAEntityType] = useState('')
  const [aEntityId, setAEntityId] = useState('')
  const [aDirection, setADirection] = useState('input')
  const [aBindingId, setABindingId] = useState('')
  const [aTargetRef, setATargetRef] = useState('')
  const [aSyncMode, setASyncMode] = useState('')
  const [aPublishMode, setAPublishMode] = useState('')
  const [aRagIndex, setARagIndex] = useState(false)
  const [aOutputFormat, setAOutputFormat] = useState('')
  const [aNameTemplate, setANameTemplate] = useState('')

  // Detach confirm target.
  const [detachTarget, setDetachTarget] = useState<string | null>(null)

  const canList = entityType.trim() !== '' && entityId.trim() !== ''

  const listQ = useQuery({
    queryKey: [...BINDINGS_KEY, entityType, entityId, direction],
    queryFn: () =>
      fetchBindings({
        entityType: entityType.trim(),
        entityId: entityId.trim(),
        direction: direction || undefined,
        limit: 50
      }),
    enabled: searched && canList
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { bindings: BindingRow[] }).bindings }
    }
    return { code: bindingsErrorCode(listQ.error), rows: [] as BindingRow[] }
  })()

  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const resetAttach = () => {
    setAEntityType(entityType)
    setAEntityId(entityId)
    setADirection('input')
    setABindingId('')
    setATargetRef('')
    setASyncMode('')
    setAPublishMode('')
    setARagIndex(false)
    setAOutputFormat('')
    setANameTemplate('')
    setActionError(null)
  }

  const attachMut = useMutation({
    mutationFn: () => {
      let targetRef: Record<string, unknown> | undefined
      if (aTargetRef.trim()) {
        try {
          targetRef = JSON.parse(aTargetRef) as Record<string, unknown>
        } catch {
          throw new Error('invalid_target_ref')
        }
      }
      return attachBinding({
        entityType: aEntityType,
        entityId: aEntityId,
        direction: (aDirection || 'input') as 'input' | 'output',
        bindingId: aBindingId,
        targetRef,
        syncMode: (aSyncMode || undefined) as 'manual' | 'on_demand' | 'watch',
        publishMode: (aPublishMode || undefined) as 'manual' | 'auto' | 'on_approve',
        ragIndex: aRagIndex || undefined,
        outputFormat: (aOutputFormat || undefined) as 'pdf' | 'docx' | 'xlsx' | 'page' | 'md',
        nameTemplate: aNameTemplate.trim() || undefined
      })
    },
    onSuccess: () => {
      setAttachOpen(false)
      resetAttach()
      if (canList) void qc.invalidateQueries({ queryKey: BINDINGS_KEY })
    },
    onError: err => {
      if (err instanceof Error && err.message === 'invalid_target_ref') {
        setActionError(k.documents.bindings.errors.attach)
      } else {
        setActionError(bindingsErrorCode(err) ?? k.documents.bindings.errors.attach)
      }
    }
  })

  const detachMut = useMutation({
    mutationFn: (rowId: string) => detachBinding(rowId),
    onSuccess: () => {
      setDetachTarget(null)
      if (searched) void qc.invalidateQueries({ queryKey: BINDINGS_KEY })
    },
    onError: err => setActionError(bindingsErrorCode(err) ?? k.documents.bindings.errors.detach)
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.documents.bindings.title}</h1>
        {searched && rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto">
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={attachOpen || attachMut.isPending}
            onClick={() => {
              resetAttach()
              setAttachOpen(v => !v)
            }}
          >
            {k.documents.bindings.attach}
          </button>
        </div>
      </header>

      <form
        className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2"
        onSubmit={e => {
          e.preventDefault()
          if (canList) {
            setSearched(true)
            setActionError(null)
          }
        }}
      >
        <select className={`${inp} w-40`} value={entityType} onChange={e => setEntityType(e.target.value)}>
          <option value="">{k.documents.bindings.entityType}…</option>
          {ENTITY_TYPES.map(t => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.documents.bindings.entityIdPlaceholder}
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
        />
        <select className={`${inp} w-36`} value={direction} onChange={e => setDirection(e.target.value)}>
          <option value="">{k.documents.bindings.allDirections}</option>
          <option value="input">{k.documents.bindings.input}</option>
          <option value="output">{k.documents.bindings.output}</option>
        </select>
        <button
          className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
          disabled={!canList}
          type="submit"
        >
          {listQ.isFetching && isOk(listQ.data) ? k.agents.runs.executing : k.documents.files.rag.search}
        </button>
      </form>

      {attachOpen && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!attachMut.isPending) attachMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${inp} w-40`}
                value={aEntityType}
                onChange={e => setAEntityType(e.target.value)}
              >
                <option value="">{k.documents.bindings.attachForm.entityType}</option>
                {ENTITY_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.bindings.attachForm.entityIdPlaceholder}
                value={aEntityId}
                onChange={e => setAEntityId(e.target.value)}
              />
              <select
                className={`${inp} w-32`}
                value={aDirection}
                onChange={e => setADirection(e.target.value)}
              >
                <option value="input">{k.documents.bindings.input}</option>
                <option value="output">{k.documents.bindings.output}</option>
              </select>
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.bindings.attachForm.bindingIdPlaceholder}
                value={aBindingId}
                onChange={e => setABindingId(e.target.value)}
              />
            </div>
            <input
              className={inp}
              placeholder={k.documents.bindings.attachForm.targetRef}
              value={aTargetRef}
              onChange={e => setATargetRef(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${inp} w-40`}
                value={aSyncMode}
                onChange={e => setASyncMode(e.target.value)}
              >
                <option value="">{k.documents.bindings.attachForm.syncMode}: {k.documents.bindings.allDirections}</option>
                <option value="manual">manual</option>
                <option value="on_demand">on_demand</option>
                <option value="watch">watch</option>
              </select>
              <select
                className={`${inp} w-40`}
                value={aPublishMode}
                onChange={e => setAPublishMode(e.target.value)}
              >
                <option value="">{k.documents.bindings.attachForm.publishMode}: {k.documents.bindings.allDirections}</option>
                <option value="manual">manual</option>
                <option value="auto">auto</option>
                <option value="on_approve">on_approve</option>
              </select>
              <select
                className={`${inp} w-40`}
                value={aOutputFormat}
                onChange={e => setAOutputFormat(e.target.value)}
              >
                <option value="">{k.documents.bindings.attachForm.outputFormat}: {k.documents.bindings.allDirections}</option>
                <option value="pdf">pdf</option>
                <option value="docx">docx</option>
                <option value="xlsx">xlsx</option>
                <option value="page">page</option>
                <option value="md">md</option>
              </select>
              <label className="flex items-center gap-1.5 text-[0.75rem] text-(--ui-text-secondary)">
                <input type="checkbox" checked={aRagIndex} onChange={e => setARagIndex(e.target.checked)} />
                {k.documents.bindings.attachForm.ragIndex}
              </label>
            </div>
            <input
              className={inp}
              placeholder={k.documents.bindings.attachForm.nameTemplate}
              value={aNameTemplate}
              onChange={e => setANameTemplate(e.target.value)}
            />
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={
                  attachMut.isPending ||
                  !aEntityType ||
                  !aEntityId.trim() ||
                  !aDirection ||
                  !aBindingId.trim()
                }
                type="submit"
              >
                {attachMut.isPending ? k.agents.runs.executing : k.documents.bindings.attachForm.submit}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setAttachOpen(false)
                  resetAttach()
                }}
              >
                {k.documents.bindings.attachForm.cancel}
              </button>
            </div>
          </div>
        </form>
      )}

      {!searched ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="link" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.documents.bindings.empty}</p>
          </div>
        </div>
      ) : listQ.isLoading ? (
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
            <Codicon className="text-(--ui-text-quaternary)" name="library" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.documents.bindings.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'entity', 'direction', 'binding', 'sync', 'publish', 'rag', 'output', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.documents.bindings.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <BindingRowDisplay
                  key={row.id}
                  row={row}
                  k={k}
                  detaching={detachMut.isPending && detachTarget === row.id}
                  confirm={detachTarget === row.id}
                  onAskDetach={() => {
                    setActionError(null)
                    setDetachTarget(row.id)
                  }}
                  onCancel={() => setDetachTarget(null)}
                  onConfirm={() => detachMut.mutate(row.id)}
                  onError={actionError}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BindingRowDisplay({
  row,
  k,
  detaching,
  confirm,
  onAskDetach,
  onCancel,
  onConfirm,
  onError
}: {
  row: BindingRow
  k: ReturnType<typeof useCeodigital>
  detaching: boolean
  confirm: boolean
  onAskDetach: () => void
  onCancel: () => void
  onConfirm: () => void
  onError: string | null
}) {
  return (
    <>
      <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
        <td className="px-4 py-2">
          <div className="text-[0.8125rem] text-foreground">{row.entityType ?? ''}</div>
          <div className="font-mono text-[0.625rem] text-(--ui-text-tertiary)">{row.entityId ?? ''}</div>
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
          {(row.direction ?? '') === 'input'
            ? k.documents.bindings.input
            : (row.direction ?? '') === 'output'
              ? k.documents.bindings.output
              : (row.direction ?? '')}
        </td>
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-secondary) tabular-nums">
          {row.bindingId ?? row.binding_id ?? ''}
        </td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.syncMode ?? ''}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.publishMode ?? ''}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.ragIndex ? '✓' : ''}</td>
        <td className="px-4 py-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{row.outputFormat ?? ''}</td>
        <td className="px-4 py-2">
          <button
            className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
            title={k.documents.bindings.detach}
            onClick={onAskDetach}
          >
            <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
            {k.documents.bindings.detach}
          </button>
        </td>
      </tr>
      {confirm && (
        <tr className="border-b border-(--ui-stroke-secondary)">
          <td colSpan={9} className="bg-(--ui-bg-quaternary) px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.bindings.detach}</span>
              <button
                className="rounded-md bg-red-600 px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={detaching}
                onClick={onConfirm}
              >
                {detaching ? k.documents.bindings.detaching : k.documents.bindings.detach}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                disabled={detaching}
                onClick={onCancel}
              >
                {k.documents.bindings.attachForm.cancel}
              </button>
              {onError && <span className="text-[0.75rem] text-red-500">{onError}</span>}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}