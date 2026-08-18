/**
 * CEODigital Implementations page (W6a) — the tenant's implementation projects
 * with status/search filters, a detail view (phases + files + messages) and the
 * full lifecycle, proxied via `/api/plugins/ceodigital/implementations`
 * (MCP `implementations.*`):
 *   * projects list   (GET /implementations/projects?status&search&clientVisible&limit)
 *   * project detail  (GET /implementations/projects/{id})
 *   * phases          (GET /implementations/projects/{id}/phases?status&limit)
 *   * change status   (POST /implementations/projects/{id}/status {status})
 *   * complete/cancel (POST /implementations/projects/{id}/complete | /cancel)
 *   * phase status    (POST /implementations/phases/{id}/status {status})
 *   * files           (GET /implementations/projects/{id}/files?limit)
 *   * messages        (POST /implementations/projects/{id}/messages {body})
 *
 * The list opens a detail view (same window, back restores the list). Mutations
 * show pending state, optimistically paint the cache, roll back on error; an
 * authoritative refetch wins on settle.
 */

import { Codicon, ErrorState, Loader, useMutation, useQuery, useQueryClient } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  cancelProject,
  changePhaseStatus,
  changeProjectStatus,
  completeProject,
  fetchImplementationProject,
  fetchImplementationProjects,
  fetchProjectFiles,
  fetchProjectPhases,
  implFilesKey,
  implPhasesKey,
  IMPL_PROJECTS_KEY,
  postProjectMessage
} from '../api'
import { useCeodigital, type CEODIGITALText } from '../i18n'
import type {
  CeodigitalErrorCode,
  ImplFileRow,
  ImplPhaseRow,
  ImplProjectRow,
  MessageRow,
  PhaseStatus,
  ProjectStatus
} from '../types'
import { PHASE_STATUSES, PROJECT_STATUSES } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

function implementationsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

type StatusFilter = 'all' | ProjectStatus

export function ImplementationsPage() {
  const k = useCeodigital()

  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [clientVisible, setClientVisible] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const listQ = useQuery({
    queryKey: [...IMPL_PROJECTS_KEY, status, search, clientVisible] as unknown[],
    queryFn: () =>
      fetchImplementationProjects({
        status: status === 'all' ? undefined : status,
        search: search.trim() || undefined,
        clientVisible: clientVisible || undefined
      })
  })

  const { code, rows } = useMemo(() => {
    if (isOk(listQ.data)) {
      return { code: null as CeodigitalErrorCode | null, rows: (listQ.data as { projects: ImplProjectRow[] }).projects }
    }
    return { code: implementationsErrorCode(listQ.error), rows: [] as ImplProjectRow[] }
  }, [listQ.data, listQ.error])

  if (selectedId) {
    return <ImplProjectDetail k={k} id={selectedId} onBack={() => setSelectedId(null)} />
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.implementations.title}</h1>
        {rows.length > 0 && (
          <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
            {rows.length}
          </span>
        )}
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-(--ui-stroke-secondary) px-4 py-2">
        <div className="flex items-center gap-1">
          {(['all', ...PROJECT_STATUSES] as const).map(s => (
            <button
              key={s}
              className={`rounded-md px-2 py-1 text-[0.6875rem] ${
                status === s ? 'bg-(--ui-bg-quaternary) text-foreground' : 'text-(--ui-text-tertiary) hover:text-foreground'
              }`}
              onClick={() => setStatus(s)}
            >
              {s === 'all' ? k.implementations.allStatuses : k.implementations.projectStatus[s]}
            </button>
          ))}
        </div>
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.implementations.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label className="flex cursor-pointer items-center gap-1 text-[0.75rem] text-(--ui-text-secondary)">
          <input
            type="checkbox"
            className="accent-(--ui-accent)"
            checked={clientVisible}
            onChange={e => setClientVisible(e.target.checked)}
          />
          {k.implementations.clientVisible}
        </label>
      </div>

      {listQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={code === null ? k.errors.fetch : k.errors[code]} />
        </div>
      ) : rows.length === 0 ? (
        <div className="grid flex-1 place-items-center px-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <Codicon className="text-(--ui-text-quaternary)" name="rocket" size="1.25rem" />
            <p className="text-xs text-(--ui-text-tertiary)">{k.implementations.empty}</p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-(--ui-stroke-secondary)">
                {(['id', 'title', 'status', 'clientVisible'] as const).map(h => (
                  <th
                    className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)"
                    key={h}
                  >
                    {k.implementations.headers[h]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="group cursor-pointer border-b border-(--ui-stroke-secondary) last:border-0 hover:bg-(--ui-bg-quaternary)"
                  onClick={() => setSelectedId(row.id)}
                >
                  <td className="px-4 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{row.id}</td>
                  <td className="px-4 py-2">
                    <div className="text-[0.8125rem] text-foreground">{row.title}</div>
                    {row.description && (
                      <div className="mt-0.5 line-clamp-1 max-w-prose text-[0.6875rem] text-(--ui-text-tertiary)">
                        {row.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {k.implementations.projectStatus[row.status as ProjectStatus] ?? row.status}
                  </td>
                  <td className="px-4 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                    {(row.client_visible ?? row.clientVisible) ? '✓' : ''}
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

function ImplProjectDetail({ k, id, onBack }: { k: CEODIGITALText; id: string; onBack: () => void }) {
  const qc = useQueryClient()
  const [actionError, setActionError] = useState<string | null>(null)

  const detailQ = useQuery({ queryKey: [...IMPL_PROJECTS_KEY, id], queryFn: () => fetchImplementationProject(id) })

  const project = isOk(detailQ.data) ? (detailQ.data as { project: ImplProjectRow }).project : null

  const refreshProject = () => {
    void qc.invalidateQueries({ queryKey: [...IMPL_PROJECTS_KEY, id] })
    void qc.invalidateQueries({ queryKey: IMPL_PROJECTS_KEY })
  }

  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const statusMut = useMutation({
    mutationFn: () => {
      if (!status) return Promise.reject(new Error('status_required'))
      return changeProjectStatus(id, status)
    },
    onSuccess: () => setStatus(''),
    onError: err => setActionError(implementationsErrorCode(err) ?? k.implementations.errors.changeStatus),
    onSettled: refreshProject
  })

  const completeMut = useMutation({
    mutationFn: () => completeProject(id),
    onError: err => setActionError(implementationsErrorCode(err) ?? k.implementations.errors.complete),
    onSettled: refreshProject
  })

  const cancelMut = useMutation({
    mutationFn: () => cancelProject(id),
    onError: err => setActionError(implementationsErrorCode(err) ?? k.implementations.errors.cancel),
    onSettled: refreshProject
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <button
          className="flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) px-2 py-1 text-[0.75rem] text-(--ui-text-secondary) hover:text-foreground"
          onClick={onBack}
        >
          <Codicon className="text-(--ui-text-tertiary)" name="arrow-left" size="0.875rem" />
          {k.implementations.back}
        </button>
        <h1 className="text-sm font-semibold text-foreground">{k.implementations.detail}</h1>
      </header>

      {detailQ.isLoading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : !project ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.implementations.errors.fetchProject} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="shrink-0 border-b border-(--ui-stroke-secondary) px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-foreground">{project.title}</div>
              <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5 text-[0.75rem] text-(--ui-text-secondary)">
                {k.implementations.projectStatus[project.status as ProjectStatus] ?? project.status}
              </span>
              {(project.client_visible ?? project.clientVisible) && (
                <span className="rounded-full bg-(--ui-bg-quaternary) px-2 py-0.5 text-[0.75rem] text-(--ui-text-secondary)">
                  {k.implementations.clientVisible}
                </span>
              )}
            </div>
            {project.description && (
              <div className="mt-1 text-[0.8125rem] text-(--ui-text-secondary)">{project.description}</div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                className={`${inp}`}
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus | '')}
              >
                <option value="">{k.implementations.changeStatus}</option>
                {PROJECT_STATUSES.map(s => (
                  <option key={s} value={s}>
                    {k.implementations.projectStatus[s]}
                  </option>
                ))}
              </select>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={statusMut.isPending || !status}
                onClick={() => statusMut.mutate()}
              >
                {statusMut.isPending ? k.agents.runs.executing : k.implementations.changeStatus}
              </button>
              <button
                className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                disabled={completeMut.isPending}
                onClick={() => completeMut.mutate()}
              >
                {completeMut.isPending ? k.implementations.completing : k.implementations.complete}
              </button>
              <button
                className="rounded-md border border-(--ui-stroke-secondary) px-3 py-1.5 text-[0.8125rem] text-foreground disabled:opacity-50"
                disabled={cancelMut.isPending}
                onClick={() => cancelMut.mutate()}
              >
                {cancelMut.isPending ? k.implementations.cancelling : k.implementations.cancel}
              </button>
              {actionError && <span className="text-[0.75rem] text-red-500">{actionError}</span>}
            </div>
          </div>

          <ProjectMessages k={k} projectId={project.id} initialMessages={project.messages} />
          <ProjectPhases k={k} projectId={project.id} />
          <ProjectFiles k={k} projectId={project.id} />
        </div>
      )}
    </div>
  )
}

function ProjectPhases({ k, projectId }: { k: CEODIGITALText; projectId: string }) {
  const qc = useQueryClient()
  const [phaseStatus, setPhaseStatus] = useState<Record<string, PhaseStatus | ''>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const phasesQ = useQuery({
    queryKey: implPhasesKey(projectId),
    queryFn: () => fetchProjectPhases(projectId)
  })

  const phases = isOk(phasesQ.data) ? (phasesQ.data as { phases: ImplPhaseRow[] }).phases : []

  const changeMut = useMutation({
    mutationFn: (phase: ImplPhaseRow) => {
      const next = phaseStatus[phase.id]
      if (!next) return Promise.reject(new Error('status_required'))
      return changePhaseStatus(phase.id, next)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: implPhasesKey(projectId) })
    },
    onError: err => setActionError(implementationsErrorCode(err) ?? k.implementations.errors.changePhaseStatus)
  })

  return (
    <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
      <h2 className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">{k.implementations.phases}</h2>
      {actionError && <p className="mt-1 text-[0.75rem] text-red-500">{actionError}</p>}
      {phasesQ.isLoading ? (
        <div className="grid place-items-center py-4">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : phases.length === 0 ? (
        <p className="py-2 text-xs text-(--ui-text-tertiary)">{k.implementations.phasesEmpty}</p>
      ) : (
        <table className="mt-1 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-(--ui-stroke-secondary)">
              {(['id', 'title', 'status'] as const).map(h => (
                <th className="px-2 py-1 text-[0.625rem] font-medium text-(--ui-text-tertiary)" key={h}>
                  {k.implementations.phaseHeaders[h]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {phases.map(phase => (
              <tr key={phase.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                <td className="px-2 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{phase.id}</td>
                <td className="px-2 py-1.5 text-[0.8125rem] text-foreground">{phase.title}</td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      className={`${inp} w-32`}
                      value={phaseStatus[phase.id] ?? phase.status}
                      onChange={e => setPhaseStatus(p => ({ ...p, [phase.id]: e.target.value as PhaseStatus | '' }))}
                    >
                      {PHASE_STATUSES.map(s => (
                        <option key={s} value={s}>
                          {k.implementations.phaseStatus[s]}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded border border-(--ui-stroke-secondary) px-1.5 py-0.5 text-[0.6875rem] text-(--ui-text-secondary) hover:text-foreground disabled:opacity-50"
                      disabled={changeMut.isPending || !phaseStatus[phase.id]}
                      onClick={() => changeMut.mutate(phase)}
                    >
                      {k.implementations.changeStatus}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ProjectFiles({ k, projectId }: { k: CEODIGITALText; projectId: string }) {
  const filesQ = useQuery({ queryKey: implFilesKey(projectId), queryFn: () => fetchProjectFiles(projectId) })
  const files = isOk(filesQ.data) ? (filesQ.data as { files: ImplFileRow[] }).files : []

  return (
    <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
      <h2 className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">{k.implementations.files}</h2>
      {filesQ.isLoading ? (
        <div className="grid place-items-center py-4">
          <Loader type="lemniscate-bloom" />
        </div>
      ) : files.length === 0 ? (
        <p className="py-2 text-xs text-(--ui-text-tertiary)">{k.implementations.filesEmpty}</p>
      ) : (
        <table className="mt-1 w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-(--ui-stroke-secondary)">
              {(['id', 'name', 'size'] as const).map(h => (
                <th className="px-2 py-1 text-[0.625rem] font-medium text-(--ui-text-tertiary)" key={h}>
                  {k.implementations.fileHeaders[h]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map(file => (
              <tr key={file.id} className="border-b border-(--ui-stroke-secondary) last:border-0">
                <td className="px-2 py-1.5 font-mono text-[0.6875rem] text-(--ui-text-tertiary) tabular-nums">{file.id}</td>
                <td className="px-2 py-1.5 text-[0.8125rem] text-foreground">{file.title}</td>
                <td className="px-2 py-1.5 text-[0.75rem] text-(--ui-text-secondary) tabular-nums">
                  {file.size ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function ProjectMessages({
  k,
  projectId,
  initialMessages
}: {
  k: CEODIGITALText
  projectId: string
  initialMessages?: unknown
}) {
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  const messages = Array.isArray(initialMessages) ? (initialMessages as MessageRow[]) : []

  const postMut = useMutation({
    mutationFn: () => postProjectMessage(projectId, body.trim()),
    onSuccess: () => setBody(''),
    onError: err => setActionError(implementationsErrorCode(err) ?? k.implementations.errors.postMessage),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: [...IMPL_PROJECTS_KEY, projectId] })
    }
  })

  return (
    <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
      <h2 className="text-[0.6875rem] font-medium tracking-wide text-(--ui-text-tertiary)">{k.implementations.messages}</h2>
      {actionError && <p className="mt-1 text-[0.75rem] text-red-500">{actionError}</p>}
      {messages.length === 0 ? (
        <p className="py-2 text-xs text-(--ui-text-tertiary)">{k.implementations.messagesEmpty}</p>
      ) : (
        <div className="mt-1 divide-y divide-(--ui-stroke-secondary)">
          {messages.map(msg => (
            <div key={msg.id} className="py-1.5">
              <div className="text-[0.6875rem] text-(--ui-text-tertiary)">
                {msg.author_name ?? msg.sender_id ?? msg.id}
              </div>
              <div className="whitespace-pre-wrap text-[0.8125rem] text-foreground">{msg.body ?? ''}</div>
            </div>
          ))}
        </div>
      )}
      <form
        className="mt-2 flex flex-wrap items-center gap-2"
        onSubmit={e => {
          e.preventDefault()
          if (body.trim() && !postMut.isPending) postMut.mutate()
        }}
      >
        <input
          className={`${inp} min-w-0 flex-1`}
          placeholder={k.implementations.messagePlaceholder}
          value={body}
          onChange={e => setBody(e.target.value)}
        />
        <button
          className="rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
          disabled={postMut.isPending || !body.trim()}
          type="submit"
        >
          {postMut.isPending ? k.implementations.posting : k.implementations.postMessage}
        </button>
      </form>
    </section>
  )
}