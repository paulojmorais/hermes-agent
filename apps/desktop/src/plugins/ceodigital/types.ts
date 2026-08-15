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