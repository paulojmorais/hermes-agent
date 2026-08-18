/**
 * The slice of the CEODigital REST contract the W3 read-only page renders.
 * The backend plugin door (`plugins/ceodigital/dashboard/plugin_api.py` —
 * owned by a parallel wave) proxies the CEODigital MCP server, so the renderer
 * only ever sees clean JSON through `ctx.rest` /api/plugins/ceodigital/*.
 */

/** One Projects work item returned by the MCP `workitems_list` proxy. */
export interface WorkItemRow {
  id: string
  title: string
  status: string
  assignee?: null | string
  summary?: null | string
  updated_at?: null | string
}

/** Known failure codes from the backend door. Anything else is a string. */
export type CeodigitalErrorCode = 'mcp_not_configured' | 'mcp_unreachable' | 'tenant_not_found'

/** GET /workitems — success envelope. */
export interface WorkItemsResponse {
  ok: true
  workitems: WorkItemRow[]
}

/** GET /workitems — typed failure envelope. */
export interface WorkItemsError {
  ok: false
  error: CeodigitalErrorCode | string
}

/** GET /workitems/:id — success envelope (detail reuses the row shape on W3). */
export interface WorkItemDetailResponse {
  ok: true
  workitem: WorkItemRow
}

export type WorkItemResponse = WorkItemDetailResponse | WorkItemsError
export type WorkItemsEnvelope = WorkItemsResponse | WorkItemsError

// ── CRM (W4) ────────────────────────────────────────────────────────────────

/** A CRM lead/deal row as returned by the MCP proxy. Minimal fields the W4
 *  pages render; extra fields pass through untouched (backend never strips). */
export interface CrmRow {
  id: string
  title: string
  status: string
  [key: string]: unknown
}

/** GET /leads — success envelope. */
export interface LeadsResponse {
  ok: true
  leads: CrmRow[]
}

/** GET /deals — success envelope. */
export interface DealsResponse {
  ok: true
  deals: CrmRow[]
}

/** Shared typed failure envelope for the CRM reads. */
export interface CrmError {
  ok: false
  error: CeodigitalErrorCode | string
}

export type LeadsEnvelope = LeadsResponse | CrmError
export type DealsEnvelope = DealsResponse | CrmError

// ── CRM (W1) — persons, organizations, pipelines, stages, activities, categories ──

/** A CRM person row (`crm.persons.list` / `crm.persons.get`). */
export interface PersonRow {
  id: string
  title: string
  first_name?: null | string
  last_name?: null | string
  email?: null | string
  organization_id?: null | string
  [key: string]: unknown
}

/** A CRM organization row (`crm.organizations.list` / `crm.organizations.get`). */
export interface OrganizationRow {
  id: string
  title: string
  name?: null | string
  industry?: null | string
  [key: string]: unknown
}

/** A CRM pipeline stage row (`crm.pipelines.list` inline stages / `crm.stages.list`). */
export interface StageRow {
  id: string
  title: string
  name?: null | string
  position?: null | number
  probability?: null | number
  is_won?: null | boolean
  is_lost?: null | boolean
  [key: string]: unknown
}

/** A CRM pipeline row with its inline ordered stages (`crm.pipelines.list`). */
export interface PipelineRow {
  id: string
  title: string
  name?: null | string
  subject_type?: null | string
  is_default?: null | boolean
  stages?: StageRow[]
  [key: string]: unknown
}

/** A CRM activity entry (`crm.activities.list`). */
export interface ActivityRow {
  id: string
  title: string
  kind?: null | string
  body?: null | string
  created_at?: null | string
  subject_type?: null | string
  subject_id?: null | string
  [key: string]: unknown
}

/** A CRM taxonomy category (`crm.categories.list`). */
export interface CategoryRow {
  id: string
  title: string
  label?: null | string
  slug?: null | string
  [key: string]: unknown
}

/** GET /persons — success envelope. */
export interface PersonsResponse {
  ok: true
  persons: PersonRow[]
}

/** GET /persons/{id} — success envelope. */
export interface PersonResponse {
  ok: true
  person: PersonRow
}

/** GET /organizations — success envelope. */
export interface OrganizationsResponse {
  ok: true
  organizations: OrganizationRow[]
}

/** GET /organizations/{id} — success envelope. */
export interface OrganizationResponse {
  ok: true
  organization: OrganizationRow
}

/** GET /pipelines — success envelope. */
export interface PipelinesResponse {
  ok: true
  pipelines: PipelineRow[]
}

/** GET /stages — success envelope. */
export interface StagesResponse {
  ok: true
  stages: StageRow[]
}

/** GET /activities — success envelope. */
export interface ActivitiesResponse {
  ok: true
  activities: ActivityRow[]
}

/** GET /categories — success envelope. */
export interface CategoriesResponse {
  ok: true
  categories: CategoryRow[]
}

export type PersonsEnvelope = PersonsResponse | CrmError
export type PersonEnvelope = PersonResponse | CrmError
export type OrganizationsEnvelope = OrganizationsResponse | CrmError
export type OrganizationEnvelope = OrganizationResponse | CrmError
export type PipelinesEnvelope = PipelinesResponse | CrmError
export type StagesEnvelope = StagesResponse | CrmError
export type ActivitiesEnvelope = ActivitiesResponse | CrmError
export type CategoriesEnvelope = CategoriesResponse | CrmError

// ── Agents + NativeFlows (W5) ──────────────────────────────────────────────

/** A CEO agent row from the catalog (`agents.list`). */
export interface AgentRow {
  id: string
  slug: string
  name: string | null
  description: string | null
  status: string | null | undefined
  is_active: boolean
  exposed_as_mcp_tool?: boolean
  [key: string]: unknown
}

/** A NativeFlow workflow row (`agentflow.workflows.list`). */
export interface AgentFlowRow {
  id: string
  name: string
  status: 'draft' | 'active' | 'archived' | string
  trigger_type?: string
  description?: string | null
  [key: string]: unknown
}

/** GET /agents — success envelope. */
export interface AgentsResponse {
  ok: true
  agents: AgentRow[]
}

/** GET /agentflows — success envelope. */
export interface AgentFlowsResponse {
  ok: true
  workflows: AgentFlowRow[]
}

export type AgentsEnvelope = AgentsResponse | CrmError
export type AgentFlowsEnvelope = AgentFlowsResponse | CrmError

// ── Agent runs + debrief (W5+) ─────────────────────────────────────────────

/** A CEO agent run row (`agent.runs.list`). */
export interface AgentRunRow {
  id: string
  agent_id: string
  conversation_id?: string | null
  status: string
  started_at?: string
  finished_at?: string | null
  cancelled_at?: string | null
  created_by?: string | null
  usage?: Record<string, number> | null
  [key: string]: unknown
}

/** A CEO agent run detail with steps + HITL snapshot (`agent.runs.get`). */
export interface AgentRunDetail extends AgentRunRow {
  version_id?: string | null
  steps?: unknown[]
  hitl_snapshot?: Record<string, unknown> | null
}

/** Immediate result of `agent.<slug>.ask` (ADR-0021 run_debrief shape). */
export interface AgentAskResult {
  run_id: string
  status: 'completed' | 'paused' | 'failed' | 'running' | string
  response_text?: string
  pending_approvals?: Array<{ id: string; tool_name: string; approval_url?: string }>
  steps_summary?: Array<{ kind: string; tool_name?: string; at: string }>
  usage?: Record<string, unknown>
  error?: string
  message?: string
}

/** GET /agents/runs — success envelope. */
export interface AgentRunsResponse {
  ok: true
  runs: AgentRunRow[]
}

/** GET /agents/runs/{id} — success envelope. */
export interface AgentRunResponse {
  ok: true
  run: AgentRunDetail
}

/** POST /agents/{slug}/ask — success envelope. */
export interface AgentAskResponse {
  ok: true
  run: AgentAskResult
}

export type AgentRunsEnvelope = AgentRunsResponse | CrmError
export type AgentRunEnvelope = AgentRunResponse | CrmError
export type AgentAskEnvelope = AgentAskResponse | CrmError

// ── Agent schedules + pending approvals (W5+ cont.) ─────────────────────────

/** An autonomous CEO agent schedule row (`agent.schedules.list`). */
export interface AgentScheduleRow {
  id: string
  agent_id: string
  name: string | null
  prompt?: string | null
  cron_expr?: string | null
  timezone?: string | null
  is_active: boolean
  last_run_at?: string | null
  last_run_status?: string | null
  last_run_id?: string | null
  [key: string]: unknown
}

/** A HITL tool call awaiting decision (`agent.runs.pending_calls.list`). */
export interface PendingCallRow {
  id: string
  run_id?: string | null
  step_index?: number | null
  tool_name: string
  tool_input?: unknown
  status: string
  created_at?: string
  [key: string]: unknown
}

/** GET /agents/schedules — success envelope. */
export interface AgentSchedulesResponse {
  ok: true
  schedules: AgentScheduleRow[]
}

/** GET /agents/pending — success envelope. */
export interface AgentPendingResponse {
  ok: true
  pending: PendingCallRow[]
  /** Deep-link to the tenant HITL approval UI (built server-side, never the token). */
  approval_url: string
}

export type AgentSchedulesEnvelope = AgentSchedulesResponse | CrmError
export type AgentPendingEnvelope = AgentPendingResponse | CrmError

/** Statuses the design doc names; anything the backend adds renders via the
 *  i18n fallback (the raw id). */
export const WORKITEM_STATUSES = [
  'backlog',
  'ready',
  'running',
  'review',
  'blocked',
  'done',
  'failed',
  'archived'
] as const

export type WorkItemStatus = (typeof WORKITEM_STATUSES)[number]

// ── Workitems operational (W2) — create/run/assign/submit/checklist/suggest ──

/** GET /workitems/status — status lens filter values. */
export type WorkItemStatusFilter = 'mine' | 'due_soon' | 'awaiting_approval'

/** GET /workitems/status — success envelope (reuses the row shape). */
export interface WorkItemsStatusResponse {
  ok: true
  workitems: WorkItemRow[]
}

/** GET /workitems/suggest — a matched SOP suggestion row. */
export interface SuggestRow {
  id?: string
  title?: string
  label?: string
  catalog_code?: string
  score?: number
  [key: string]: unknown
}

/** GET /workitems/suggest — success envelope. */
export interface SuggestResponse {
  ok: true
  suggestions: SuggestRow[]
}

/** POST /workitems — create input (maps 1:1 to MCP workitems.create). */
export interface WorkItemInput {
  title: string
  subject_type: string
  description?: string
  catalog_code?: string
  subject_id?: string
  due_at?: string
  inputs?: Record<string, unknown>
  resource_kind?: string
  flow_id?: string
  auto_run?: boolean
}

/** POST /workitems — success envelope (MCP returns the created item). */
export interface CreateWorkItemResponse {
  ok: true
  result: Partial<WorkItemRow> & Record<string, unknown>
}

/** POST /workitems/{id}/run — success envelope. */
export interface RunWorkItemResponse {
  ok: true
  result: { run_id?: string; status?: string } & Record<string, unknown>
}

/** POST /workitems/{id}/assign — input body. */
export interface AssignBody {
  add?: string[]
  remove?: string[]
  role?: string
}

/** POST /workitems/{id}/assign — success envelope. */
export interface AssignWorkItemResponse {
  ok: true
  result: Record<string, unknown>
}

/** POST /workitems/{id}/submit — input body. */
export interface SubmitBody {
  run_id: string
  output: Record<string, unknown>
  notes?: string
}

/** POST /workitems/{id}/submit — success envelope. */
export interface SubmitWorkItemResponse {
  ok: true
  result: Record<string, unknown>
}

/** POST /workitems/{id}/checklist — input body. */
export interface ChecklistToggleBody {
  checklist_item_id: string
  done: boolean
}

/** POST /workitems/{id}/checklist — success envelope. */
export interface ChecklistToggleResponse {
  ok: true
  result: Record<string, unknown>
}

/** Shared typed failure envelope for the operational (W2) actions. */
export type WorkItemActionError = CrmError

export type WorkItemsStatusEnvelope = WorkItemsStatusResponse | CrmError
export type SuggestEnvelope = SuggestResponse | CrmError
export type CreateWorkItemEnvelope = CreateWorkItemResponse | CrmError
export type RunWorkItemEnvelope = RunWorkItemResponse | CrmError
export type AssignWorkItemEnvelope = AssignWorkItemResponse | CrmError
export type SubmitWorkItemEnvelope = SubmitWorkItemResponse | CrmError
export type ChecklistToggleEnvelope = ChecklistToggleResponse | CrmError

// ── Services & Proposals (W3) ──────────────────────────────────────────────

/** A services catalog item (`services.catalog.list` / `get`). */
export interface CatalogRow {
  id: string
  title: string
  name?: null | string
  code?: null | string
  pricing?: null | string
  produces?: null | string
  is_active?: null | boolean
  [key: string]: unknown
}

/** A service offering (`services.offerings.list` / `get`). */
export interface OfferingRow {
  id: string
  title: string
  name?: null | string
  service_catalog_id?: null | string
  serviceCatalogId?: null | string
  pricing_model?: null | string
  pricingModel?: null | string
  is_active?: null | boolean
  isActive?: null | boolean
  [key: string]: unknown
}

/** A proposal payment tranche (`services.proposals.get`, normalized). */
export interface ProposalTranche {
  id: string
  label: string
  amount?: null | number
  due_date?: null | string
  sort_order?: null | number
  [key: string]: unknown
}

/** A proposal line item (`services.proposals.get`, normalized). */
export interface ProposalItem {
  id: string
  description: string
  service_catalog_id?: null | string
  serviceCatalogId?: null | string
  service_offering_id?: null | string
  serviceOfferingId?: null | string
  quantity?: null | number
  unit_price?: null | number
  discount?: null | number
  vat_rate?: null | number
  recurrence?: null | string
  sort_order?: null | number
  [key: string]: unknown
}

/** A services proposal (`services.proposals.list` / `get`, normalized). */
export interface ProposalRow {
  id: string
  title: string
  name?: null | string
  status: string
  lead_id?: null | string
  leadId?: null | string
  description?: null | string
  currency?: null | string
  total_value?: null | number
  totalValue?: null | number
  value?: null | number
  payment_model?: null | string
  paymentModel?: null | string
  deposit_percentage?: null | number
  depositPercentage?: null | number
  valid_until?: null | string
  validUntil?: null | string
  terms?: null | string
  items?: ProposalItem[]
  tranches?: ProposalTranche[]
  [key: string]: unknown
}

// ── Services reads — query params + envelopes ───────────────────────────────

/** GET /services/catalog — list query params (map 1:1 to MCP). */
export interface CatalogListParams {
  active?: boolean
  search?: string
  produces?: string
  limit?: number
}

/** GET /services/offerings — list query params (map 1:1 to MCP). */
export interface OfferingsListParams {
  serviceCatalogId?: string
  pricingModel?: string
  isActive?: boolean
  limit?: number
}

/** GET /services/categories — list query params (map 1:1 to MCP). */
export interface ServiceCategoriesParams {
  parentId?: string
  isActive?: boolean
  limit?: number
}

/** GET /services/proposals — list query params (map 1:1 to MCP). */
export interface ProposalsListParams {
  status?: string
  search?: string
  limit?: number
}

/** GET /services/catalog — success envelope. */
export interface CatalogResponse {
  ok: true
  catalog: CatalogRow[]
}

/** GET /services/catalog/{id} — success envelope. */
export interface CatalogItemResponse {
  ok: true
  item: CatalogRow
}

/** GET /services/offerings — success envelope. */
export interface OfferingsResponse {
  ok: true
  offerings: OfferingRow[]
}

/** GET /services/offerings/{id} — success envelope. */
export interface OfferingResponse {
  ok: true
  offering: OfferingRow
}

/** GET /services/proposals — success envelope. */
export interface ProposalsResponse {
  ok: true
  proposals: ProposalRow[]
}

/** GET /services/proposals/{id} — success envelope. */
export interface ProposalResponse {
  ok: true
  proposal: ProposalRow
}

/** POST /services/proposals — success envelope (raw MCP result). */
export interface CreateProposalResponse {
  ok: true
  result: Record<string, unknown>
}

/** POST /services/proposals/{id}/... — mutation success envelope. */
export interface ProposalActionResultResponse {
  ok: true
  result: Record<string, unknown>
}

// ── Services mutations — input bodies ───────────────────────────────────────

/** POST /services/proposals — create input (maps 1:1 to MCP). */
export interface CreateProposalInput {
  title: string
  leadId?: string
  description?: string
  currency?: string
  totalValue?: number
  paymentModel?: string
  depositPercentage?: number
  validUntil?: string
  terms?: string
}

/** POST /services/proposals/{id}/update — body (null clears a field). */
export interface UpdateProposalInput {
  title?: string
  description?: string | null
  currency?: string
  terms?: string | null
}

/** Line-item mutation values (`services.proposals.items.add|update`). */
export interface ProposalItemValues {
  serviceCatalogId: string
  serviceOfferingId?: string
  quantity?: number
  unitPrice: number
  discount?: number
  vatRate?: number
  recurrence?: string
  description?: string
  sortOrder?: number
}

/** Tranche mutation values (`services.proposals.tranches.add|update`). */
export interface ProposalTrancheValues {
  label: string
  amount: number
  dueDate?: string
  sortOrder?: number
}

/** Typed failure envelope shared by the services reads/mutations. */
export type ServicesError = CrmError

export type CatalogEnvelope = CatalogResponse | ServicesError
export type CatalogItemEnvelope = CatalogItemResponse | ServicesError
export type OfferingsEnvelope = OfferingsResponse | ServicesError
export type OfferingEnvelope = OfferingResponse | ServicesError
export type ProposalsEnvelope = ProposalsResponse | ServicesError
export type ProposalEnvelope = ProposalResponse | ServicesError
export type CreateProposalEnvelope = CreateProposalResponse | ServicesError
export type ProposalActionEnvelope = ProposalActionResultResponse | ServicesError

// ── Automation (W4) — conversations ─────────────────────────────────────────

/** A conversation row (`conversations.list` / `conversations.get`). */
export interface ConversationRow {
  id: string
  title: string
  is_archived: boolean
  isArchived?: boolean
  model?: null | string
  system_prompt?: null | string
  systemPrompt?: null | string
  workspace_id?: null | string
  tags?: null | string[]
  [key: string]: unknown
}

/** GET /automation/conversations — list query params (map 1:1 to MCP). */
export interface ConversationsListParams {
  isArchived?: boolean
  search?: string
  limit?: number
}

/** POST /automation/conversations — create input (all fields optional in MCP). */
export interface CreateConversationInput {
  title?: string
  systemPrompt?: string
  model?: string
  tags?: string[]
  workspaceId?: string
}

/** GET /automation/conversations — success envelope. */
export interface ConversationsResponse {
  ok: true
  conversations: ConversationRow[]
}

/** GET /automation/conversations/{id} — success envelope. */
export interface ConversationResponse {
  ok: true
  conversation: ConversationRow
}

export type ConversationsEnvelope = ConversationsResponse | CrmError
export type ConversationEnvelope = ConversationResponse | CrmError

// ── Automation (W4) — playbooks (+ runs) ───────────────────────────────────

/** A playbook row (`playbooks.list` / `playbooks.get`). */
export interface PlaybookRow {
  id: string
  title: string
  name?: null | string
  code?: null | string
  subject_type?: null | string
  subjectType?: null | string
  is_active: boolean
  isActive?: boolean
  description?: null | string
  [key: string]: unknown
}

/** A playbook run row (`playbook.runs.list`). */
export interface PlaybookRunRow {
  id: string
  status: string
  playbook_id?: null | string
  subject_type?: null | string
  subject_id?: null | string
  started_at?: null | string
  finished_at?: null | string
  [key: string]: unknown
}

/** GET /automation/playbooks — list query params. */
export interface PlaybooksListParams {
  subjectType?: string
  isActive?: boolean
  limit?: number
}

/** GET /automation/playbooks/runs — list query params. */
export interface PlaybookRunsListParams {
  playbookId?: string
  status?: 'active' | 'completed' | 'cancelled' | string
  subjectType?: string
  subjectId?: string
  limit?: number
}

/** POST /automation/playbooks/{id}/run — input body. */
export interface RunPlaybookInput {
  subjectType: string
  subjectId?: string
}

/** GET /automation/playbooks — success envelope. */
export interface PlaybooksResponse {
  ok: true
  playbooks: PlaybookRow[]
}

/** GET /automation/playbooks/{id} — success envelope. */
export interface PlaybookResponse {
  ok: true
  playbook: PlaybookRow
}

/** GET /automation/playbooks/runs — success envelope. */
export interface PlaybookRunsResponse {
  ok: true
  runs: PlaybookRunRow[]
}

export type PlaybooksEnvelope = PlaybooksResponse | CrmError
export type PlaybookEnvelope = PlaybookResponse | CrmError
export type PlaybookRunsEnvelope = PlaybookRunsResponse | CrmError

// ── Automation (W4) — NativeFlow (workflows / runs / webhooks / schedules) ──

/** A NativeFlow workflow row (`agentflow.workflows.list` / `get`). */
export interface WorkflowRow {
  id: string
  name: string
  status: 'draft' | 'active' | 'archived' | string
  trigger_type?: null | string
  triggerType?: null | string
  description?: null | string
  [key: string]: unknown
}

/** A NativeFlow run row (`agentflow.runs.list`). */
export interface WorkflowRunRow {
  id: string
  status: string
  workflow_id?: null | string
  started_at?: null | string
  finished_at?: null | string
  error?: null | string
  [key: string]: unknown
}

/** A NativeFlow webhook row (`agentflow.webhooks.list`). */
export interface WebhookRow {
  id: string
  url: string
  is_active: boolean
  isActive?: boolean
  workflow_id?: null | string
  workflowId?: null | string
  [key: string]: unknown
}

/** A NativeFlow schedule row (`agentflow.schedules.list`). */
export interface ScheduleRow {
  id: string
  is_active: boolean
  isActive?: boolean
  workflow_id?: null | string
  cron_expr?: null | string
  cronExpr?: null | string
  [key: string]: unknown
}

/** GET /automation/workflows — list query params. */
export interface WorkflowsListParams {
  status?: 'draft' | 'active' | 'archived' | string
  triggerType?: 'manual' | 'webhook' | 'schedule' | 'event' | 'api' | string
  limit?: number
}

/** POST /automation/workflows/{id}/run — input body (MCP agentflow.run). */
export interface RunWorkflowInput {
  input?: Record<string, unknown>
}

/** GET /automation/workflows/{id}/webhooks — list query params. */
export interface WebhooksListParams {
  active?: boolean
  limit?: number
}

/** GET /automation/workflows/{id}/schedules — list query params. */
export interface SchedulesListParams {
  active?: boolean
  limit?: number
}

/** GET /automation/workflows — success envelope. */
export interface WorkflowsResponse {
  ok: true
  workflows: WorkflowRow[]
}

/** GET /automation/workflows/{id} — success envelope. */
export interface WorkflowResponse {
  ok: true
  workflow: WorkflowRow
}

/** GET /automation/workflows/{id}/runs — success envelope. */
export interface WorkflowRunsResponse {
  ok: true
  runs: WorkflowRunRow[]
}

/** GET /automation/workflows/{id}/webhooks — success envelope. */
export interface WebhooksResponse {
  ok: true
  webhooks: WebhookRow[]
}

/** GET /automation/workflows/{id}/schedules — success envelope. */
export interface SchedulesResponse {
  ok: true
  schedules: ScheduleRow[]
}

export type WorkflowsEnvelope = WorkflowsResponse | CrmError
export type WorkflowEnvelope = WorkflowResponse | CrmError
export type WorkflowRunsEnvelope = WorkflowRunsResponse | CrmError
export type WebhooksEnvelope = WebhooksResponse | CrmError
export type SchedulesEnvelope = SchedulesResponse | CrmError

/** Mutation success envelope shared by the automation actions (raw MCP result). */
export interface AutomationActionResponse {
  ok: true
  result: Record<string, unknown>
}

export type AutomationActionEnvelope = AutomationActionResponse | CrmError

// ── Documents & RAG (W5) — files, collections, bindings, search ──────────────

export type DocumentVisibility = 'draft' | 'internal' | 'shared' | 'public'
export type BindingEntityType =
  | 'project'
  | 'task'
  | 'crm_org'
  | 'crm_deal'
  | 'service_impl'
  | 'chat_conv'
export type BindingDirection = 'input' | 'output'

/** A document file row (`documents.files.list` / `documents.files.get`). */
export interface FileRow {
  id: string
  title: string
  name?: null | string
  filename?: null | string
  namespace?: null | string
  visibility?: null | DocumentVisibility | string
  mime_type?: null | string
  mimeType?: null | string
  size?: null | number
  collection_id?: null | string
  collectionId?: null | string
  created_at?: null | string
  updated_at?: null | string
  [key: string]: unknown
}

/** A document collection row (`documents.collections.list`). */
export interface CollectionRow {
  id: string
  title: string
  name?: null | string
  description?: null | string
  color?: null | string
  icon?: null | string
  parent_id?: null | string
  parentId?: null | string
  [key: string]: unknown
}

/** An entity document-binding row (`documents.bindings.list`). */
export interface BindingRow {
  id: string
  entityType?: null | BindingEntityType | string
  entityType_?: null | string
  entityId?: null | string
  direction?: null | BindingDirection | string
  bindingId?: null | string
  binding_id?: null | string
  targetRef?: null | Record<string, unknown>
  target_ref?: null | Record<string, unknown>
  syncMode?: null | string
  publishMode?: null | string
  ragIndex?: null | boolean
  outputFormat?: null | string
  nameTemplate?: null | string
  [key: string]: unknown
}

/** A RAG search result (`searchDocuments`). */
export interface SearchResultRow {
  id: string
  title: string
  score?: null | number
  snippet?: null | string
  document_id?: null | string
  documentId?: null | string
  namespace?: null | string
  [key: string]: unknown
}

// ── Documents — read envelopes ────────────────────────────────────────────────

/** GET /documents/files — list query params (map 1:1 to MCP). */
export interface FilesListParams {
  search?: string
  collectionId?: string
  namespace?: string
  visibility?: DocumentVisibility | string
  limit?: number
}

/** GET /documents/bindings — list query params (entityType + entityId required). */
export interface BindingsListParams {
  entityType: BindingEntityType | string
  entityId: string
  direction?: BindingDirection | string
  limit?: number
}

/** GET /documents/search — query params. */
export interface SearchParams {
  query: string
  namespaces?: string[]
  maxResults?: number
}

/** GET /documents/search — success envelope. */
export interface SearchResponse {
  ok: true
  results: SearchResultRow[]
}

/** GET /documents/files — success envelope. */
export interface FilesResponse {
  ok: true
  files: FileRow[]
}

/** GET /documents/files/{id} — success envelope. */
export interface FileResponse {
  ok: true
  file: FileRow
}

/** GET /documents/collections — success envelope. */
export interface CollectionsResponse {
  ok: true
  collections: CollectionRow[]
}

/** GET /documents/bindings — success envelope. */
export interface BindingsResponse {
  ok: true
  bindings: BindingRow[]
}

// ── Documents — mutation inputs & envelopes ──────────────────────────────────

/** POST /documents/files/upload — input (name + base64 content required). */
export interface UploadFileInput {
  name: string
  contentBase64: string
  mimeType?: string
  namespace?: string
  collectionId?: string
}

/** POST /documents/files/{id}/move — input body. */
export interface MoveFileInput {
  targetNamespace?: string
  targetCollectionId?: string | null
}

/** POST /documents/collections — create input (name required). */
export interface CreateCollectionInput {
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
}

/** POST /documents/bindings — attach input (entityType/entityId/direction/bindingId required). */
export interface AttachBindingInput {
  entityType: BindingEntityType | string
  entityId: string
  direction: BindingDirection | string
  bindingId: string
  targetRef?: Record<string, unknown>
  syncMode?: 'manual' | 'on_demand' | 'watch'
  publishMode?: 'manual' | 'auto' | 'on_approve'
  ragIndex?: boolean
  outputFormat?: 'pdf' | 'docx' | 'xlsx' | 'page' | 'md'
  nameTemplate?: string
}

/** POST /documents/reindex — input (namespace required). */
export interface ReindexInput {
  namespace: string
  fullReindex?: boolean
}

/** POST /documents/** — mutation success envelope (raw MCP result). */
export interface DocumentsActionResponse {
  ok: true
  result: Record<string, unknown>
}

export type SearchEnvelope = SearchResponse | CrmError
export type FilesEnvelope = FilesResponse | CrmError
export type FileEnvelope = FileResponse | CrmError
export type CollectionsEnvelope = CollectionsResponse | CrmError
export type BindingsEnvelope = BindingsResponse | CrmError
export type DocumentsActionEnvelope = DocumentsActionResponse | CrmError
