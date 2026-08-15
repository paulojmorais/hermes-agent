import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AGENTFLOWS_KEY,
  AGENTS_KEY,
  bindApi,
  DEALS_KEY,
  fetchAgentFlows,
  fetchAgents,
  fetchDeals,
  fetchLeads,
  fetchWorkItem,
  fetchWorkItems,
  LEADS_KEY,
  workItemKey,
  WORKITEMS_KEY
} from './api'
import type { AgentRow, CrmError, CrmRow, WorkItemRow, WorkItemsError, WorkItemsResponse } from './types'

type Rest = <T>(path: string, opts?: unknown) => Promise<T>

const row: WorkItemRow = {
  id: 'wi-42',
  title: 'Ship W3 plugin',
  status: 'ready',
  assignee: 'amina',
  summary: 'The read-only desktop door over the MCP.',
  updated_at: '2026-08-15T09:30:00Z'
}

// The module keeps a single bound door; tests that want a bound door must not
// leak it into the next test (the "not ready" rejections depend on a null rest).
let dispose: null | (() => void) = null

afterEach(() => {
  dispose?.()
  dispose = null
})

describe('ceodigital api', () => {
  it('exposes the namespaced query keys', () => {
    expect(WORKITEMS_KEY).toEqual(['ceodigital', 'workitems'])
    expect(workItemKey('wi-1')).toEqual(['ceodigital', 'workitems', 'wi-1'])
  })

  describe('when bound', () => {
    let rest: ReturnType<typeof vi.fn>

    beforeEach(() => {
      rest = vi.fn()
      dispose = bindApi(rest as unknown as Rest)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('fetches the work-items list through ctx.rest', async () => {
      const envelope: WorkItemsResponse = { ok: true, workitems: [row] }
      rest.mockResolvedValue(envelope)

      await expect(fetchWorkItems()).resolves.toEqual(envelope)
      expect(rest).toHaveBeenCalledTimes(1)
      expect(rest.mock.calls[0][0]).toBe('/workitems')
    })

    it('fetches a single work item by id', async () => {
      const detail = { ok: true, workitem: row }
      rest.mockResolvedValue(detail)

      await expect(fetchWorkItem('wi-1')).resolves.toEqual(detail)
      expect(rest).toHaveBeenCalledWith('/workitems/wi-1')
    })

    it('url-encodes ids on the detail path', async () => {
      rest.mockResolvedValue({ ok: true, workitem: row })

      await fetchWorkItem('wi/slash #1')
      expect(rest).toHaveBeenCalledWith('/workitems/wi%2Fslash%20%231')
    })

    it('passes through the typed error envelope untouched', async () => {
      const error: WorkItemsError = { ok: false, error: 'mcp_not_configured' }
      rest.mockResolvedValue(error)

      await expect(fetchWorkItems()).resolves.toEqual(error)
    })

    it('rejects when the REST door throws (mcp_unreachable surfacing)', async () => {
      rest.mockRejectedValue(new Error('mcp_unreachable'))

      await expect(fetchWorkItems()).rejects.toThrow('mcp_unreachable')
    })
  })

  it('rejects loudly when used before bindApi', async () => {
    await expect(fetchWorkItems()).rejects.toThrow('ceodigital api not ready')
    await expect(fetchWorkItem('wi-1')).rejects.toThrow('ceodigital api not ready')
  })

  it('unbinds after dispose, rejecting subsequent calls', async () => {
    const rest = vi.fn()
    dispose = bindApi(rest as unknown as Rest)
    dispose()
    dispose = null

    await expect(fetchWorkItems()).rejects.toThrow('ceodigital api not ready')
  })

  describe('crm (W4)', () => {
    const lead: CrmRow = { id: 'lead-9', title: 'Acme Corp', status: 'new', value: 1200 }
    const deal: CrmRow = { id: 'deal-3', title: 'Annual contract', status: 'won' }

    it('exposes the CRM query keys', () => {
      expect(LEADS_KEY).toEqual(['ceodigital', 'leads'])
      expect(DEALS_KEY).toEqual(['ceodigital', 'deals'])
    })

    it('when bound, fetches leads and deals through ctx.rest', async () => {
      const rest = vi.fn()
      dispose = bindApi(rest as unknown as Rest)
      rest.mockResolvedValueOnce({ ok: true, leads: [lead] })
      rest.mockResolvedValueOnce({ ok: true, deals: [deal] })

      await expect(fetchLeads()).resolves.toEqual({ ok: true, leads: [lead] })
      await expect(fetchDeals()).resolves.toEqual({ ok: true, deals: [deal] })
      expect(rest).toHaveBeenCalledWith('/leads')
      expect(rest).toHaveBeenCalledWith('/deals')
    })

    it('passes through the typed CRM error envelope', async () => {
      const rest = vi.fn()
      dispose = bindApi(rest as unknown as Rest)
      const error: CrmError = { ok: false, error: 'mcp_unreachable' }
      rest.mockResolvedValue(error)

      await expect(fetchLeads()).resolves.toEqual(error)
    })

    it('rejects loudly when used before bindApi', async () => {
      await expect(fetchLeads()).rejects.toThrow('ceodigital api not ready')
      await expect(fetchDeals()).rejects.toThrow('ceodigital api not ready')
    })
  })

  describe('agents + nativeflows (W5)', () => {
    const agent: AgentRow = {
      id: 'a-1',
      slug: 'ops-lead',
      name: 'Ops Lead',
      description: 'Runs ops',
      status: 'active',
      is_active: true,
      exposed_as_mcp_tool: true
    }

    it('exposes the W5 query keys', () => {
      expect(AGENTS_KEY).toEqual(['ceodigital', 'agents'])
      expect(AGENTFLOWS_KEY).toEqual(['ceodigital', 'agentflows'])
    })

    it('when bound, fetches agents and nativeflows through ctx.rest', async () => {
      const rest = vi.fn()
      dispose = bindApi(rest as unknown as Rest)
      rest.mockResolvedValueOnce({ ok: true, agents: [agent] })
      rest.mockResolvedValueOnce({ ok: true, workflows: [{ id: 'w-1', name: 'Onboarding', status: 'active' }] })

      await expect(fetchAgents()).resolves.toEqual({ ok: true, agents: [agent] })
      await expect(fetchAgentFlows()).resolves.toEqual({
        ok: true,
        workflows: [expect.anything()]
      })
      expect(rest).toHaveBeenCalledWith('/agents')
      expect(rest).toHaveBeenCalledWith('/agentflows')
    })

    it('passes through the typed error envelope', async () => {
      const rest = vi.fn()
      dispose = bindApi(rest as unknown as Rest)
      const error: CrmError = { ok: false, error: 'mcp_not_configured' }
      rest.mockResolvedValue(error)

      await expect(fetchAgents()).resolves.toEqual(error)
    })

    it('rejects loudly when used before bindApi', async () => {
      await expect(fetchAgents()).rejects.toThrow('ceodigital api not ready')
      await expect(fetchAgentFlows()).rejects.toThrow('ceodigital api not ready')
    })
  })
})