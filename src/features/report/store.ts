import { create } from 'zustand'
import type { JSONContent } from '@tiptap/core'
import type { RecistBaseline } from '../../types/measurements'
import type { ReportTemplate } from '../../types/report'
import { recistBaselineTemplate } from './templates/recist-baseline'
import { hydrateTemplate } from './template-hydration'

export const TEMPLATES: ReportTemplate[] = [recistBaselineTemplate]

interface ReportState {
  templateId: string | null
  content: JSONContent | null
  recistSnapshot: RecistBaseline | null

  selectTemplate: (templateId: string, recistData: RecistBaseline) => void
  refreshRecistData: (recistData: RecistBaseline) => void
  updateContent: (content: JSONContent) => void
  resetReport: () => void
}

export const useReportStore = create<ReportState>((set, get) => ({
  templateId: null,
  content: null,
  recistSnapshot: null,

  selectTemplate: (templateId, recistData) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    const hydrated = hydrateTemplate(template.content, recistData)

    set({
      templateId,
      content: hydrated,
      recistSnapshot: recistData,
    })
  },

  refreshRecistData: (recistData) => {
    const { templateId } = get()
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    const hydrated = hydrateTemplate(template.content, recistData)

    set({
      content: hydrated,
      recistSnapshot: recistData,
    })
  },

  updateContent: (content) => {
    set({ content })
  },

  resetReport: () => {
    set({
      templateId: null,
      content: null,
      recistSnapshot: null,
    })
  },
}))
