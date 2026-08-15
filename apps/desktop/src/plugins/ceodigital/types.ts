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