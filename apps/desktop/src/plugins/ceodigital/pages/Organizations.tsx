import { fetchOrganizations, ORGANIZATIONS_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { OrganizationRow } from '../types'
import { CrmListPage, type CrmColumn } from './CrmList'

/** W1 — CEODigital CRM Organizations page (read-only list). */
export function OrganizationsPage() {
  const k = useCeodigital()

  const columns: CrmColumn<OrganizationRow>[] = [
    { key: 'title', header: k.crm.headers.title, cell: r => r.title },
    {
      key: 'industry',
      header: k.crm.organizations.headers.industry,
      cell: r => r.industry ?? k.crm.unassigned
    }
  ]

  return (
    <CrmListPage<OrganizationRow>
      title={k.crm.organizations.title}
      empty={k.crm.organizations.empty}
      queryKey={ORGANIZATIONS_KEY}
      queryFn={fetchOrganizations as () => Promise<unknown>}
      rowsKey="organizations"
      getRowKey={r => r.id}
      columns={columns}
    />
  )
}
