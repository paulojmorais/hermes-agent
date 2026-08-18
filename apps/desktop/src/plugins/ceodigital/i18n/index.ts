/**
 * Plugin-scoped i18n for CEODigital — parallel bundles per locale
 * (`en`/`pt`/`fr` from the first commit, proving the ownership-map §6 i18n
 * layer), shipped under the plugin id via `ctx.i18n.register` — never touching
 * core `en.ts`. `useCeodigital()` returns the stringly-typed shape-bound
 * translator so the page keeps typed `k.page.title` access; the plugins also
 * carry `pt-PT`/`fr-FR` from the start even though the app's core `Locale`
 * union only selects them after the fork's branding wave extends it.
 */

import { type PluginLocaleBundles, type PluginMessages, type PluginTranslate, usePluginI18n } from '@hermes/plugin-sdk'
import { useMemo } from 'react'

import type { WorkItemStatus } from '../types'
import { en } from './en'
import { fr } from './fr'
import { pt } from './pt'

export { en } from './en'
export { fr } from './fr'
export { pt } from './pt'

/** The message shape W3/W4 renders. Keys: nav.*, page.*, workitem.*, crm.*, errors.*. */
export interface CeodigitalMessages {
  nav: { label: string }
  page: {
    title: string
    empty: string
    openCommand: string
  }
  workitem: {
    status: Partial<Record<WorkItemStatus, string>>
    headers: {
      id: string
      title: string
      status: string
      assignee: string
      updated: string
    }
    unassigned: string
  }
  workitems: {
    title: string
    empty: string
    openCommand: string
    filters: {
      all: string
      mine: string
      dueSoon: string
      awaitingApproval: string
    }
    toolbar: {
      new: string
      suggest: string
      suggestPlaceholder: string
      suggestRun: string
      suggestEmpty: string
    }
    form: {
      title: string
      subjectType: string
      subjectTypePlaceholder: string
      description: string
      due: string
      create: string
      cancel: string
    }
    actions: {
      run: string
      assign: string
      submitOutput: string
      running: string
      assigning: string
      submitting: string
    }
    assign: {
      title: string
      add: string
      remove: string
      role: string
      save: string
      empty: string
    }
    submit: {
      title: string
      runId: string
      output: string
      notes: string
      send: string
    }
    checklist: {
      title: string
      itemLabel: string
      doneLabel: string
      toggle: string
      empty: string
    }
    errors: {
      create: string
      run: string
      assign: string
      submit: string
      checklist: string
      suggest: string
      general: string
    }
  }
  crm: {
    leads: { title: string; empty: string }
    deals: { title: string; empty: string }
    persons: {
      title: string
      empty: string
      headers: { email: string; org: string }
    }
    organizations: {
      title: string
      empty: string
      headers: { industry: string }
    }
    pipelines: {
      title: string
      empty: string
      headers: { subject: string; stages: string }
    }
    stages: {
      title: string
      empty: string
      headers: { probability: string; won: string }
    }
    activities: {
      title: string
      empty: string
      headers: { kind: string; created: string }
    }
    categories: {
      title: string
      empty: string
      headers: { slug: string; active: string }
    }
    headers: { id: string; title: string; status: string; value: string }
    unassigned: string
  }
  agents: {
    title: string
    empty: string
    headers: { name: string; slug: string; status: string; exposed: string }
    workflows: { title: string; empty: string; headers: { name: string; status: string; trigger: string } }
    runs: {
      title: string
      empty: string
      runBtn: string
      promptPlaceholder: string
      executing: string
      runCompleted: string
      runFailed: string
      runPaused: string
      headers: { id: string; status: string; started: string }
      viewSteps: string
      hideSteps: string
      steps: string
    }
    schedules: {
      title: string
      empty: string
      headers: { name: string; cron: string; active: string; lastRun: string }
    }
    pending: {
      title: string
      empty: string
      headers: { tool: string; run: string; status: string }
      goToTenant: string
    }
  }
  services: {
    catalog: {
      title: string
      empty: string
      searchPlaceholder: string
      produces: string
      allProduces: string
      activeOnly: string
      offerings: string
      offeringsEmpty: string
      back: string
      detail: string
      headers: { name: string; code: string; pricing: string; model: string }
    }
    offerings: { title: string; empty: string }
    categories: { title: string; empty: string }
    proposals: {
      title: string
      openCommand: string
      empty: string
      new: string
      back: string
      detail: string
      fields: {
        title: string
        status: string
        description: string
        currency: string
        totalValue: string
        paymentModel: string
        depositPercentage: string
        validUntil: string
        terms: string
        leadId: string
      }
      status: Partial<Record<string, string>>
      actions: {
        send: string
        accept: string
        reject: string
        cancel: string
        duplicate: string
        expire: string
        addItem: string
        addTranche: string
        save: string
        remove: string
        sending: string
        accepting: string
        rejecting: string
        cancelling: string
        duplicating: string
        expiring: string
      }
      reject: { reasonPlaceholder: string; cancel: string }
      items: {
        headers: {
          description: string
          quantity: string
          unitPrice: string
          discount: string
          vatRate: string
          recurrence: string
        }
        empty: string
        form: {
          serviceCatalogId: string
          serviceOfferingId: string
          quantity: string
          unitPrice: string
          discount: string
          vatRate: string
          recurrence: string
          description: string
          sortOrder: string
          add: string
          update: string
          cancel: string
        }
      }
      tranches: {
        headers: { label: string; amount: string; dueDate: string; sortOrder: string }
        empty: string
        form: { label: string; amount: string; dueDate: string; sortOrder: string; add: string; update: string; cancel: string }
      }
      form: {
        title: string
        leadId: string
        description: string
        totalValue: string
        paymentModel: string
        depositPercentage: string
        validUntil: string
        currency: string
        terms: string
        create: string
        cancel: string
      }
      errors: {
        create: string
        send: string
        accept: string
        reject: string
        cancel: string
        duplicate: string
        expire: string
        addItem: string
        updateItem: string
        removeItem: string
        addTranche: string
        updateTranche: string
        removeTranche: string
        fetchProposal: string
        general: string
      }
    }
  }
  errors: {
    fetch: string
    mcp_not_configured: string
    mcp_unreachable: string
    tenant_not_found: string
  }
}

/** Registered via `ctx.i18n.register` at plugin load (disposer tracked). The
 *  `pt`/`fr` keys are NOT in the core `Locale` union yet — that's the branding
 *  fork's later wave — so the map keeps them via an intersection while still
 *  looking like a `PluginLocaleBundles` to the SDK's `register`. */
export const CEODIGITAL_LOCALES: PluginLocaleBundles & Record<'en' | 'pt' | 'fr', PluginMessages> = { en, pt, fr }

// Bind the message SHAPE to a plugin translator: every leaf resolves forward
// through `t(path)`. One tiny generic instead of a hand-written accessor.
type Bound<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => string
    ? (...args: Parameters<T[K]>) => string
    : T[K] extends object
      ? Bound<T[K]>
      : string
}

function bind<T extends object>(t: PluginTranslate, template: T, prefix = ''): Bound<T> {
  const out = {} as Record<string, unknown>

  for (const [key, value] of Object.entries(template)) {
    const path = prefix ? `${prefix}.${key}` : key
    out[key] =
      value && typeof value === 'object'
        ? bind(t, value as object, path)
        : (() => t(path))()
  }

  return out as Bound<T>
}

export type CEODIGITALText = Bound<CeodigitalMessages>

/** The CEODigital strings for the active locale — one hook every page reads. */
export function useCeodigital(): CEODIGITALText {
  const t = usePluginI18n('ceodigital')

  return useMemo(() => bind(t, en), [t])
}

/** Status label — named statuses get their bundle copy, anything else its raw id. */
export const statusLabel = (k: CEODIGITALText, status: string) =>
  k.workitem.status[status as WorkItemStatus] ?? status

/** Proposal status label — named statuses get their bundle copy, else the raw id. */
export const proposalStatusLabel = (k: CEODIGITALText, status: string) =>
  k.services.proposals.status[status] ?? status