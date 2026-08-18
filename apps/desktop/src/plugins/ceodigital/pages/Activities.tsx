import { ACTIVITIES_KEY, fetchActivities } from '../api'
import { useCeodigital } from '../i18n'
import type { ActivityRow } from '../types'
import { CrmListPage, type CrmColumn } from './CrmList'

/** Backend timestamps — an ISO string, else epoch seconds, else the raw text. */
function fmtTime(raw: null | string | undefined): string {
  if (!raw) {
    return ''
  }
  const parsed = Date.parse(raw)
  const ms = Number.isNaN(parsed) ? Number(raw) * 1000 : parsed
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : raw
}

/** W1 — CEODigital CRM Activities page (read-only list). The MCP scopes
 *  activities to a subject (lead|deal|person); without one the backend returns
 *  an empty list, so this page reads the tenant-wide list and lets filters land
 *  later with the mutation wave. */
export function ActivitiesPage() {
  const k = useCeodigital()

  const columns: CrmColumn<ActivityRow>[] = [
    { key: 'title', header: k.crm.headers.title, cell: r => r.title },
    {
      key: 'kind',
      header: k.crm.activities.headers.kind,
      cell: r => r.kind ?? k.crm.unassigned
    },
    {
      key: 'created',
      header: k.crm.activities.headers.created,
      cell: r => fmtTime(r.created_at)
    }
  ]

  return (
    <CrmListPage<ActivityRow>
      title={k.crm.activities.title}
      empty={k.crm.activities.empty}
      queryKey={ACTIVITIES_KEY}
      queryFn={fetchActivities as () => Promise<unknown>}
      rowsKey="activities"
      getRowKey={r => r.id}
      columns={columns}
    />
  )
}
