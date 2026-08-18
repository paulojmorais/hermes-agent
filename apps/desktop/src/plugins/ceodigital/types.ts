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
