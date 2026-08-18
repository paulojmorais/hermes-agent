import { fetchPipelines, PIPELINES_KEY } from '../api'
import { useCeodigital } from '../i18n'
import type { PipelineRow } from '../types'
import { CrmListPage, type CrmColumn } from './CrmList'

/** W1 — CEODigital CRM Pipelines page (read-only list, inline stages). */
export function PipelinesPage() {
  const k = useCeodigital()

  const columns: CrmColumn<PipelineRow>[] = [
    { key: 'title', header: k.crm.headers.title, cell: r => r.title },
    {
      key: 'subject',
      header: k.crm.pipelines.headers.subject,
      cell: r => r.subject_type ?? k.crm.unassigned
    },
    {
      key: 'stages',
      header: k.crm.pipelines.headers.stages,
      cell: r => (Array.isArray(r.stages) ? String(r.stages.length) : '0')
    }
  ]

  return (
    <CrmListPage<PipelineRow>
      title={k.crm.pipelines.title}
      empty={k.crm.pipelines.empty}
      queryKey={PIPELINES_KEY}
      queryFn={fetchPipelines as () => Promise<unknown>}
      rowsKey="pipelines"
      getRowKey={r => r.id}
      columns={columns}
    />
  )
}
