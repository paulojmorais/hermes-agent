/**
 * CEODigital data layer. Everything goes through `ctx.rest` — the plugin's own
 * `/api/plugins/ceodigital/*` FastAPI router (`plugins/ceodigital/dashboard/plugin_api.py`,
 * owned by a parallel wave) which proxies the tenant's CEODigital MCP server.
 * The renderer never holds MCP tokens; it only sees clean JSON.
 *
 * W3 is READ-ONLY: `fetchWorkItems` / `fetchWorkItem` are the whole surface —
 * mutations land in W4 (HITL work-item editing). React Query owns caching and
 * errors; this module owns the query keys and the REST calls.
 */

import { type PluginRestOptions } from '@hermes/plugin-sdk'

import type {
  ActivitiesEnvelope,
  AgentAskEnvelope,
  AgentFlowsEnvelope,
  AgentPendingEnvelope,
  AgentRunEnvelope,
  AgentRunsEnvelope,
  AgentSchedulesEnvelope,
  AgentsEnvelope,
  CategoriesEnvelope,
  DealsEnvelope,
  LeadsEnvelope,
  OrganizationsEnvelope,
  OrganizationEnvelope,
  PersonsEnvelope,
  PersonEnvelope,
  PipelinesEnvelope,
  StagesEnvelope,
  WorkItemResponse,
  WorkItemsEnvelope
} from './types'

type Rest = <T>(path: string, opts?: PluginRestOptions) => Promise<T>

let rest: null | Rest = null

// ── query keys (namespaced under the plugin id) ─────────────────────────────

export const WORKITEMS_KEY = ['ceodigital', 'workitems'] as const
export const workItemKey = (id: string) => ['ceodigital', 'workitems', id] as const
export const LEADS_KEY = ['ceodigital', 'leads'] as const
export const DEALS_KEY = ['ceodigital', 'deals'] as const
export const AGENTS_KEY = ['ceodigital', 'agents'] as const
export const AGENTFLOWS_KEY = ['ceodigital', 'agentflows'] as const

/** Bind the plugin's REST door at register time, return a disposer for
 *  unload/disable. Using any fetch before `bindApi` rejects loudly — a missed
 *  `ctx.onDispose(bindApi(ctx.rest))` in the plugin would otherwise strand a
 *  null door forever. */
export function bindApi(r: Rest): () => void {
  rest = r

  return () => {
    rest = null
  }
}

function call<T>(path: string, opts?: PluginRestOptions): Promise<T> {
  return rest ? rest<T>(path, opts) : Promise.reject(new Error('ceodigital api not ready'))
}

// ── reads ─────────────────────────────────────────────────────────────────

/** GET /workitems — the tenant's Projects list (proxy over MCP workitems_list). */
export const fetchWorkItems = () => call<WorkItemsEnvelope>('/workitems')

/** GET /workitems/{id} — one work item's detail. */
export const fetchWorkItem = (id: string) => call<WorkItemResponse>(`/workitems/${encodeURIComponent(id)}`)

// ── CRM (W4) ────────────────────────────────────────────────────────────────

/** GET /leads — the tenant's CRM leads (proxy over MCP crm_leads_list). */
export const fetchLeads = () => call<LeadsEnvelope>('/leads')

/** GET /deals — the tenant's CRM deals (proxy over MCP crm_deals_list). */
export const fetchDeals = () => call<DealsEnvelope>('/deals')

// ── CRM (W1) ─────────────────────────────────────────────────────────────────

export const PERSONS_KEY = ['ceodigital', 'persons'] as const
export const personKey = (id: string) => ['ceodigital', 'persons', id] as const
export const ORGANIZATIONS_KEY = ['ceodigital', 'organizations'] as const
export const organizationKey = (id: string) => ['ceodigital', 'organizations', id] as const
export const PIPELINES_KEY = ['ceodigital', 'pipelines'] as const
export const STAGES_KEY = ['ceodigital', 'stages'] as const
export const ACTIVITIES_KEY = ['ceodigital', 'activities'] as const
export const CATEGORIES_KEY = ['ceodigital', 'categories'] as const

/** GET /persons — the tenant's CRM persons (proxy over MCP crm.persons.list). */
export const fetchPersons = () => call<PersonsEnvelope>('/persons')

/** GET /persons/{id} — one CRM person's detail (proxy over MCP crm.persons.get). */
export const fetchPerson = (id: string) => call<PersonEnvelope>(`/persons/${encodeURIComponent(id)}`)

/** GET /organizations — the tenant's CRM organizations (proxy over MCP crm.organizations.list). */
export const fetchOrganizations = () => call<OrganizationsEnvelope>('/organizations')

/** GET /organizations/{id} — one CRM organization's detail (proxy over MCP crm.organizations.get). */
export const fetchOrganization = (id: string) =>
  call<OrganizationEnvelope>(`/organizations/${encodeURIComponent(id)}`)

/** GET /pipelines — CRM pipelines with inline stages (proxy over MCP crm.pipelines.list). */
export const fetchPipelines = (params?: { subjectType?: string }) => {
  const qs = new URLSearchParams()
  if (params?.subjectType) qs.set('subjectType', params.subjectType)
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PipelinesEnvelope>(`/pipelines${suffix}`)
}

/** GET /stages — CRM stages for a pipeline (proxy over MCP crm.stages.list). */
export const fetchStages = (params?: { pipelineId?: string }) => {
  const qs = new URLSearchParams()
  if (params?.pipelineId) qs.set('pipelineId', params.pipelineId)
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<StagesEnvelope>(`/stages${suffix}`)
}

/** GET /activities — CRM activities, optionally scoped to a subject
 *  (proxy over MCP crm.activities.list; subject requires both relatedType + relatedId). */
export const fetchActivities = (params?: { relatedType?: string; relatedId?: string }) => {
  const qs = new URLSearchParams()
  if (params?.relatedType) qs.set('related_type', params.relatedType)
  if (params?.relatedId) qs.set('related_id', params.relatedId)
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ActivitiesEnvelope>(`/activities${suffix}`)
}

/** GET /categories — CRM taxonomy categories (proxy over MCP crm.categories.list). */
export const fetchCategories = (params?: { taxonomyKey?: string; activeOnly?: boolean }) => {
  const qs = new URLSearchParams()
  if (params?.taxonomyKey) qs.set('taxonomyKey', params.taxonomyKey)
  if (params?.activeOnly) qs.set('activeOnly', 'true')
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<CategoriesEnvelope>(`/categories${suffix}`)
}

// ── Agents + NativeFlows (W5) ──────────────────────────────────────────────

/** GET /agents — the tenant's CEO agents catalog (MCP agents.list). */
export const fetchAgents = () => call<AgentsEnvelope>('/agents')

/** GET /agentflows — the tenant's NativeFlow workflows (MCP agentflow.workflows.list). */
export const fetchAgentFlows = () => call<AgentFlowsEnvelope>('/agentflows')

// ── Agent runs + debrief (W5+) ─────────────────────────────────────────────

/** GET /agents/runs — recent CEO agent runs (MCP agent.runs.list). */
export const fetchRuns = (params?: { agentId?: string; status?: string; limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.agentId) qs.set('agentId', params.agentId)
  if (params?.status) qs.set('status', params.status)
  if (params?.limit) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<AgentRunsEnvelope>(`/agents/runs${suffix}`)
}

/** GET /agents/runs/{id} — one run detail incl. steps (MCP agent.runs.get). */
export const fetchRun = (runId: string) =>
  call<AgentRunEnvelope>(`/agents/runs/${encodeURIComponent(runId)}`)

/** POST /agents/{slug}/ask — run one CEO agent turn (MCP agent.<slug>.ask). */
export const askAgent = (slug: string, prompt: string) =>
  call<AgentAskEnvelope>(`/agents/${encodeURIComponent(slug)}/ask`, {
    method: 'POST',
    body: { prompt }
  })

export const RUNS_KEY = ['ceodigital', 'agent-runs'] as const
export const runKey = (runId: string) => ['ceodigital', 'agent-runs', runId] as const
export const SCHEDULES_KEY = ['ceodigital', 'agent-schedules'] as const
export const PENDING_KEY = ['ceodigital', 'agent-pending'] as const

/** GET /agents/schedules — autonomous CEO agent schedules (agent.schedules.list). */
export const fetchAgentSchedules = (params?: { agentId?: string; activeOnly?: boolean }) => {
  const qs = new URLSearchParams()
  if (params?.agentId) qs.set('agentId', params.agentId)
  if (params?.activeOnly) qs.set('activeOnly', 'true')
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<AgentSchedulesEnvelope>(`/agents/schedules${suffix}`)
}

/** GET /agents/pending — HITL tool calls awaiting decision (read-only; approve stays in tenant UI). */
export const fetchPendingApprovals = (runId?: string) => {
  const suffix = runId ? `?runId=${encodeURIComponent(runId)}` : ''
  return call<AgentPendingEnvelope>(`/agents/pending${suffix}`)
}