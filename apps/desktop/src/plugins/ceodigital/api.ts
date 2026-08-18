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
  AssignBody,
  AssignWorkItemEnvelope,
  CatalogEnvelope,
  CatalogItemEnvelope,
  CatalogListParams,
  CategoriesEnvelope,
  ChecklistToggleBody,
  ChecklistToggleEnvelope,
  CreateProposalEnvelope,
  CreateProposalInput,
  CreateWorkItemEnvelope,
  DealsEnvelope,
  LeadsEnvelope,
  OfferingsEnvelope,
  OfferingsListParams,
  OrganizationEnvelope,
  OrganizationsEnvelope,
  PersonsEnvelope,
  PersonEnvelope,
  PipelinesEnvelope,
  ProposalActionEnvelope,
  ProposalEnvelope,
  ProposalItemValues,
  ProposalsEnvelope,
  ProposalsListParams,
  ProposalTrancheValues,
  RunWorkItemEnvelope,
  ServiceCategoriesParams,
  StagesEnvelope,
  SubmitBody,
  SubmitWorkItemEnvelope,
  SuggestEnvelope,
  UpdateProposalInput,
  WorkItemInput,
  WorkItemResponse,
  WorkItemsEnvelope,
  WorkItemsStatusEnvelope,
  WorkItemStatusFilter
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

// ── Workitems operational (W2) — status / suggest / create / run / assign /
//    submit / checklist (proxy over the MCP workitems.* tools) ───────────────

export const WORKITEMS_STATUS_KEY = ['ceodigital', 'workitems-status'] as const

/** GET /workitems/status — a status-lens grouping (MCP workitems.status). */
export const fetchWorkItemsStatus = (filter?: WorkItemStatusFilter) =>
  call<WorkItemsStatusEnvelope>(filter ? `/workitems/status?filter=${encodeURIComponent(filter)}` : '/workitems/status')

/** GET /workitems/suggest — matched SOPs for an intent (MCP workitems.suggest). */
export const suggestWorkItem = (intent: string, limit?: number) => {
  const qs = new URLSearchParams({ intent })
  if (limit) qs.set('limit', String(limit))
  return call<SuggestEnvelope>(`/workitems/suggest?${qs.toString()}`)
}

/** POST /workitems — create a work item (MCP workitems.create, needsApproval). */
export const createWorkItem = (input: WorkItemInput) =>
  call<CreateWorkItemEnvelope>('/workitems', { method: 'POST', body: input })

/** POST /workitems/{id}/run — run a work item's flow (MCP workitems.run). */
export const runWorkItem = (id: string) =>
  call<RunWorkItemEnvelope>(`/workitems/${encodeURIComponent(id)}/run`, { method: 'POST', body: {} })

/** POST /workitems/{id}/assign — assign/unassign users (MCP workitems.assign). */
export const assignWorkItem = (id: string, body: AssignBody) =>
  call<AssignWorkItemEnvelope>(`/workitems/${encodeURIComponent(id)}/assign`, { method: 'POST', body })

/** POST /workitems/{id}/submit — submit a run's output (MCP workitems.submit_output). */
export const submitWorkItemOutput = (id: string, body: SubmitBody) =>
  call<SubmitWorkItemEnvelope>(`/workitems/${encodeURIComponent(id)}/submit`, { method: 'POST', body })

/** POST /workitems/{id}/checklist — toggle a checklist item (MCP workitems.checklist.toggle). */
export const toggleChecklistItem = (id: string, body: ChecklistToggleBody) =>
  call<ChecklistToggleEnvelope>(`/workitems/${encodeURIComponent(id)}/checklist`, { method: 'POST', body })

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

// ── Services & Proposals (W3) ──────────────────────────────────────────────

export const CATALOG_KEY = ['ceodigital', 'services', 'catalog'] as const
export const catalogItemKey = (id: string) => ['ceodigital', 'services', 'catalog', id] as const
export const OFFERINGS_KEY = ['ceodigital', 'services', 'offerings'] as const
export const offeringKey = (id: string) => ['ceodigital', 'services', 'offerings', id] as const
export const SERVICES_CATEGORIES_KEY = ['ceodigital', 'services', 'categories'] as const
export const PROPOSALS_KEY = ['ceodigital', 'services', 'proposals'] as const
export const proposalKey = (id: string) => ['ceodigital', 'services', 'proposals', id] as const

/** GET /services/catalog — the tenant's services catalog (MCP services.catalog.list). */
export const fetchCatalog = (params?: CatalogListParams) => {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.search) qs.set('search', params.search)
  if (params?.produces) qs.set('produces', params.produces)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<CatalogEnvelope>(`/services/catalog${suffix}`)
}

/** GET /services/catalog/{id} — one catalog item (MCP services.catalog.get). */
export const fetchCatalogItem = (id: string) =>
  call<CatalogItemEnvelope>(`/services/catalog/${encodeURIComponent(id)}`)

/** GET /services/offerings — service offerings (MCP services.offerings.list). */
export const fetchOfferings = (params?: OfferingsListParams) => {
  const qs = new URLSearchParams()
  if (params?.serviceCatalogId) qs.set('serviceCatalogId', params.serviceCatalogId)
  if (params?.pricingModel) qs.set('pricingModel', params.pricingModel)
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<OfferingsEnvelope>(`/services/offerings${suffix}`)
}

/** GET /services/offerings/{id} — one offering (MCP services.offerings.get). */
export const fetchOffering = (id: string) =>
  call<OfferingsEnvelope>(`/services/offerings/${encodeURIComponent(id)}`)

/** GET /services/categories — services taxonomy categories (MCP services.categories.list). */
export const fetchServiceCategories = (params?: ServiceCategoriesParams) => {
  const qs = new URLSearchParams()
  if (params?.parentId) qs.set('parentId', params.parentId)
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<CategoriesEnvelope>(`/services/categories${suffix}`)
}

/** GET /services/proposals — the tenant's proposals (MCP services.proposals.list). */
export const fetchProposals = (params?: ProposalsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ProposalsEnvelope>(`/services/proposals${suffix}`)
}

/** GET /services/proposals/{id} — one proposal incl. items/tranches (MCP services.proposals.get). */
export const fetchProposal = (id: string) =>
  call<ProposalEnvelope>(`/services/proposals/${encodeURIComponent(id)}`)

/** POST /services/proposals — create a proposal (MCP services.proposals.create). */
export const createProposal = (input: CreateProposalInput) =>
  call<CreateProposalEnvelope>('/services/proposals', { method: 'POST', body: input })

/** POST /services/proposals/{id}/send — send a proposal (MCP services.proposals.send). */
export const sendProposal = (id: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/send`, { method: 'POST', body: {} })

/** POST /services/proposals/{id}/accept — accept a proposal (MCP services.proposals.accept). */
export const acceptProposal = (id: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/accept`, { method: 'POST', body: {} })

/** POST /services/proposals/{id}/reject — reject a proposal (MCP services.proposals.reject). */
export const rejectProposal = (id: string, reason?: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })

/** POST /services/proposals/{id}/cancel — cancel a proposal (MCP services.proposals.cancel). */
export const cancelProposal = (id: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: {} })

/** POST /services/proposals/{id}/update — update fields (MCP services.proposals.update). */
export const updateProposal = (id: string, input: UpdateProposalInput) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/update`, { method: 'POST', body: input })

/** POST /services/proposals/{id}/duplicate — duplicate a proposal (MCP services.proposals.duplicate). */
export const duplicateProposal = (id: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/duplicate`, { method: 'POST', body: {} })

/** POST /services/proposals/{id}/expire — expire a proposal (MCP services.proposals.expire). */
export const expireProposal = (id: string) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/expire`, { method: 'POST', body: {} })

/** POST /services/proposals/{id}/items — add a line item (MCP services.proposals.items.add). */
export const addProposalItem = (id: string, values: ProposalItemValues) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/items`, { method: 'POST', body: { values } })

/** POST /services/proposals/{id}/items/{itemId} — update a line item (MCP services.proposals.items.update). */
export const updateProposalItem = (id: string, itemId: string, values: ProposalItemValues) =>
  call<ProposalActionEnvelope>(
    `/services/proposals/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
    { method: 'POST', body: { values } }
  )

/** POST /services/proposals/{id}/items/{itemId}/remove — remove a line item (MCP services.proposals.items.remove). */
export const removeProposalItem = (id: string, itemId: string) =>
  call<ProposalActionEnvelope>(
    `/services/proposals/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}/remove`,
    { method: 'POST', body: {} }
  )

/** POST /services/proposals/{id}/tranches — add a payment tranche (MCP services.proposals.tranches.add). */
export const addTranche = (id: string, values: ProposalTrancheValues) =>
  call<ProposalActionEnvelope>(`/services/proposals/${encodeURIComponent(id)}/tranches`, {
    method: 'POST',
    body: { values }
  })

/** POST /services/proposals/{id}/tranches/{trancheId} — update a tranche (MCP services.proposals.tranches.update). */
export const updateTranche = (id: string, trancheId: string, values: ProposalTrancheValues) =>
  call<ProposalActionEnvelope>(
    `/services/proposals/${encodeURIComponent(id)}/tranches/${encodeURIComponent(trancheId)}`,
    { method: 'POST', body: { values } }
  )

/** POST /services/proposals/{id}/tranches/{trancheId}/remove — remove a tranche (MCP services.proposals.tranches.remove). */
export const removeTranche = (id: string, trancheId: string) =>
  call<ProposalActionEnvelope>(
    `/services/proposals/${encodeURIComponent(id)}/tranches/${encodeURIComponent(trancheId)}/remove`,
    { method: 'POST', body: {} }
  )