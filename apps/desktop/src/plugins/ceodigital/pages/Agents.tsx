/**
 * Agents page (W5 + W5+) — read-only catalog + run + debrief:
 *   * CEO agent catalog (`/api/plugins/ceodigital/agents` → MCP agents.list)
 *   * Run an agent (`POST /agents/{slug}/ask` → MCP agent.<slug>.ask)
 *   * Run debrief (`GET /agents/runs{/id}` → MCP agent.runs.list/get)
 *   * NativeFlow workflows (`GET /agentflows` → agentflow.workflows.list)
 *
 * Only "ask" mutates; the rest is read-only. The renderer never holds MCP
 * credentials (the backend proxy keeps them server-side).
 */

import { Codicon, ErrorState, Loader, useQuery } from '@hermes/plugin-sdk'
import { useMemo, useState } from 'react'

import {
  AGENTFLOWS_KEY,
  AGENTS_KEY,
  askAgent,
  fetchAgentFlows,
  fetchAgents,
  fetchRun,
  fetchRuns,
  RUNS_KEY,
  runKey
} from '../api'
import { useCeodigital } from '../i18n'
import type { AgentAskResult, AgentRunRow, AgentRow, CeodigitalErrorCode } from '../types'

const KNOWN_CODES = ['mcp_not_configured', 'mcp_unreachable', 'tenant_not_found'] as const

function asKnownCode(code: string): CeodigitalErrorCode | null {
  return (KNOWN_CODES as readonly string[]).includes(code) ? (code as CeodigitalErrorCode) : null
}

export function agentsErrorCode(err: unknown): CeodigitalErrorCode | null {
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

/** Return `envelope[key]` as a list of unknown-row objects, when ok. */
function pickRows(data: unknown, key: string): Array<Record<string, unknown>> {
  if (!data || !isOk(data)) return []
  const rows = (data as { [k: string]: unknown })[key]
  return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : []
}

function asAgent(r: Record<string, unknown>): AgentRow {
  return r as unknown as AgentRow
}
function asRun(r: Record<string, unknown>): AgentRunRow {
  return r as unknown as AgentRunRow
}

function stepText(s: unknown): string {
  const d = s && typeof s === 'object' ? (s as Record<string, unknown>) : {}
  return String(d.text ?? d.content ?? d.tool_name ?? d.type ?? '') || '…'
}

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
}

export function AgentsPage() {
  const k = useCeodigital()
  const [selectedSlug, setSelectedSlug] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [askError, setAskError] = useState<string | null>(null)
  const [lastRun, setLastRun] = useState<AgentAskResult | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const agentsQ = useQuery({ queryKey: AGENTS_KEY, queryFn: fetchAgents as () => Promise<unknown> })
  const flowsQ = useQuery({ queryKey: AGENTFLOWS_KEY, queryFn: fetchAgentFlows as () => Promise<unknown> })
  const runsQ = useQuery({ queryKey: RUNS_KEY, queryFn: fetchRuns as () => Promise<unknown> })

  const { code, agents, flows, runs } = useMemo(() => {
    const agents = pickRows(agentsQ.data, 'agents').map(asAgent)
    const flows = pickRows(flowsQ.data, 'workflows')
    const runs = pickRows(runsQ.data, 'runs').map(asRun)
    const failure =
      agentsErrorCode(agentsQ.error) ?? agentsErrorCode(flowsQ.error) ?? agentsErrorCode(runsQ.error)
    const anyData = agents.length || flows.length || runs.length
    return { code: anyData ? null : failure, agents, flows, runs }
  }, [agentsQ.data, agentsQ.error, flowsQ.data, flowsQ.error, runsQ.data, runsQ.error])

  // Lazy detail fetch for the expanded run row.
  const expandedDetailQ = useQuery({
    queryKey: expandedRun ? runKey(expandedRun) : ['ceodigital', 'run-none'],
    queryFn: expandedRun ? (() => fetchRun(expandedRun) as Promise<unknown>) : undefined,
    enabled: !!expandedRun
  })

  const loading = agentsQ.isLoading || flowsQ.isLoading || runsQ.isLoading
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]
  const activeSlug = selectedSlug || agents[0]?.slug || ''

  async function runSelected() {
    const slug = activeSlug
    if (!slug || !prompt.trim() || running) return
    setRunning(true)
    setAskError(null)
    try {
      const res = await askAgent(slug, prompt.trim())
      if (res && 'ok' in res && res.ok) {
        setLastRun(res.run)
        setPrompt('')
        setSelectedSlug(slug)
      } else {
        setAskError(
          (res && 'error' in res && typeof res.error === 'string' && res.error) || k.errors.fetch
        )
      }
    } catch (err) {
      setAskError(agentsErrorCode(err) ?? k.errors.fetch)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-(--ui-surface-background)">
      <header className="flex shrink-0 flex-wrap items-center gap-2 px-4 py-2">
        <h1 className="text-sm font-semibold text-foreground">{k.agents.title}</h1>
        <span className="rounded-full bg-(--ui-bg-quaternary) px-1.5 py-px text-[0.625rem] tabular-nums text-(--ui-text-tertiary)">
          {agents.length}
        </span>
      </header>

      {loading ? (
        <div className="grid flex-1 place-items-center">
          <Loader type="active" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={k.errors[code]} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* Run panel */}
          <section className="border-b border-(--ui-stroke-secondary) px-4 py-3">
            <h2 className="text-[0.6875rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
              {k.agents.runs.runBtn}
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <select
                  className="w-max min-w-[10rem] rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground"
                  aria-label={k.agents.title}
                  value={activeSlug}
                  disabled={running || agents.length === 0}
                  onChange={e => setSelectedSlug(e.target.value)}
                >
                  {agents.map(a => (
                    <option key={a.id ?? a.slug} value={a.slug}>
                      {a.name ?? a.slug}
                    </option>
                  ))}
                </select>
                <input
                  className="min-w-0 flex-1 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-surface-background) px-2 py-1.5 text-[0.8125rem] text-foreground placeholder:text-(--ui-text-tertiary)"
                  placeholder={k.agents.runs.promptPlaceholder}
                  value={prompt}
                  disabled={running}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && prompt.trim()) void runSelected()
                  }}
                />
                <button
                  className="shrink-0 rounded-md bg-(--ui-accent) px-3 py-1.5 text-[0.8125rem] font-medium text-white disabled:opacity-50"
                  disabled={running || !prompt.trim() || agents.length === 0}
                  onClick={() => void runSelected()}
                >
                  {running ? k.agents.runs.executing : k.agents.runs.runBtn}
                </button>
              </div>
              {askError && <p className="text-[0.75rem] text-red-500">{askError}</p>}
              {lastRun && <RunBanner run={lastRun} k={k} />}
            </div>
          </section>

          {/* CEO agents catalog */}
          <section className="py-2">
            <SectionTitle icon="hubot" title={k.agents.title} />
            {agents.length === 0 ? (
              <p className="px-4 pb-2 text-xs text-(--ui-text-tertiary)">{k.agents.empty}</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-(--ui-stroke-secondary)">
                    {(['name', 'slug', 'status', 'exposed'] as const).map(h => (
                      <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                        {k.agents.headers[h]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr className="border-b border-(--ui-stroke-secondary) last:border-0" key={a.id ?? a.slug}>
                      <td className="px-3 py-2 text-[0.8125rem] font-medium text-foreground">{a.name ?? a.slug}</td>
                      <td className="px-3 py-2 font-mono text-[0.6875rem] text-(--ui-text-tertiary)">{a.slug}</td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                        {a.is_active ? <span className="text-green-500">● {a.status ?? 'active'}</span> : <span>—</span>}
                      </td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                        {a.exposed_as_mcp_tool ? '✅' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Run debrief */}
          <section className="py-2">
            <SectionTitle icon="play" title={k.agents.runs.title} />
            {runs.length === 0 ? (
              <p className="px-4 pb-2 text-xs text-(--ui-text-tertiary)">{k.agents.runs.empty}</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-(--ui-stroke-secondary)">
                    {(['id', 'status', 'started'] as const).map(h => (
                      <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                        {k.agents.runs.headers[h]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <RunRow
                      key={r.id}
                      run={r}
                      expanded={expandedRun === r.id}
                      steps={expandedRun === r.id ? expandedSteps(expandedDetailQ.data) : []}
                      onToggle={() => setExpandedRun(expandedRun === r.id ? null : r.id)}
                      k={k}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* NativeFlows */}
          <section className="py-2">
            <SectionTitle icon="workflow" title={k.agents.workflows.title} />
            {flows.length === 0 ? (
              <p className="px-4 pb-2 text-xs text-(--ui-text-tertiary)">{k.agents.workflows.empty}</p>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-(--ui-stroke-secondary)">
                    {(['name', 'status', 'trigger'] as const).map(h => (
                      <th className="px-4 py-1.5 text-[0.625rem] font-medium tracking-wide text-(--ui-text-tertiary)" key={h}>
                        {k.agents.workflows.headers[h]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flows.map(f => (
                    <tr className="border-b border-(--ui-stroke-secondary) last:border-0" key={f.id}>
                      <td className="px-3 py-2 text-[0.8125rem] text-foreground">{String(f.name ?? '')}</td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">{String(f.status ?? '')}</td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">
                        {f.trigger_type ? String(f.trigger_type) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

/** Extract `run.steps[]` from an expanded run detail envelope. */
function expandedSteps(data: unknown): unknown[] {
  if (!data || !isOk(data)) return []
  const d = data as { run?: { steps?: unknown[] } }
  return Array.isArray(d.run?.steps) ? d.run.steps : []
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5">
      <Codicon className="text-(--ui-text-tertiary)" name={icon} size="0.9375rem" />
      <h2 className="text-[0.6875rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">{title}</h2>
    </div>
  )
}

function runStatusColor(status?: string): string {
  if (status === 'completed') return 'text-green-500'
  if (status === 'failed' || status === 'cancelled') return 'text-red-500'
  if (status === 'paused' || status === 'waiting_approval') return 'text-amber-500'
  return 'text-(--ui-text-secondary)'
}

function RunBanner({ run, k }: { run: AgentAskResult; k: ReturnType<typeof useCeodigital> }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) p-2 text-[0.75rem]">
      <span className={`font-mono text-[0.675rem] ${runStatusColor(run.status)}`}>
        {run.status === 'paused' ? k.agents.runs.runPaused : String(run.status ?? '')}
      </span>
      {run.response_text && (
        <p className="whitespace-pre-wrap text-[0.75rem] text-(--ui-text-secondary)">{run.response_text}</p>
      )}
      {run.error && (
        <p className="text-[0.7rem] text-red-400">{run.error}</p>
      )}
    </div>
  )
}

function RunRow({
  run,
  expanded,
  steps,
  onToggle,
  k
}: {
  run: AgentRunRow
  expanded: boolean
  steps: unknown[]
  onToggle: () => void
  k: ReturnType<typeof useCeodigital>
}) {
  return (
    <tr className="border-b border-(--ui-stroke-secondary) last:border-0">
      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">
        <button className="mr-1 shrink-0 text-(--ui-text-tertiary)" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? '▾' : '▸'}
        </button>
        {run.id}
      </td>
      <td className={`px-3 py-2 text-[0.75rem] ${runStatusColor(run.status)}`}>{run.status}</td>
      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-tertiary)">{fmtDate(run.started_at)}</td>
      {expanded && (
        <td colSpan={3} className="px-4 py-2">
          <div className="rounded-md border border-(--ui-stroke-secondary) bg-(--ui-bg-quaternary) p-2">
            <p className="mb-1 text-[0.625rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
              {k.agents.runs.steps}
            </p>
            {steps.length === 0 ? (
              <span className="text-[0.7rem] text-(--ui-text-tertiary)">—</span>
            ) : (
              <ol className="ml-3 list-decimal space-y-0.5 text-[0.7rem] text-(--ui-text-secondary)">
                {steps.map((s, i) => (
                  <li key={i}>{stepText(s)}</li>
                ))}
              </ol>
            )}
          </div>
        </td>
      )}
    </tr>
  )
}