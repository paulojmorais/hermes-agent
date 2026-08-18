import { fetchPersons, PERSONS_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { PersonRow } from '../types'
import { CrmListPage, type CrmColumn } from './CrmList'

/** W1 — CEODigital CRM Persons page (read-only list). */
export function PersonsPage() {
  const k = useCeodigital()

  const columns: CrmColumn<PersonRow>[] = [
    { key: 'title', header: k.crm.headers.title, cell: r => r.title },
    {
      key: 'email',
      header: k.crm.persons.headers.email,
      cell: r => r.email ?? k.crm.unassigned
    },
    {
      key: 'org',
      header: k.crm.persons.headers.org,
      cell: r =>
        (r.organization && typeof r.organization === 'object' && 'name' in r.organization
          ? String((r.organization as { name?: unknown }).name ?? '')
          : (r.organization_id ?? '')) || k.crm.unassigned
    }
  ]

  return (
    <CrmListPage<PersonRow>
      title={k.crm.persons.title}
      empty={k.crm.persons.empty}
      queryKey={PERSONS_KEY}
      queryFn={fetchPersons as () => Promise<unknown>}
      rowsKey="persons"
      getRowKey={r => r.id}
      columns={columns}
    />
  )
}
