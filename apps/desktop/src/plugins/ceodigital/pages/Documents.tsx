/**
 * CEODigital Documents page (W5) — the tenant's file library + RAG search,
 * all proxied via `/api/plugins/ceodigital/documents/*` (MCP `documents.*`):
 *   * list    (GET /documents/files?search&collectionId&namespace&visibility&limit)
 *   * upload  (POST /documents/files/upload  {name, contentBase64, ...})
 *   * move    (POST /documents/files/{id}/move)
 *   * delete  (POST /documents/files/{id}/delete)
 *   * add-to-collection (POST /documents/collections/{id}/add_file)
 *   * RAG search (GET /documents/search?query&namespaces&maxResults)
 *   * reindex (POST /documents/reindex {namespace, fullReindex?})
 *
 * The list carries free-text / namespace / visibility filters; the upload form
 * is behind a toolbar toggle (file bytes → base64, optional namespace +
 * collection picker). Each row can expand into an inline confirm for move,
 * delete or add-to-collection, painting optimistically and rolling back on
 * error. The RAG panel searches the library and shows scored results/citations.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import type { UseMutationResult } from '@tanstack/react-query'
import { useRef, useState } from 'react'

import {
  addFileToCollection,
  COLLECTIONS_KEY,
  deleteFile,
  FILES_KEY,
  fetchCollections,
  fetchFiles,
  moveFile,
  reindexDocuments,
  SEARCH_KEY,
  searchDocuments,
  uploadFile
} from '../api'
import { useCeodigital } from '../i18n'
import type {
  CeodigitalErrorCode,
  CollectionRow,
  FileRow,
  SearchResultRow
} from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function documentsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

const inp =
  'rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.75rem] text-foreground placeholder:text-(--ui-text-tertiary)'

const VISIBILITIES = ['draft', 'internal', 'shared', 'public'] as const

type RowAction = 'move' | 'delete' | 'addToCollection'

export function DocumentsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [visibility, setVisibility] = useState('')
  const [namespaceFilter, setNamespaceFilter] = useState('')

  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileBytes, setFileBytes] = useState<File | null>(null)
  const [fileMime, setFileMime] = useState('')
  const [uploadNamespace, setUploadNamespace] = useState('')
  const [uploadCollection, setUploadCollection] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Expandable row action.
  const [actionFor, setActionFor] = useState<{ id: string; action: RowAction } | null>(null)
  const [moveNamespace, setMoveNamespace] = useState('')
  const [targetCollection, setTargetCollection] = useState('')

  // RAG panel.
  const [ragQuery, setRagQuery] = useState('')
  const [submittedRag, setSubmittedRag] = useState<{ query: string; maxResults: number } | null>(null)
  const [ragMaxResults, setRagMaxResults] = useState(10)
  const [reindexing, setReindexing] = useState(false)

  const listQ = useQuery({
    queryKey: [...FILES_KEY, { search, visibility, namespaceFilter }],
    queryFn: () =>
      fetchFiles({
        search: search.trim() || undefined,
        visibility: (visibility || undefined) as 'draft' | 'internal' | 'shared' | 'public' | undefined,
        namespace: namespaceFilter.trim() || undefined
      })
  })

  const collectionsQ = useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: fetchCollections
  })

  const collections = isOk(collectionsQ.data)
    ? (collectionsQ.data as { collections: CollectionRow[] }).collections
    : ([] as CollectionRow[])

  const ragQ = useQuery({
    queryKey: submittedRag ? [...SEARCH_KEY, submittedRag] : SEARCH_KEY,
    queryFn: () =>
      searchDocuments({ query: submittedRag?.query ?? '', maxResults: submittedRag?.maxResults }),
    enabled: !!submittedRag
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { files: FileRow[] }).files }
    }
    return { code: documentsErrorCode(listQ.error), rows: [] as FileRow[] }
  })()

  const ragRows: SearchResultRow[] = isOk(ragQ.data) ? (ragQ.data as { results: SearchResultRow[] }).results : []
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const uploadRef = useRef<HTMLInputElement>(null)

  const resetUpload = () => {
    setFileName(''); setFileBytes(null); setFileMime(''); setUploadNamespace(''); setUploadCollection('')
    setActionError(null)
    if (uploadRef.current) uploadRef.current.value = ''
  }

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!fileBytes) throw new Error('no_file')
      const contentBase64 = await fileToBase64(fileBytes)
      return uploadFile({
        name: fileName.trim() || fileBytes.name,
        contentBase64,
        mimeType: fileMime || undefined,
        namespace: uploadNamespace.trim() || undefined,
        collectionId: uploadCollection || undefined
      })
    },
    onSuccess: () => {
      setUploading(false)
      resetUpload()
      void qc.invalidateQueries({ queryKey: FILES_KEY })
    },
    onError: err => setActionError(documentsErrorCode(err) ?? k.documents.files.errors.upload)
  })

  const moveMut = useMutation({
    mutationFn: (id: string) => {
      const tc = targetCollection
      return moveFile(id, {
        targetNamespace: moveNamespace.trim() || undefined,
        // '' → unchanged (omit); '__none__' → null (leave the collection).
        targetCollectionId: !tc || tc === '__none__' ? (tc === '__none__' ? null : undefined) : tc
      })
    },
    onSuccess: (_d, id) => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: FILES_KEY })
      void qc.invalidateQueries({ queryKey: [FILES_KEY[0], FILES_KEY[1], FILES_KEY[2], id] as unknown[] })
    },
    onError: err => setActionError(documentsErrorCode(err) ?? k.documents.files.errors.move)
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: FILES_KEY })
    },
    onError: err => setActionError(documentsErrorCode(err) ?? k.documents.files.errors.delete)
  })

  const addToCollectionMut = useMutation({
    mutationFn: ({ cid, fid }: { cid: string; fid: string }) => addFileToCollection(cid, fid),
    onSuccess: () => {
      setActionFor(null)
      void qc.invalidateQueries({ queryKey: FILES_KEY })
      void qc.invalidateQueries({ queryKey: COLLECTIONS_KEY })
    },
    onError: err => setActionError(documentsErrorCode(err) ?? k.documents.files.errors.addToCollection)
  })

  const reindexMut = useMutation({
    mutationFn: () => reindexDocuments({ namespace: namespaceFilter.trim() || 'default', fullReindex: true }),
    onSuccess: () => setReindexing(false),
    onError: err => setActionError(documentsErrorCode(err) ?? k.documents.files.errors.reindex)
  })

  const openAction = (id: string, action: RowAction) => {
    setActionError(null)
    if (action === 'move') {
      setMoveNamespace('')
      setTargetCollection('')
    }
    if (action === 'addToCollection') setTargetCollection('')
    setActionFor({ id, action })
  }

  const submitAction = (row: FileRow) => {
    if (actionFor?.action === 'move') moveMut.mutate(row.id)
    else if (actionFor?.action === 'delete') deleteMut.mutate(row.id)
    else if (actionFor?.action === 'addToCollection' && targetCollection) {
      addToCollectionMut.mutate({ cid: targetCollection, fid: row.id })
    }
  }

  const busyId = (): string | null => {
    if (!actionFor) return null
    if (moveMut.isPending || deleteMut.isPending || addToCollectionMut.isPending) return actionFor.id
    return null
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.documents.files.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground disabled:opacity-50"
            disabled={reindexing || reindexMut.isPending}
            onClick={() => reindexMut.mutate()}
            title={k.documents.files.rag.reindex}
          >
            {reindexMut.isPending ? k.documents.files.rag.reindexing : k.documents.files.rag.reindex}
          </button>
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={uploading || uploadMut.isPending}
            onClick={() => setUploading(v => !v)}
          >
            {k.documents.files.upload}
          </button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.documents.files.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          className={`${inp} w-40`}
          placeholder={k.documents.files.namespacePlaceholder}
          value={namespaceFilter}
          onChange={e => setNamespaceFilter(e.target.value)}
        />
        <select
          className={`${inp} w-36`}
          value={visibility}
          onChange={e => setVisibility(e.target.value)}
        >
          <option value="">{k.documents.files.allVisibilities}</option>
          {VISIBILITIES.map(v => (
            <option key={v} value={v}>
              {k.documents.files.visibility}: {v}
            </option>
          ))}
        </select>
      </div>

      {uploading && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!uploadMut.isPending) uploadMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <input
              className={inp}
              placeholder={k.documents.files.uploadForm.namePlaceholder}
              value={fileName}
              onChange={e => setFileName(e.target.value)}
            />
            <input
              ref={uploadRef}
              className={inp}
              type="file"
              onChange={e => {
                const f = e.target.files?.[0] ?? null
                setFileBytes(f)
                setFileMime(f?.type ?? '')
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.files.uploadForm.namespace}
                value={uploadNamespace}
                onChange={e => setUploadNamespace(e.target.value)}
              />
              <select
                className={`${inp} flex-1`}
                value={uploadCollection}
                onChange={e => setUploadCollection(e.target.value)}
              >
                <option value="">{k.documents.files.uploadForm.collection}…</option>
                {collections.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={uploadMut.isPending || !fileBytes}
                type="submit"
              >
                {uploadMut.isPending ? k.agents.runs.executing : k.documents.files.uploadForm.submit}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setUploading(false)
                  resetUpload()
                }}
              >
                {k.documents.files.uploadForm.cancel}
              </button>
            </div>
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
            <p className="text-xs text-(--ui-text-tertiary)">{k.documents.files.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'namespace', 'visibility', 'mime', 'actions'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {h === 'actions' ? '' : k.documents.files.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <FileRows
                  key={row.id}
                  row={row}
                  k={k}
                  collections={collections}
                  active={actionFor}
                  busy={busyId()}
                  onAction={openAction}
                  onCancel={() => { setActionFor(null); setActionError(null) }}
                  onSubmit={() => submitAction(row)}
                  moveNamespace={moveNamespace}
                  setMoveNamespace={setMoveNamespace}
                  targetCollection={targetCollection}
                  setTargetCollection={setTargetCollection}
                  onError={actionError}
                  movePending={moveMut.isPending}
                  deletePending={deleteMut.isPending}
                  addPending={addToCollectionMut.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="shrink-0 border-t border-(--ui-stroke-secondary) px-4 py-3">
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={e => {
            e.preventDefault()
            if (ragQuery.trim()) setSubmittedRag({ query: ragQuery.trim(), maxResults: ragMaxResults })
          }}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="search" size="1rem" />
          <input
            className={`${inp} min-w-0 flex-1`}
            placeholder={k.documents.files.rag.placeholder}
            value={ragQuery}
            onChange={e => setRagQuery(e.target.value)}
          />
          <select
            className={`${inp} w-28`}
            value={ragMaxResults}
            onChange={e => setRagMaxResults(Number(e.target.value))}
          >
            {[5, 10, 15, 20].map(n => (
              <option key={n} value={n}>
                {k.documents.files.rag.maxResults}: {n}
              </option>
            ))}
          </select>
          <button
            className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
            disabled={ragQ.isFetching || !ragQuery.trim()}
            type="submit"
          >
            {ragQ.isFetching ? k.documents.files.rag.searching : k.documents.files.rag.search}
          </button>
        </form>
        {submittedRag &&
          (ragQ.isLoading ? (
            <div className="py-2 text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.files.rag.searching}</div>
          ) : ragRows.length === 0 ? (
            <div className="py-2 text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.files.rag.resultsEmpty}</div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {ragRows.map((r, i) => (
                <li key={r.id + '-' + i} className="flex items-start gap-2 rounded border border-(--ui-stroke-secondary) px-3 py-2">
                  <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">
                    {r.score != null ? r.score.toFixed(2) : ''}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[0.75rem] font-medium text-foreground">{r.title}</div>
                    {r.snippet && (
                      <div className="line-clamp-1 text-[0.6875rem] text-(--ui-text-secondary)">{r.snippet}</div>
                    )}
                    <div className="font-mono text-[0.625rem] text-(--ui-text-tertiary)">{r.id}</div>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}

function FileRows({
  row,
  k,
  collections,
  active,
  busy,
  onAction,
  onCancel,
  onSubmit,
  moveNamespace,
  setMoveNamespace,
  targetCollection,
  setTargetCollection,
  onError,
  movePending,
  deletePending,
  addPending
}: {
  row: FileRow
  k: ReturnType<typeof useCeodigital>
  collections: CollectionRow[]
  active: { id: string; action: RowAction } | null
  busy: string | null
  onAction: (id: string, action: RowAction) => void
  onCancel: () => void
  onSubmit: () => void
  moveNamespace: string
  setMoveNamespace: (v: string) => void
  targetCollection: string
  setTargetCollection: (v: string) => void
  onError: string | null
  movePending: boolean
  deletePending: boolean
  addPending: boolean
}) {
  const isActive = active?.id === row.id
  const isBusyRow = busy === row.id
  const action = active?.action

  return (
    <>
      <tr className="group border-b border-(--ui-stroke-secondary) last:border-0">
        <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
        <td className="px-4 py-2 text-[0.8125rem] text-foreground">{row.title}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.namespace ?? ''}</td>
        <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">{row.visibility ?? ''}</td>
        <td className="px-4 py-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{row.mime_type ?? row.mimeType ?? ''}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1.5">
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={k.documents.files.actions.move}
              onClick={() => onAction(row.id, 'move')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="arrow-right" size="0.875rem" />
              {k.documents.files.actions.move}
            </button>
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground"
              title={k.documents.files.actions.addToCollection}
              onClick={() => onAction(row.id, 'addToCollection')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="library" size="0.875rem" />
              {k.documents.files.actions.addToCollection}
            </button>
            <button
              className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
              title={k.documents.files.actions.delete}
              onClick={() => onAction(row.id, 'delete')}
            >
              <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
              {k.documents.files.actions.delete}
            </button>
          </div>
        </td>
      </tr>

      {isActive && (
        <tr className="border-b border-(--ui-stroke-secondary)">
          <td colSpan={6} className="bg-(--ui-bg-quaternary) px-4 py-2">
            {action === 'delete' ? (
              <div className="flex items-center gap-2">
                <span className="text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.files.actions.deleteConfirm}</span>
                <button
                  className="rounded-md bg-red-600 px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={isBusyRow}
                  onClick={onSubmit}
                >
                  {deletePending ? k.documents.files.actions.deleting : k.documents.files.actions.delete}
                </button>
                <button
                  className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                  disabled={isBusyRow}
                  onClick={onCancel}
                >
                  {k.documents.files.uploadForm.cancel}
                </button>
                {onError && <span className="text-[0.75rem] text-red-500">{onError}</span>}
              </div>
            ) : action === 'move' ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.files.moveForm.title}</span>
                <input
                  className={`${inp} w-44`}
                  placeholder={k.documents.files.moveForm.targetNamespace}
                  value={moveNamespace}
                  onChange={e => setMoveNamespace(e.target.value)}
                />
                <select
                  className={`${inp} w-48`}
                  value={targetCollection}
                  onChange={e => setTargetCollection(e.target.value)}
                >
                  <option value="">{k.documents.files.moveForm.targetCollection}…</option>
                  <option value="__none__">{k.documents.files.moveForm.none}</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={isBusyRow}
                  onClick={onSubmit}
                >
                  {movePending ? k.documents.files.actions.moving : k.documents.files.moveForm.submit}
                </button>
                <button
                  className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                  disabled={isBusyRow}
                  onClick={onCancel}
                >
                  {k.documents.files.uploadForm.cancel}
                </button>
                {onError && <span className="text-[0.75rem] text-red-500">{onError}</span>}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.75rem] text-(--ui-text-tertiary)">
                  {k.documents.files.addToCollectionForm.title}
                </span>
                <select
                  className={`${inp} w-48`}
                  value={targetCollection}
                  onChange={e => setTargetCollection(e.target.value)}
                >
                  <option value="">{k.documents.files.addToCollectionForm.collection}…</option>
                  {collections.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={isBusyRow || !targetCollection}
                  onClick={onSubmit}
                >
                  {addPending ? k.documents.files.actions.adding : k.documents.files.addToCollectionForm.submit}
                </button>
                <button
                  className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                  disabled={isBusyRow}
                  onClick={onCancel}
                >
                  {k.documents.files.uploadForm.cancel}
                </button>
                {onError && <span className="text-[0.75rem] text-red-500">{onError}</span>}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}