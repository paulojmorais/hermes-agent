/**
 * CEODigital Collections page (W5) — the tenant's document collections, all
 * proxied via `/api/plugins/ceodigital/documents/*` (MCP `documents.*`):
 *   * list    (GET /documents/collections)
 *   * create  (POST /documents/collections {name, description?, color?, icon?, parentId?})
 *   * members (GET /documents/files?collectionId={id})
 *   * add     (POST /documents/collections/{id}/add_file {fileId})
 *   * remove  (POST /documents/collections/{id}/remove_file {fileId})
 *
 * Each collection expands to manage its member files: pick any library file to
 * add, and remove members inline. Mutations invalidate both the collections
 * and the files keys (a file's membership is visible in both surfaces).
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useState } from 'react'

import {
  COLLECTIONS_KEY,
  createCollection,
  fetchCollections,
  fetchFiles,
  FILES_KEY,
  removeFileFromCollection,
  addFileToCollection
} from '../api'
import { useCeodigital } from '../i18n'
import type { CeodigitalErrorCode, CollectionRow, FileRow } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function collectionsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

export function CollectionsPage() {
  const k = useCeodigital()
  const qc = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('')
  const [icon, setIcon] = useState('')
  const [parentId, setParentId] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Expand a collection to manage its member files.
  const [openId, setOpenId] = useState<string | null>(null)
  const [addFileId, setAddFileId] = useState('')

  const listQ = useQuery({
    queryKey: COLLECTIONS_KEY,
    queryFn: fetchCollections
  })

  // All files — used for the add-file picker.
  const filesQ = useQuery({
    queryKey: FILES_KEY,
    queryFn: () => fetchFiles(),
    enabled: !!openId
  })

  // Member files of the expanded collection.
  const memberQ = useQuery({
    queryKey: [...FILES_KEY, { collectionId: openId ?? null }],
    queryFn: () => fetchFiles({ collectionId: openId ?? undefined }),
    enabled: !!openId
  })

  const { code, rows } = (() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { collections: CollectionRow[] }).collections }
    }
    return { code: collectionsErrorCode(listQ.error), rows: [] as CollectionRow[] }
  })()

  const allFiles: FileRow[] = isOk(filesQ.data) ? (filesQ.data as { files: FileRow[] }).files : []
  const members: FileRow[] = isOk(memberQ.data) ? (memberQ.data as { files: FileRow[] }).files : []
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

  const resetForm = () => {
    setName(''); setDescription(''); setColor(''); setIcon(''); setParentId('')
    setActionError(null)
  }

  const createMut = useMutation({
    mutationFn: () =>
      createCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        color: color.trim() || undefined,
        icon: icon.trim() || undefined,
        parentId: parentId.trim() || undefined
      }),
    onSuccess: () => {
      setCreating(false)
      resetForm()
      void qc.invalidateQueries({ queryKey: COLLECTIONS_KEY })
    },
    onError: err => setActionError(collectionsErrorCode(err) ?? k.documents.collections.errors.create)
  })

  const addMut = useMutation({
    mutationFn: ({ cid, fid }: { cid: string; fid: string }) => addFileToCollection(cid, fid),
    onSuccess: () => {
      setAddFileId('')
      void qc.invalidateQueries({ queryKey: [FILES_KEY[0], FILES_KEY[1], FILES_KEY[2], openId ?? ''] as unknown[] })
      void qc.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void qc.invalidateQueries({ queryKey: FILES_KEY })
    },
    onError: err => setActionError(collectionsErrorCode(err) ?? k.documents.collections.errors.addFile)
  })

  const removeMut = useMutation({
    mutationFn: ({ cid, fid }: { cid: string; fid: string }) => removeFileFromCollection(cid, fid),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [FILES_KEY[0], FILES_KEY[1], FILES_KEY[2], openId ?? ''] as unknown[] })
      void qc.invalidateQueries({ queryKey: COLLECTIONS_KEY })
      void qc.invalidateQueries({ queryKey: FILES_KEY })
    },
    onError: err => setActionError(collectionsErrorCode(err) ?? k.documents.collections.errors.removeFile)
  })

  const toggleOpen = (id: string) => {
    setActionError(null)
    setAddFileId('')
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.documents.collections.title}</h1>
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
            {k.documents.collections.new}
          </button>
        </div>
      </header>

      {creating && (
        <form
          className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3"
          onSubmit={e => {
            e.preventDefault()
            if (!createMut.isPending) createMut.mutate()
          }}
        >
          <div className="flex flex-col gap-2">
            <input
              className={inp}
              placeholder={k.documents.collections.createForm.namePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input
              className={inp}
              placeholder={k.documents.collections.createForm.description}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.collections.createForm.color}
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.collections.createForm.icon}
                value={icon}
                onChange={e => setIcon(e.target.value)}
              />
              <input
                className={`${inp} flex-1`}
                placeholder={k.documents.collections.createForm.parentId}
                value={parentId}
                onChange={e => setParentId(e.target.value)}
              />
            </div>
            {actionError && <p className="text-[0.75rem] text-red-500">{actionError}</p>}
            <div className="flex items-center gap-2">
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={createMut.isPending || !name.trim()}
                type="submit"
              >
                {createMut.isPending ? k.agents.runs.executing : k.documents.collections.createForm.create}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground"
                type="button"
                onClick={() => {
                  setCreating(false)
                  resetForm()
                }}
              >
                {k.documents.collections.createForm.cancel}
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
            <Codicon className="text-(--ui-text-quaternary)" name="library" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.documents.collections.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map(col => (
            <CollectionCard
              key={col.id}
              col={col}
              k={k}
              open={openId === col.id}
              onToggle={() => toggleOpen(col.id)}
              members={openId === col.id ? members : []}
              allFiles={allFiles}
              memberLoading={openId === col.id && memberQ.isLoading}
              addFileId={addFileId}
              setAddFileId={setAddFileId}
              addPending={addMut.isPending}
              removePending={removeMut.isPending}
              onAdd={() => addMut.mutate({ cid: col.id, fid: addFileId })}
              onRemove={fid => removeMut.mutate({ cid: col.id, fid })}
              onError={actionError}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionCard({
  col,
  k,
  open,
  onToggle,
  members,
  allFiles,
  memberLoading,
  addFileId,
  setAddFileId,
  addPending,
  removePending,
  onAdd,
  onRemove,
  onError
}: {
  col: CollectionRow
  k: ReturnType<typeof useCeodigital>
  open: boolean
  onToggle: () => void
  members: FileRow[]
  allFiles: FileRow[]
  memberLoading: boolean
  addFileId: string
  setAddFileId: (v: string) => void
  addPending: boolean
  removePending: boolean
  onAdd: () => void
  onRemove: (fileId: string) => void
  onError: string | null
}) {
  return (
    <div className="border-b border-(--ui-stroke-secondary)">
      <button className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-(--ui-bg-quaternary)" onClick={onToggle}>
        <Codicon
          className="text-(--ui-text-tertiary)"
          name={open ? 'chevron-down' : 'chevron-right'}
          size="1rem"
        />
        {col.icon && (
          <Codicon className="text-(--ui-text-tertiary)" name={col.icon as 'folder'} size="1.125rem" />
        )}
        <span className="flex-1">
          <span className="block text-[0.8125rem] font-medium text-foreground">{col.title}</span>
          {col.description && (
            <span className="block text-[0.6875rem] text-(--ui-text-secondary)">{col.description}</span>
          )}
        </span>
        <span className="font-mono text-[0.625rem] text-(--ui-text-tertiary) tabular-nums">{col.id}</span>
      </button>

      {open && (
        <div className="border-t border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary/40) px-4 py-2">
          <div className="flex flex-col gap-1.5">
            {memberLoading ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.agents.runs.executing}</p>
            ) : members.length === 0 ? (
              <p className="py-1 text-[0.75rem] text-(--ui-text-tertiary)">{k.documents.collections.noMembers}</p>
            ) : (
              members.map(m => (
                <div key={m.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[0.75rem] text-foreground">
                    {m.title}
                    <span className="ml-2 font-mono text-[0.625rem] text-(--ui-text-tertiary)">{m.id}</span>
                  </span>
                  <button
                    className="flex items-center gap-1 rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-red-500"
                    disabled={removePending}
                    onClick={() => onRemove(m.id)}
                  >
                    <Codicon className="text-(--ui-text-tertiary)" name="trash" size="0.875rem" />
                    {k.documents.collections.removeFile}
                  </button>
                </div>
              ))
            )}
            {onError && <p className="text-[0.75rem] text-red-500">{onError}</p>}
            <div className="flex items-center gap-2 pt-1">
              <select
                className={`${inp} min-w-0 flex-1`}
                value={addFileId}
                onChange={e => setAddFileId(e.target.value)}
              >
                <option value="">{k.documents.collections.addFilePlaceholder}</option>
                {allFiles.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={addPending || !addFileId}
                onClick={onAdd}
              >
                {addPending ? k.agents.runs.executing : k.documents.collections.addFile}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}