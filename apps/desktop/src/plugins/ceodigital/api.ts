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
  AddDepartmentMemberInput,
  AddExemptionInput,
  AddWidgetInput,
  AddWorkspaceMemberInput,
  AgentAskEnvelope,
  AgentFlowsEnvelope,
  AgentPendingEnvelope,
  AgentRunEnvelope,
  AgentRunsEnvelope,
  AgentSchedulesEnvelope,
  AgentsEnvelope,
  AssignAttendanceItemInput,
  AssignLabelInput,
  AssignBody,
  AssignWorkItemEnvelope,
  AttendanceItemEnvelope,
  AttendanceItemRow,
  AttendanceItemsEnvelope,
  AttendanceItemsParams,
  AutomationActionEnvelope,
  ConnectIntegrationInput,
  CreateDepartmentInput,
  CreateWorkspaceInput,
  AttachBindingInput,
  BindingsEnvelope,
  BindingsListParams,
  CatalogEnvelope,
  CatalogItemEnvelope,
  CancelPaymentLinkInput,
  CatalogListParams,
  CategoriesEnvelope,
  ChecklistToggleBody,
  ChecklistToggleEnvelope,
  CollectionsEnvelope,
  ConsentsEnvelope,
  ConsentsListParams,
  ConversationEnvelope,
  ConversationsEnvelope,
  ConversationsListParams,
  CreateCollectionInput,
  CreateConversationInput,
  CreateDashboardInput,
  CreateDsrRequestInput,
  CreateLabelInput,
  CreatePaymentLinkInput,
  CreatePricingProfileInput,
  CreateProposalEnvelope,
  CreateProposalInput,
  CreateThreadInput,
  CreateWorkItemEnvelope,
  DashboardEnvelope,
  DashboardRow,
  DashboardsEnvelope,
  DashboardsListParams,
  DatasetRow,
  DatasetsEnvelope,
  DatasetsListParams,
  DealsEnvelope,
  DepartmentEnvelope,
  DepartmentsEnvelope,
  DepartmentsListParams,
  DepartmentMembersEnvelope,
  DepartmentRow,
  DepartmentMemberRow,
  DocumentsActionEnvelope,
  DsrListParams,
  DsrRequestRow,
  DsrRequestsEnvelope,
  ExemptionRow,
  FeeRow,
  FileEnvelope,
  FilesEnvelope,
  FilesListParams,
  ImplFilesEnvelope,
  ImplFilesParams,
  ImplPhasesEnvelope,
  ImplPhasesListParams,
  ImplProjectEnvelope,
  ImplProjectsEnvelope,
  ImplProjectsListParams,
  InferenceBackend,
  IntegrationEnvelope,
  IntegrationsEnvelope,
  IntegrationsListParams,
  IntegrationRow,
  InviteMemberInput,
  LabelAssignmentsEnvelope,
  LabelAssignmentsParams,
  LabelEnvelope,
  LabelRow,
  LabelsEnvelope,
  LabelsListParams,
  LeadsEnvelope,
  LlmAdapterRow,
  LlmAdaptersEnvelope,
  LlmAdaptersListParams,
  LlmJobEnvelope,
  LlmJobRow,
  LlmJobsEnvelope,
  LlmJobsListParams,
  LlmPreferencesEnvelope,
  LlmPreferencesRow,
  MessagesEnvelope,
  MessagesListParams,
  MemberEnvelope,
  MembersEnvelope,
  MembersListParams,
  MemberRow,
  MoveFileInput,
  NotificationsEnvelope,
  NotificationsListParams,
  OfferingsEnvelope,
  OfferingsListParams,
  OrderEnvelope,
  OrderRow,
  OrdersEnvelope,
  OrdersListParams,
  OrganizationEnvelope,
  OrganizationsEnvelope,
  PaymentEnvelope,
  PaymentRow,
  PaymentsEnvelope,
  PaymentsListParams,
  PersonsEnvelope,
  PersonEnvelope,
  PhaseStatus,
  PinRow,
  PinsEnvelope,
  PipelinesEnvelope,
  PlaybookEnvelope,
  PlaybookRunsEnvelope,
  PlaybookRunsListParams,
  PlaybooksEnvelope,
  PlaybooksListParams,
  PricingExemptionsEnvelope,
  PricingExemptionsParams,
  PricingFeesEnvelope,
  PricingFeesParams,
  PricingProfileEnvelope,
  PricingProfileRow,
  PricingProfilesEnvelope,
  PricingProfilesListParams,
  PricingRuleRow,
  PricingRulesEnvelope,
  PricingRulesParams,
  ProcessingRecordRow,
  ProcessingRecordsEnvelope,
  ProcessingRecordsListParams,
  ProjectStatus,
  ProposalActionEnvelope,
  ProposalEnvelope,
  ProposalItemValues,
  ProposalsEnvelope,
  ProposalsListParams,
  ProposalTrancheValues,
  ReindexInput,
  RecordConsentInput,
  RetentionEnvelope,
  RetentionListParams,
  RetentionPolicyRow,
  RouteDsrRequestInput,
  RunPlaybookInput,
  RunWorkItemEnvelope,
  RunWorkflowInput,
  SchedulesEnvelope,
  SchedulesListParams,
  SearchEnvelope,
  SearchParams,
  ServiceCategoriesParams,
  SetPinNoteInput,
  StagesEnvelope,
  SubmitBody,
  SubmitWorkItemEnvelope,
  SuggestEnvelope,
  ThreadEnvelope,
  ThreadsEnvelope,
  ThreadsListParams,
  TimelineEventEnvelope,
  TimelineEventsEnvelope,
  TimelineEventsParams,
  ToggleAdapterInput,
  TogglePinInput,
  UnreadCountEnvelope,
  UpdateAttendanceStatusInput,
  UpdateLabelInput,
  UpdateLlmPreferencesInput,
  UpdateOrderStatusInput,
  UpdatePricingProfileInput,
  UpdateProposalInput,
  UploadAttachmentInput,
  UploadFileInput,
  W6aActionEnvelope,
  W6bActionEnvelope,
  W7ActionEnvelope,
  W8ActionEnvelope,
  WebhooksEnvelope,
  WebhooksListParams,
  WidgetRow,
  WidgetsEnvelope,
  WorkbenchPinsParams,
  WorkItemInput,
  WorkItemResponse,
  WorkItemsEnvelope,
  WorkItemsStatusEnvelope,
  WorkItemStatusFilter,
  WorkflowEnvelope,
  WorkflowRunsEnvelope,
  WorkflowsEnvelope,
  WorkflowsListParams,
  WorkspaceEnvelope,
  WorkspaceMembersEnvelope,
  WorkspaceMemberRow,
  WorkspaceRow,
  WorkspacesEnvelope,
  WorkspacesListParams
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
  if (!rest) return Promise.reject(new Error('ceodigital api not ready'))
  return opts ? rest<T>(path, opts) : rest<T>(path)
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

// ── Automation (W4) — conversations (conversations.*) ───────────────────────

export const CONVERSATIONS_KEY = ['ceodigital', 'automation', 'conversations'] as const
export const conversationKey = (id: string) => ['ceodigital', 'automation', 'conversations', id] as const

/** GET /automation/conversations — the tenant's conversations (MCP conversations.list). */
export const fetchConversations = (params?: ConversationsListParams) => {
  const qs = new URLSearchParams()
  if (params?.isArchived !== undefined) qs.set('isArchived', String(params.isArchived))
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ConversationsEnvelope>(`/automation/conversations${suffix}`)
}

/** GET /automation/conversations/{id} — one conversation (MCP conversations.get). */
export const fetchConversation = (id: string) =>
  call<ConversationEnvelope>(`/automation/conversations/${encodeURIComponent(id)}`)

/** POST /automation/conversations — create a conversation (MCP conversations.create). */
export const createConversation = (input: CreateConversationInput) =>
  call<AutomationActionEnvelope>('/automation/conversations', { method: 'POST', body: input })

/** POST /automation/conversations/{id}/archive — archive (MCP conversations.archive). */
export const archiveConversation = (id: string) =>
  call<AutomationActionEnvelope>(`/automation/conversations/${encodeURIComponent(id)}/archive`, { method: 'POST', body: {} })

/** POST /automation/conversations/{id}/share — share/unshare (MCP conversations.share). */
export const shareConversation = (id: string, enabled: boolean) =>
  call<AutomationActionEnvelope>(`/automation/conversations/${encodeURIComponent(id)}/share`, {
    method: 'POST',
    body: { enabled }
  })

// ── Automation (W4) — playbooks (+ runs) ───────────────────────────────────

export const PLAYBOOKS_KEY = ['ceodigital', 'automation', 'playbooks'] as const
export const playbookKey = (id: string) => ['ceodigital', 'automation', 'playbooks', id] as const
export const PLAYBOOK_RUNS_KEY = ['ceodigital', 'automation', 'playbook-runs'] as const

/** GET /automation/playbooks — the tenant's playbooks (MCP playbooks.list). */
export const fetchPlaybooks = (params?: PlaybooksListParams) => {
  const qs = new URLSearchParams()
  if (params?.subjectType) qs.set('subjectType', params.subjectType)
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PlaybooksEnvelope>(`/automation/playbooks${suffix}`)
}

/** GET /automation/playbooks/{id} — one playbook by id or ?code= (MCP playbooks.get). */
export const fetchPlaybook = (idOrCode: { id?: string; code?: string } = {}) => {
  const qs = new URLSearchParams()
  if (idOrCode.code) qs.set('code', idOrCode.code)
  const id = idOrCode.id ?? idOrCode.code ?? ''
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PlaybookEnvelope>(`/automation/playbooks/${encodeURIComponent(id)}${suffix}`)
}

/** POST /automation/playbooks/{id}/run — run a playbook (MCP playbooks.run). */
export const runPlaybook = (id: string, body: RunPlaybookInput) =>
  call<AutomationActionEnvelope>(`/automation/playbooks/${encodeURIComponent(id)}/run`, { method: 'POST', body })

/** GET /automation/playbooks/runs — runs across playbooks (MCP playbook.runs.list). */
export const fetchPlaybookRuns = (params?: PlaybookRunsListParams) => {
  const qs = new URLSearchParams()
  if (params?.playbookId) qs.set('playbookId', params.playbookId)
  if (params?.status) qs.set('status', params.status)
  if (params?.subjectType) qs.set('subjectType', params.subjectType)
  if (params?.subjectId) qs.set('subjectId', params.subjectId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PlaybookRunsEnvelope>(`/automation/playbooks/runs${suffix}`)
}

// ── Automation (W4) — NativeFlow (workflows / runs / webhooks / schedules) ──

export const WORKFLOWS_KEY = ['ceodigital', 'automation', 'workflows'] as const
export const workflowKey = (id: string) => ['ceodigital', 'automation', 'workflows', id] as const
export const workflowRunsKey = (id: string) => ['ceodigital', 'automation', 'workflows', id, 'runs'] as const
export const workflowWebhooksKey = (id: string) => ['ceodigital', 'automation', 'workflows', id, 'webhooks'] as const
export const workflowSchedulesKey = (id: string) => ['ceodigital', 'automation', 'workflows', id, 'schedules'] as const

/** GET /automation/workflows — the tenant's NativeFlow workflows (agentflow.workflows.list). */
export const fetchWorkflows = (params?: WorkflowsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.triggerType) qs.set('triggerType', params.triggerType)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<WorkflowsEnvelope>(`/automation/workflows${suffix}`)
}

/** GET /automation/workflows/{id} — one workflow (agentflow.workflows.get). */
export const fetchWorkflow = (id: string) =>
  call<WorkflowEnvelope>(`/automation/workflows/${encodeURIComponent(id)}`)

/** POST /automation/workflows/{id}/publish — publish (agentflow.workflows.publish). */
export const publishWorkflow = (id: string) =>
  call<AutomationActionEnvelope>(`/automation/workflows/${encodeURIComponent(id)}/publish`, { method: 'POST', body: {} })

/** POST /automation/workflows/{id}/run — run a workflow (agentflow.run). */
export const runWorkflow = (id: string, input?: RunWorkflowInput) =>
  call<AutomationActionEnvelope>(`/automation/workflows/${encodeURIComponent(id)}/run`, {
    method: 'POST',
    body: input ?? {}
  })

/** GET /automation/workflows/{id}/runs — runs for a workflow (agentflow.runs.list). */
export const fetchWorkflowRuns = (id: string, params?: { limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<WorkflowRunsEnvelope>(`/automation/workflows/${encodeURIComponent(id)}/runs${suffix}`)
}

/** GET /automation/workflows/{id}/webhooks — webhooks for a workflow (agentflow.webhooks.list). */
export const fetchWorkflowWebhooks = (id: string, params?: WebhooksListParams) => {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<WebhooksEnvelope>(`/automation/workflows/${encodeURIComponent(id)}/webhooks${suffix}`)
}

/** POST /automation/webhooks/{id}/rotate — rotate a webhook secret (agentflow.webhooks.rotate). */
export const rotateWebhook = (id: string) =>
  call<AutomationActionEnvelope>(`/automation/webhooks/${encodeURIComponent(id)}/rotate`, { method: 'POST', body: {} })

/** GET /automation/workflows/{id}/schedules — schedules for a workflow (agentflow.schedules.list). */
export const fetchWorkflowSchedules = (id: string, params?: SchedulesListParams) => {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<SchedulesEnvelope>(`/automation/workflows/${encodeURIComponent(id)}/schedules${suffix}`)
}

/** POST /automation/schedules/{id}/pause — pause/resume a schedule (agentflow.schedules.pause). */
export const pauseSchedule = (id: string, paused: boolean) =>
  call<AutomationActionEnvelope>(`/automation/schedules/${encodeURIComponent(id)}/pause`, {
    method: 'POST',
    body: { paused }
  })

// ── Documents & RAG (W5) — files, collections, bindings, search ─────────────

export const FILES_KEY = ['ceodigital', 'documents', 'files'] as const
export const fileKey = (id: string) => ['ceodigital', 'documents', 'files', id] as const
export const COLLECTIONS_KEY = ['ceodigital', 'documents', 'collections'] as const
export const BINDINGS_KEY = ['ceodigital', 'documents', 'bindings'] as const
export const SEARCH_KEY = ['ceodigital', 'documents', 'search'] as const

/** GET /documents/search — RAG search across the library (MCP searchDocuments). */
export const searchDocuments = (params: SearchParams) => {
  const qs = new URLSearchParams({ query: params.query })
  if (params.namespaces?.length) qs.set('namespaces', params.namespaces.join(','))
  if (params.maxResults !== undefined) qs.set('maxResults', String(params.maxResults))
  return call<SearchEnvelope>(`/documents/search?${qs.toString()}`)
}

/** GET /documents/files — the tenant's document library (MCP documents.files.list). */
export const fetchFiles = (params?: FilesListParams) => {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.collectionId) qs.set('collectionId', params.collectionId)
  if (params?.namespace) qs.set('namespace', params.namespace)
  if (params?.visibility) qs.set('visibility', params.visibility)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<FilesEnvelope>(`/documents/files${suffix}`)
}

/** GET /documents/files/{id} — one document file (MCP documents.files.get). */
export const fetchFile = (id: string) => call<FileEnvelope>(`/documents/files/${encodeURIComponent(id)}`)

/** POST /documents/files/{id}/delete — delete a file (MCP documents.files.delete). */
export const deleteFile = (id: string) =>
  call<DocumentsActionEnvelope>(`/documents/files/${encodeURIComponent(id)}/delete`, { method: 'POST', body: {} })

/** POST /documents/files/upload — upload a file (MCP documents.files.upload). */
export const uploadFile = (input: UploadFileInput) =>
  call<DocumentsActionEnvelope>('/documents/files/upload', { method: 'POST', body: input })

/** POST /documents/files/{id}/move — move a file between namespaces/collections
 *  (MCP documents.files.move). */
export const moveFile = (id: string, body: MoveFileInput) =>
  call<DocumentsActionEnvelope>(`/documents/files/${encodeURIComponent(id)}/move`, { method: 'POST', body })

/** GET /documents/collections — the tenant's collections (MCP documents.collections.list). */
export const fetchCollections = () => call<CollectionsEnvelope>('/documents/collections')

/** POST /documents/collections — create a collection (MCP documents.collections.create). */
export const createCollection = (input: CreateCollectionInput) =>
  call<DocumentsActionEnvelope>('/documents/collections', { method: 'POST', body: input })

/** POST /documents/collections/{id}/add_file — add a file to a collection
 *  (MCP documents.collections.add_file). */
export const addFileToCollection = (collectionId: string, fileId: string) =>
  call<DocumentsActionEnvelope>(`/documents/collections/${encodeURIComponent(collectionId)}/add_file`, {
    method: 'POST',
    body: { fileId }
  })

/** POST /documents/collections/{id}/remove_file — remove a file from a collection
 *  (MCP documents.collections.remove_file). */
export const removeFileFromCollection = (collectionId: string, fileId: string) =>
  call<DocumentsActionEnvelope>(`/documents/collections/${encodeURIComponent(collectionId)}/remove_file`, {
    method: 'POST',
    body: { fileId }
  })

/** GET /documents/bindings — entity document bindings (MCP documents.bindings.list). */
export const fetchBindings = (params?: BindingsListParams) => {
  const qs = new URLSearchParams()
  if (params?.entityType) qs.set('entityType', params.entityType)
  if (params?.entityId) qs.set('entityId', params.entityId)
  if (params?.direction) qs.set('direction', params.direction)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<BindingsEnvelope>(`/documents/bindings${suffix}`)
}

/** POST /documents/bindings — attach a document binding (MCP documents.bindings.attach). */
export const attachBinding = (input: AttachBindingInput) =>
  call<DocumentsActionEnvelope>('/documents/bindings', { method: 'POST', body: input })

/** POST /documents/bindings/{rowId}/detach — detach a binding (MCP documents.bindings.detach). */
export const detachBinding = (rowId: string) =>
  call<DocumentsActionEnvelope>(`/documents/bindings/${encodeURIComponent(rowId)}/detach`, { method: 'POST', body: {} })

/** POST /documents/reindex — RAG reindex of a namespace (MCP documents.rag.reindex). */
export const reindexDocuments = (body: ReindexInput) =>
  call<DocumentsActionEnvelope>('/documents/reindex', { method: 'POST', body })

// ── Messaging (W6a) ─────────────────────────────────────────────────────────

export const THREADS_KEY = ['ceodigital', 'messaging', 'threads'] as const
export const threadKey = (id: string) => ['ceodigital', 'messaging', 'threads', id] as const
export const threadMessagesKey = (id: string) => ['ceodigital', 'messaging', 'threads', id, 'messages'] as const

/** GET /messaging/threads — the tenant's threads (MCP messaging.threads.list;
 *  a refId delegates to messaging.threads.list_by_ref). */
export const fetchThreads = (params?: ThreadsListParams) => {
  const qs = new URLSearchParams()
  if (params?.threadType) qs.set('threadType', params.threadType)
  if (params?.refTable) qs.set('refTable', params.refTable)
  if (params?.refId) qs.set('refId', params.refId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ThreadsEnvelope>(`/messaging/threads${suffix}`)
}

/** GET /messaging/threads/{id} — one thread incl. recent messages (MCP messaging.threads.get). */
export const fetchThread = (id: string, messageLimit?: number) => {
  const suffix = messageLimit !== undefined ? `?messageLimit=${String(messageLimit)}` : ''
  return call<ThreadEnvelope>(`/messaging/threads/${encodeURIComponent(id)}${suffix}`)
}

/** GET /messaging/threads/{id}/messages — messages for a thread (MCP messaging.messages.list). */
export const fetchMessages = (threadId: string, params?: MessagesListParams) => {
  const qs = new URLSearchParams()
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<MessagesEnvelope>(`/messaging/threads/${encodeURIComponent(threadId)}/messages${suffix}`)
}

/** POST /messaging/threads — create a thread (MCP messaging.threads.create). */
export const createThread = (input: CreateThreadInput) =>
  call<W6aActionEnvelope>('/messaging/threads', { method: 'POST', body: input })

/** POST /messaging/threads/{id}/messages — post a message (MCP messaging.messages.post). */
export const postMessage = (threadId: string, body: string) =>
  call<W6aActionEnvelope>(`/messaging/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    body: { body }
  })

/** POST /messaging/messages/{id}/react — react to a message (MCP messaging.messages.react). */
export const reactToMessage = (messageId: string, emoji: string) =>
  call<W6aActionEnvelope>(`/messaging/messages/${encodeURIComponent(messageId)}/react`, {
    method: 'POST',
    body: { emoji }
  })

/** POST /messaging/messages/{id}/read — mark a message read (MCP messaging.messages.read). */
export const markMessageRead = (messageId: string) =>
  call<W6aActionEnvelope>(`/messaging/messages/${encodeURIComponent(messageId)}/read`, { method: 'POST', body: {} })

/** POST /messaging/messages/{id}/attachments — attach a file (MCP messaging.attachments.upload). */
export const uploadAttachment = (messageId: string, input: UploadAttachmentInput) =>
  call<W6aActionEnvelope>(`/messaging/messages/${encodeURIComponent(messageId)}/attachments`, {
    method: 'POST',
    body: input
  })

// ── Notifications (W6a) ─────────────────────────────────────────────────────

export const NOTIFICATIONS_KEY = ['ceodigital', 'notifications'] as const
export const UNREAD_COUNT_KEY = ['ceodigital', 'notifications', 'unread-count'] as const

/** GET /notifications — the caller's notifications (MCP notifications.list). */
export const fetchNotifications = (params?: NotificationsListParams) => {
  const qs = new URLSearchParams()
  if (params?.unreadOnly !== undefined) qs.set('unreadOnly', String(params.unreadOnly))
  if (params?.cursor) qs.set('cursor', params.cursor)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<NotificationsEnvelope>(`/notifications${suffix}`)
}

/** GET /notifications/unread-count — unread count (MCP notifications.unread_count). */
export const fetchUnreadCount = () => call<UnreadCountEnvelope>('/notifications/unread-count')

/** POST /notifications/{id}/read — mark one read (MCP notifications.mark_read). */
export const markNotificationRead = (id: string) =>
  call<W6aActionEnvelope>(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST', body: {} })

/** POST /notifications/read-all — mark all read (MCP notifications.mark_all_read). */
export const markAllNotificationsRead = () =>
  call<W6aActionEnvelope>('/notifications/read-all', { method: 'POST', body: {} })

// ── Timeline (W6a) ──────────────────────────────────────────────────────────

export const TIMELINE_EVENTS_KEY = ['ceodigital', 'timeline', 'events'] as const
export const timelineEventKey = (id: string) => ['ceodigital', 'timeline', 'events', id] as const

/** GET /timeline/events — the activity feed (MCP timeline.events.list). */
export const fetchTimelineEvents = (params?: TimelineEventsParams) => {
  const qs = new URLSearchParams()
  if (params?.entityType) qs.set('entityType', params.entityType)
  if (params?.entityId) qs.set('entityId', params.entityId)
  if (params?.actorUserId) qs.set('actorUserId', params.actorUserId)
  if (params?.eventGlob) qs.set('eventGlob', params.eventGlob)
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.cursor) qs.set('cursor', params.cursor)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<TimelineEventsEnvelope>(`/timeline/events${suffix}`)
}

/** GET /timeline/events/{id} — one event (MCP timeline.events.get). */
export const fetchTimelineEvent = (id: string) =>
  call<TimelineEventEnvelope>(`/timeline/events/${encodeURIComponent(id)}`)

/** POST /timeline/events/{id}/pin — pin an event (MCP timeline.pins.add). */
export const pinEvent = (id: string) =>
  call<W6aActionEnvelope>(`/timeline/events/${encodeURIComponent(id)}/pin`, { method: 'POST', body: {} })

/** POST /timeline/events/{id}/unpin — unpin an event (MCP timeline.pins.remove). */
export const unpinEvent = (id: string) =>
  call<W6aActionEnvelope>(`/timeline/events/${encodeURIComponent(id)}/unpin`, { method: 'POST', body: {} })

/** POST /timeline/events/{id}/reactions — react to an event (MCP timeline.reactions.add). */
export const addEventReaction = (id: string, reactionType: string) =>
  call<W6aActionEnvelope>(`/timeline/events/${encodeURIComponent(id)}/reactions`, {
    method: 'POST',
    body: { reaction_type: reactionType }
  })

/** POST /timeline/events/{id}/reactions/remove — drop a reaction (MCP timeline.reactions.remove). */
export const removeEventReaction = (id: string, reactionType: string) =>
  call<W6aActionEnvelope>(`/timeline/events/${encodeURIComponent(id)}/reactions/remove`, {
    method: 'POST',
    body: { reaction_type: reactionType }
  })

// ── Implementations (W6a) ───────────────────────────────────────────────────

export const IMPL_PROJECTS_KEY = ['ceodigital', 'implementations', 'projects'] as const
export const implProjectKey = (id: string) => ['ceodigital', 'implementations', 'projects', id] as const
export const implPhasesKey = (id: string) => ['ceodigital', 'implementations', 'projects', id, 'phases'] as const
export const implFilesKey = (id: string) => ['ceodigital', 'implementations', 'projects', id, 'files'] as const
export const implMessagesKey = (id: string) => ['ceodigital', 'implementations', 'projects', id, 'messages'] as const

/** GET /implementations/projects — the tenant's implementation projects
 *  (MCP implementations.projects.list). */
export const fetchImplementationProjects = (params?: ImplProjectsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.search) qs.set('search', params.search)
  if (params?.clientVisible !== undefined) qs.set('clientVisible', String(params.clientVisible))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ImplProjectsEnvelope>(`/implementations/projects${suffix}`)
}

/** GET /implementations/projects/{id} — one project (MCP implementations.projects.get). */
export const fetchImplementationProject = (id: string) =>
  call<ImplProjectEnvelope>(`/implementations/projects/${encodeURIComponent(id)}`)

/** GET /implementations/projects/{id}/phases — phases for a project
 *  (MCP implementations.phases.list). */
export const fetchProjectPhases = (id: string, params?: ImplPhasesListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ImplPhasesEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/phases${suffix}`)
}

/** POST /implementations/projects/{id}/status — change project status
 *  (MCP implementations.projects.change_status). */
export const changeProjectStatus = (id: string, status: ProjectStatus | string) =>
  call<W6aActionEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: { status }
  })

/** POST /implementations/projects/{id}/complete — complete a project
 *  (MCP implementations.projects.complete). */
export const completeProject = (id: string) =>
  call<W6aActionEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/complete`, { method: 'POST', body: {} })

/** POST /implementations/projects/{id}/cancel — cancel a project
 *  (MCP implementations.projects.cancel). */
export const cancelProject = (id: string) =>
  call<W6aActionEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: {} })

/** POST /implementations/phases/{id}/status — change a phase status
 *  (MCP implementations.phases.change_status). */
export const changePhaseStatus = (id: string, status: PhaseStatus | string) =>
  call<W6aActionEnvelope>(`/implementations/phases/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: { status }
  })

/** GET /implementations/projects/{id}/files — files on a project
 *  (MCP implementations.files.list). */
export const fetchProjectFiles = (id: string, params?: ImplFilesParams) => {
  const qs = new URLSearchParams()
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ImplFilesEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/files${suffix}`)
}

/** POST /implementations/projects/{id}/messages — post on a project
 *  (MCP implementations.messages.post). */
export const postProjectMessage = (id: string, body: string) =>
  call<W6aActionEnvelope>(`/implementations/projects/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body: { body }
  })

// ── Organization & stakeholders (W6b) — workspaces / departments / members ──

export const WORKSPACES_KEY = ['ceodigital', 'workspaces'] as const
export const workspaceKey = (id: string) => ['ceodigital', 'workspaces', id] as const
export const workspaceMembersKey = (id: string) => ['ceodigital', 'workspaces', id, 'members'] as const
export const DEPARTMENTS_KEY = ['ceodigital', 'departments'] as const
export const departmentKey = (id: string) => ['ceodigital', 'departments', id] as const
export const departmentMembersKey = (id: string) => ['ceodigital', 'departments', id, 'members'] as const
export const MEMBERS_KEY = ['ceodigital', 'members'] as const
export const memberKey = (id: string) => ['ceodigital', 'members', id] as const
export const INTEGRATIONS_KEY = ['ceodigital', 'integrations'] as const
export const integrationKey = (id: string) => ['ceodigital', 'integrations', id] as const

/** GET /workspaces — the tenant's workspaces (MCP workspaces.list). */
export const fetchWorkspaces = (params?: WorkspacesListParams) => {
  const qs = new URLSearchParams()
  if (params?.archived !== undefined) qs.set('archived', String(params.archived))
  if (params?.categoryId) qs.set('categoryId', params.categoryId)
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<WorkspacesEnvelope>(`/workspaces${suffix}`)
}

/** GET /workspaces/{id} — one workspace (MCP workspaces.get). */
export const fetchWorkspace = (id: string) => call<WorkspaceEnvelope>(`/workspaces/${encodeURIComponent(id)}`)

/** GET /workspaces/{id}/members — members of a workspace (MCP workspaces.members.list). */
export const fetchWorkspaceMembers = (id: string): Promise<WorkspaceMembersEnvelope> =>
  call<WorkspaceMembersEnvelope>(`/workspaces/${encodeURIComponent(id)}/members`)

/** POST /workspaces — create a workspace (MCP workspaces.create). */
export const createWorkspace = (input: CreateWorkspaceInput) =>
  call<W6bActionEnvelope>('/workspaces', { method: 'POST', body: input })

/** POST /workspaces/{id}/members — add a member (MCP workspaces.members.add). */
export const addWorkspaceMember = (id: string, body: AddWorkspaceMemberInput) =>
  call<W6bActionEnvelope>(`/workspaces/${encodeURIComponent(id)}/members`, { method: 'POST', body })

/** POST /workspaces/{id}/members/{memberId}/remove — remove a member (MCP workspaces.members.remove). */
export const removeWorkspaceMember = (id: string, memberId: string) =>
  call<W6bActionEnvelope>(`/workspaces/${encodeURIComponent(id)}/members/${encodeURIComponent(memberId)}/remove`, {
    method: 'POST',
    body: {}
  })

/** GET /departments — the tenant's departments (MCP departments.list). */
export const fetchDepartments = (params?: DepartmentsListParams) => {
  const qs = new URLSearchParams()
  if (params?.activeOnly !== undefined) qs.set('activeOnly', String(params.activeOnly))
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<DepartmentsEnvelope>(`/departments${suffix}`)
}

/** GET /departments/{id} — one department (MCP departments.get). */
export const fetchDepartment = (id: string) => call<DepartmentEnvelope>(`/departments/${encodeURIComponent(id)}`)

/** GET /departments/{id}/members — members of a department (MCP departments.members.list). */
export const fetchDepartmentMembers = (id: string): Promise<DepartmentMembersEnvelope> =>
  call<DepartmentMembersEnvelope>(`/departments/${encodeURIComponent(id)}/members`)

/** POST /departments — create a department (MCP departments.create). */
export const createDepartment = (input: CreateDepartmentInput) =>
  call<W6bActionEnvelope>('/departments', { method: 'POST', body: input })

/** POST /departments/{id}/members — add a member (MCP departments.members.add). */
export const addDepartmentMember = (id: string, body: AddDepartmentMemberInput) =>
  call<W6bActionEnvelope>(`/departments/${encodeURIComponent(id)}/members`, { method: 'POST', body })

/** POST /departments/{id}/members/{userId}/remove — remove a member (MCP departments.members.remove). */
export const removeDepartmentMember = (id: string, userId: string) =>
  call<W6bActionEnvelope>(`/departments/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/remove`, {
    method: 'POST',
    body: {}
  })

/** GET /members — the tenant's members (MCP members.list). */
export const fetchMembers = (params?: MembersListParams) => {
  const qs = new URLSearchParams()
  if (params?.role) qs.set('role', params.role)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<MembersEnvelope>(`/members${suffix}`)
}

/** GET /members/{userId} — one tenant member (MCP members.get). */
export const fetchMember = (userId: string) => call<MemberEnvelope>(`/members/${encodeURIComponent(userId)}`)

/** POST /members/invite — invite a member (MCP members.invite). */
export const inviteMember = (input: InviteMemberInput) =>
  call<W6bActionEnvelope>('/members/invite', { method: 'POST', body: input })

/** POST /members/{userId}/revoke — revoke a member (MCP members.revoke). */
export const revokeMember = (userId: string) =>
  call<W6bActionEnvelope>(`/members/${encodeURIComponent(userId)}/revoke`, { method: 'POST', body: {} })

/** POST /members/{userId}/role — update a member's role (MCP members.update_role). */
export const updateMemberRole = (userId: string, role: string) =>
  call<W6bActionEnvelope>(`/members/${encodeURIComponent(userId)}/role`, { method: 'POST', body: { role } })

/** GET /integrations — the tenant's integrations (MCP integrations.list). */
export const fetchIntegrations = (params?: IntegrationsListParams) => {
  const qs = new URLSearchParams()
  if (params?.providerCode) qs.set('providerCode', params.providerCode)
  if (params?.status) qs.set('status', params.status)
  if (params?.scope) qs.set('scope', params.scope)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<IntegrationsEnvelope>(`/integrations${suffix}`)
}

/** GET /integrations/{id} — one integration (MCP integrations.get). */
export const fetchIntegration = (id: string) => call<IntegrationEnvelope>(`/integrations/${encodeURIComponent(id)}`)

/** POST /integrations/{id}/test — test an integration (MCP integrations.test). */
export const testIntegration = (id: string) =>
  call<W6bActionEnvelope>(`/integrations/${encodeURIComponent(id)}/test`, { method: 'POST', body: {} })

/** POST /integrations — connect an integration (MCP integrations.connect). */
export const connectIntegration = (input: ConnectIntegrationInput) =>
  call<W6bActionEnvelope>('/integrations', { method: 'POST', body: input })

/** POST /integrations/{id}/disconnect — disconnect an integration (MCP integrations.disconnect). */
export const disconnectIntegration = (id: string) =>
  call<W6bActionEnvelope>(`/integrations/${encodeURIComponent(id)}/disconnect`, { method: 'POST', body: {} })

// ── Commerce & payments / governance (W7) ───────────────────────────────────

export const ORDERS_KEY = ['ceodigital', 'commerce', 'orders'] as const
export const orderKey = (id: string) => ['ceodigital', 'commerce', 'orders', id] as const
export const PAYMENTS_KEY = ['ceodigital', 'commerce', 'payments'] as const
export const paymentKey = (id: string) => ['ceodigital', 'commerce', 'payments', id] as const

export const DSR_KEY = ['ceodigital', 'governance', 'dsr'] as const
export const CONSENTS_KEY = ['ceodigital', 'governance', 'consents'] as const
export const PROCESSING_RECORDS_KEY = ['ceodigital', 'governance', 'processing-records'] as const
export const RETENTION_KEY = ['ceodigital', 'governance', 'retention'] as const

/** GET /commerce/orders — the tenant's orders (MCP orders.list). */
export const fetchOrders = (params?: OrdersListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.paymentStatus) qs.set('paymentStatus', params.paymentStatus)
  if (params?.fulfillmentStatus) qs.set('fulfillmentStatus', params.fulfillmentStatus)
  if (params?.customerId) qs.set('customerId', params.customerId)
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<OrdersEnvelope>(`/commerce/orders${suffix}`)
}

/** GET /commerce/orders/{id} — one order (MCP orders.get). */
export const fetchOrder = (id: string) => call<OrderEnvelope>(`/commerce/orders/${encodeURIComponent(id)}`)

/** POST /commerce/orders/{id}/status — update status/fulfillment (MCP orders.update_status). */
export const updateOrderStatus = (id: string, body: UpdateOrderStatusInput) =>
  call<W7ActionEnvelope>(`/commerce/orders/${encodeURIComponent(id)}/status`, { method: 'POST', body })

/** GET /commerce/payments — the tenant's payments (MCP payments.list). */
export const fetchPayments = (params?: PaymentsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.orderId) qs.set('orderId', params.orderId)
  if (params?.customerEmail) qs.set('customerEmail', params.customerEmail)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PaymentsEnvelope>(`/commerce/payments${suffix}`)
}

/** GET /commerce/payments/{id} — one payment (MCP payments.get). Optional token. */
export const fetchPayment = (id: string, token?: string) => {
  const suffix = token ? `?token=${encodeURIComponent(token)}` : ''
  return call<PaymentEnvelope>(`/commerce/payments/${encodeURIComponent(id)}${suffix}`)
}

/** POST /commerce/payment-links — create a payment link (MCP payments.links.create). */
export const createPaymentLink = (input: CreatePaymentLinkInput) =>
  call<W7ActionEnvelope>('/commerce/payment-links', { method: 'POST', body: input })

/** POST /commerce/payment-links/{id}/cancel — cancel a payment link (MCP payments.links.cancel). */
export const cancelPaymentLink = (id: string, reason?: string) =>
  call<W7ActionEnvelope>(`/commerce/payment-links/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
    body: reason ? { reason } : {}
  })

/** GET /governance/dsr — data-subject requests (MCP governance.dsr.list). */
export const fetchDsrRequests = (params?: DsrListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.requestType) qs.set('requestType', params.requestType)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<DsrRequestsEnvelope>(`/governance/dsr${suffix}`)
}

/** POST /governance/dsr — create a DSR (MCP governance.dsr.create). */
export const createDsrRequest = (input: CreateDsrRequestInput) =>
  call<W7ActionEnvelope>('/governance/dsr', { method: 'POST', body: input })

/** POST /governance/dsr/{id}/route — route a DSR (MCP governance.dsr.route). */
export const routeDsrRequest = (id: string, body: RouteDsrRequestInput) =>
  call<W7ActionEnvelope>(`/governance/dsr/${encodeURIComponent(id)}/route`, { method: 'POST', body })

/** GET /governance/consents — recorded consents (MCP governance.consents.list). */
export const fetchConsents = (params?: ConsentsListParams) => {
  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ConsentsEnvelope>(`/governance/consents${suffix}`)
}

/** POST /governance/consents — record a consent (MCP governance.consents.record). */
export const recordConsent = (input: RecordConsentInput) =>
  call<W7ActionEnvelope>('/governance/consents', { method: 'POST', body: input })

/** GET /governance/processing-records — processing records (MCP
 *  governance.processing_records.list). */
export const fetchProcessingRecords = (params?: ProcessingRecordsListParams) => {
  const qs = new URLSearchParams()
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<ProcessingRecordsEnvelope>(`/governance/processing-records${suffix}`)
}

/** GET /governance/retention — retention policies (MCP governance.retention.list). */
export const fetchRetentionPolicies = (params?: RetentionListParams) => {
  const qs = new URLSearchParams()
  if (params?.entity) qs.set('entity', params.entity)
  if (params?.isActive !== undefined) qs.set('isActive', String(params.isActive))
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<RetentionEnvelope>(`/governance/retention${suffix}`)
}

// ── W8-UI-a — Labels (labels.*) ───────────────────────────────────────────────

export const LABELS_KEY = ['ceodigital', 'labels'] as const
export const labelKey = (id: string) => ['ceodigital', 'labels', id] as const
export const LABEL_ASSIGNMENTS_KEY = ['ceodigital', 'labels', 'assignments'] as const

/** GET /labels — the tenant's labels (MCP labels.list). */
export const fetchLabels = (params?: LabelsListParams) => {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<LabelsEnvelope>(`/labels${suffix}`)
}

/** GET /labels/{id_or_code} — one label by id or code (MCP labels.get). */
export const fetchLabel = (idOrCode: string) =>
  call<LabelEnvelope>(`/labels/${encodeURIComponent(idOrCode)}`)

/** GET /labels/assignments — label assignments (MCP labels.assignments.list). */
export const fetchLabelAssignments = (params?: LabelAssignmentsParams) => {
  const qs = new URLSearchParams()
  if (params?.labelId) qs.set('labelId', params.labelId)
  if (params?.subjectType) qs.set('subjectType', params.subjectType)
  if (params?.subjectId) qs.set('subjectId', params.subjectId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<LabelAssignmentsEnvelope>(`/labels/assignments${suffix}`)
}

/** POST /labels — create a label (MCP labels.create). */
export const createLabel = (input: CreateLabelInput) =>
  call<W8ActionEnvelope>('/labels', { method: 'POST', body: input })

/** POST /labels/{id}/update — update a label (MCP labels.update). */
export const updateLabel = (id: string, input: UpdateLabelInput) =>
  call<W8ActionEnvelope>(`/labels/${encodeURIComponent(id)}/update`, { method: 'POST', body: input })

/** POST /labels/{id}/assign — assign a label (MCP labels.assign). */
export const assignLabel = (id: string, input: AssignLabelInput) =>
  call<W8ActionEnvelope>(`/labels/${encodeURIComponent(id)}/assign`, { method: 'POST', body: input })

/** POST /labels/{id}/unassign — unassign a label (MCP labels.unassign). */
export const unassignLabel = (id: string) =>
  call<W8ActionEnvelope>(`/labels/${encodeURIComponent(id)}/unassign`, { method: 'POST', body: {} })

// ── W8-UI-a — Dashboards (dashboards.*) ──────────────────────────────────────

export const DASHBOARDS_KEY = ['ceodigital', 'dashboards'] as const
export const dashboardKey = (id: string) => ['ceodigital', 'dashboards', id] as const
export const dashboardWidgetsKey = (id: string) => ['ceodigital', 'dashboards', id, 'widgets'] as const

/** GET /dashboards — the tenant's dashboards (MCP dashboards.list). */
export const fetchDashboards = (params?: DashboardsListParams) => {
  const qs = new URLSearchParams()
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<DashboardsEnvelope>(`/dashboards${suffix}`)
}

/** GET /dashboards/{id} — one dashboard (MCP dashboards.get). */
export const fetchDashboard = (id: string) => call<DashboardEnvelope>(`/dashboards/${encodeURIComponent(id)}`)

/** GET /dashboards/{id}/widgets — a dashboard's widgets (MCP dashboards.widgets.list). */
export const fetchDashboardWidgets = (id: string, params?: { limit?: number }) => {
  const qs = new URLSearchParams()
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<WidgetsEnvelope>(`/dashboards/${encodeURIComponent(id)}/widgets${suffix}`)
}

/** POST /dashboards — create a dashboard (MCP dashboards.create). */
export const createDashboard = (input: CreateDashboardInput) =>
  call<W8ActionEnvelope>('/dashboards', { method: 'POST', body: input })

/** POST /dashboards/{id}/widgets — add a widget (MCP dashboards.widgets.add). */
export const addDashboardWidget = (id: string, input: AddWidgetInput) =>
  call<W8ActionEnvelope>(`/dashboards/${encodeURIComponent(id)}/widgets`, { method: 'POST', body: input })

/** POST /dashboards/widgets/{widgetId}/remove — remove a widget
 *  (MCP dashboards.widgets.remove). */
export const removeDashboardWidget = (widgetId: string) =>
  call<W8ActionEnvelope>(`/dashboards/widgets/${encodeURIComponent(widgetId)}/remove`, {
    method: 'POST',
    body: {}
  })

// ── W8-UI-a — Pricing (pricing.*) ────────────────────────────────────────────

export const PRICING_PROFILES_KEY = ['ceodigital', 'pricing', 'profiles'] as const
export const pricingProfileKey = (id: string) => ['ceodigital', 'pricing', 'profiles', id] as const
export const PRICING_RULES_KEY = ['ceodigital', 'pricing', 'rules'] as const
export const PRICING_EXEMPTIONS_KEY = ['ceodigital', 'pricing', 'exemptions'] as const
export const PRICING_FEES_KEY = ['ceodigital', 'pricing', 'fees'] as const

/** GET /pricing/profiles — the tenant's pricing profiles (MCP pricing.profiles.list). */
export const fetchPricingProfiles = (params?: PricingProfilesListParams) => {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PricingProfilesEnvelope>(`/pricing/profiles${suffix}`)
}

/** GET /pricing/profiles/{id_or_code} — one profile by id or code
 *  (MCP pricing.profiles.get). */
export const fetchPricingProfile = (idOrCode: string) =>
  call<PricingProfileEnvelope>(`/pricing/profiles/${encodeURIComponent(idOrCode)}`)

/** GET /pricing/rules — pricing rules (MCP pricing.rules.list). */
export const fetchPricingRules = (params?: PricingRulesParams) => {
  const qs = new URLSearchParams()
  if (params?.profileId) qs.set('profileId', params.profileId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PricingRulesEnvelope>(`/pricing/rules${suffix}`)
}

/** GET /pricing/exemptions — pricing exemptions (MCP pricing.exemptions.list). */
export const fetchPricingExemptions = (params?: PricingExemptionsParams) => {
  const qs = new URLSearchParams()
  if (params?.sourceType) qs.set('sourceType', params.sourceType)
  if (params?.sourceId) qs.set('sourceId', params.sourceId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PricingExemptionsEnvelope>(`/pricing/exemptions${suffix}`)
}

/** GET /pricing/fees — pricing fees (MCP pricing.fees.list). */
export const fetchPricingFees = (params?: PricingFeesParams) => {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.search) qs.set('search', params.search)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PricingFeesEnvelope>(`/pricing/fees${suffix}`)
}

/** POST /pricing/profiles — create a pricing profile (MCP pricing.profiles.create). */
export const createPricingProfile = (input: CreatePricingProfileInput) =>
  call<W8ActionEnvelope>('/pricing/profiles', { method: 'POST', body: input })

/** POST /pricing/profiles/{id}/update — update a pricing profile
 *  (MCP pricing.profiles.update). */
export const updatePricingProfile = (id: string, input: UpdatePricingProfileInput) =>
  call<W8ActionEnvelope>(`/pricing/profiles/${encodeURIComponent(id)}/update`, {
    method: 'POST',
    body: input
  })

/** POST /pricing/exemptions — add a pricing exemption (MCP pricing.exemptions.add). */
export const addPricingExemption = (input: AddExemptionInput) =>
  call<W8ActionEnvelope>('/pricing/exemptions', { method: 'POST', body: input })

// ── W8-UI-a — Attendance (attendance.*) ──────────────────────────────────────

export const ATTENDANCE_ITEMS_KEY = ['ceodigital', 'attendance', 'items'] as const
export const attendanceItemKey = (id: string) => ['ceodigital', 'attendance', 'items', id] as const

/** GET /attendance/items — the tenant's attendance items (MCP attendance.items.list). */
export const fetchAttendanceItems = (params?: AttendanceItemsParams) => {
  const qs = new URLSearchParams()
  if (params?.kind) qs.set('kind', params.kind)
  if (params?.status) qs.set('status', params.status)
  if (params?.priority) qs.set('priority', params.priority)
  if (params?.assigneeId) qs.set('assigneeId', params.assigneeId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<AttendanceItemsEnvelope>(`/attendance/items${suffix}`)
}

/** GET /attendance/items/{id} — one attendance item (MCP attendance.items.get). */
export const fetchAttendanceItem = (id: string) =>
  call<AttendanceItemEnvelope>(`/attendance/items/${encodeURIComponent(id)}`)

/** POST /attendance/items/{id}/assign — assign an item (MCP attendance.items.assign). */
export const assignAttendanceItem = (id: string, input: AssignAttendanceItemInput) =>
  call<W8ActionEnvelope>(`/attendance/items/${encodeURIComponent(id)}/assign`, {
    method: 'POST',
    body: input
  })

/** POST /attendance/items/{id}/status — update an item's status
 *  (MCP attendance.items.update_status). */
export const updateAttendanceStatus = (id: string, input: UpdateAttendanceStatusInput) =>
  call<W8ActionEnvelope>(`/attendance/items/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    body: input
  })

// ── W8-UI-a — LLM Studio (llm_studio.*) ──────────────────────────────────────

export const DATASETS_KEY = ['ceodigital', 'llmstudio', 'datasets'] as const
export const LLM_JOBS_KEY = ['ceodigital', 'llmstudio', 'jobs'] as const
export const llmJobKey = (id: string) => ['ceodigital', 'llmstudio', 'jobs', id] as const
export const LLM_ADAPTERS_KEY = ['ceodigital', 'llmstudio', 'adapters'] as const
export const LLM_PREFERENCES_KEY = ['ceodigital', 'llmstudio', 'preferences'] as const

/** GET /llmstudio/datasets — LLM Studio datasets (MCP llm_studio.datasets.list). */
export const fetchDatasets = (params?: DatasetsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.sourceType) qs.set('sourceType', params.sourceType)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<DatasetsEnvelope>(`/llmstudio/datasets${suffix}`)
}

/** GET /llmstudio/jobs — LLM Studio jobs (MCP llm_studio.jobs.list). */
export const fetchLlmJobs = (params?: LlmJobsListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.datasetId) qs.set('datasetId', params.datasetId)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<LlmJobsEnvelope>(`/llmstudio/jobs${suffix}`)
}

/** GET /llmstudio/jobs/{id} — one LLM Studio job (MCP llm_studio.jobs.get). */
export const fetchLlmJob = (id: string) => call<LlmJobEnvelope>(`/llmstudio/jobs/${encodeURIComponent(id)}`)

/** GET /llmstudio/adapters — LLM Studio adapters (MCP llm_studio.adapters.list). */
export const fetchLlmAdapters = (params?: LlmAdaptersListParams) => {
  const qs = new URLSearchParams()
  if (params?.status) qs.set('status', params.status)
  if (params?.scope) qs.set('scope', params.scope)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<LlmAdaptersEnvelope>(`/llmstudio/adapters${suffix}`)
}

/** GET /llmstudio/preferences — LLM Studio preferences (MCP llm_studio.preferences.get). */
export const fetchLlmPreferences = () => call<LlmPreferencesEnvelope>('/llmstudio/preferences')

/** POST /llmstudio/adapters/{id}/toggle — toggle an adapter (MCP llm_studio.adapters.toggle). */
export const toggleLlmAdapter = (id: string, input: ToggleAdapterInput) =>
  call<W8ActionEnvelope>(`/llmstudio/adapters/${encodeURIComponent(id)}/toggle`, {
    method: 'POST',
    body: input
  })

/** POST /llmstudio/preferences — update preferences (MCP llm_studio.preferences.update). */
export const updateLlmPreferences = (input: UpdateLlmPreferencesInput) =>
  call<W8ActionEnvelope>('/llmstudio/preferences', { method: 'POST', body: input })

// ── W8-UI-a — Workbench (workbench.pins.*) ───────────────────────────────────

export const PINS_KEY = ['ceodigital', 'workbench', 'pins'] as const

/** GET /workbench/pins — the tenant's workbench pins (MCP workbench.pins.list). */
export const fetchWorkbenchPins = (params?: WorkbenchPinsParams) => {
  const qs = new URLSearchParams()
  if (params?.subjectType) qs.set('subjectType', params.subjectType)
  if (params?.limit !== undefined) qs.set('limit', String(params.limit))
  const suffix = qs.size ? `?${qs.toString()}` : ''
  return call<PinsEnvelope>(`/workbench/pins${suffix}`)
}

/** POST /workbench/pins/toggle — toggle a pin (MCP workbench.pins.toggle). */
export const toggleWorkbenchPin = (input: TogglePinInput) =>
  call<W8ActionEnvelope>('/workbench/pins/toggle', { method: 'POST', body: input })

/** POST /workbench/pins/{id}/note — set a pin's note (MCP workbench.pins.set_note). */
export const setPinNote = (id: string, input: SetPinNoteInput) =>
  call<W8ActionEnvelope>(`/workbench/pins/${encodeURIComponent(id)}/note`, { method: 'POST', body: input })