/**
 * Agents page (W5) — read-only view of the tenant's:
 *   * CEO agents catalog (`/api/plugins/ceodigital/agents` → MCP agents.list)
 *   * NativeFlow workflows (`/api/plugins/ceodigital/agentflows` → MCP
 *     agentflow.workflows.list)
 *
 * Shares the typed failure-code handling with the CRM/Projects pages. No
 * mutations, no forms (that's a later wave).
 */

import { Codicon, ErrorState, Loader, useQuery } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import { AGENTFLOWS_KEY, AGENTS_KEY, fetchAgentFlows, fetchAgents } from '../api'
import { useCeodigital } from '../i18n'
import type {
  AgentFlowRow,
  AgentRow,
  AgentFlowsResponse,
  AgentsResponse,
  CeodigitalErrorCode
} from '../types'

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

function isOk<T extends { ok: unknown }>(data: unknown): data is T {
  return !!data && typeof data === 'object' && (data as { ok?: unknown }).ok === true
}

function rowsOf(data: unknown): AgentRow[] {
  return data && isOk<AgentsResponse>(data) ? (data.agents ?? []) : []
}

function flowsOf(data: unknown): AgentFlowRow[] {
  return data && isOk<AgentFlowsResponse>(data) ? (data.workflows ?? []) : []
}

export function AgentsPage() {
  const k = useCeodigital()

  const agentsQ = useQuery({ queryKey: AGENTS_KEY, queryFn: fetchAgents as () => Promise<unknown> })
  const flowsQ = useQuery({ queryKey: AGENTFLOWS_KEY, queryFn: fetchAgentFlows as () => Promise<unknown> })

  const { code, agents, flows } = useMemo(() => {
    const agents = rowsOf(agentsQ.data)
    const flows = flowsOf(flowsQ.data)
    const failure = agentsQ.error ?? flowsQ.error
    const code = agents.length || flows.length ? null : agentsErrorCode(failure)
    return { code: code as CeodigitalErrorCode | null, agents, flows }
  }, [agentsQ.data, agentsQ.error, flowsQ.data, flowsQ.error])

  const loading = agentsQ.isLoading || flowsQ.isLoading
  const errorCopy = code === null ? k.errors.fetch : k.errors[code]

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
          <Loader type="lemniscate-bloom" />
        </div>
      ) : code ? (
        <div className="grid flex-1 place-items-center px-4">
          <ErrorState title={errorCopy} />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* ── CEO agents catalog ── */}
          <section className="pb-2">
            <div className="flex items-center gap-2 px-4 py-1.5">
              <Codicon name="hubot" className="text-(--ui-text-tertiary)" size="0.9375rem" />
              <h2 className="text-[0.6875rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                {k.agents.title}
              </h2>
            </div>
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
                        {a.is_active ? <span className="text-green-500">● {a.status ?? 'active'}</span> : <span className="text-(--ui-text-quaternary)">{a.status ?? 'inactive'}</span>}
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

          {/* ── NativeFlows ── */}
          <section className="pt-2">
            <div className="flex items-center gap-2 px-4 py-1.5">
              <Codicon name="workflow" className="text-(--ui-text-tertiary)" size="0.9375rem" />
              <h2 className="text-[0.6875rem] font-medium uppercase tracking-wide text-(--ui-text-tertiary)">
                {k.agents.workflows.title}
              </h2>
            </div>
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
                      <td className="px-3 py-2 text-[0.8125rem] text-foreground">{f.name}</td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">{f.status}</td>
                      <td className="px-3 py-2 text-[0.75rem] text-(--ui-text-secondary)">{f.trigger_type ?? '—'}</td>
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