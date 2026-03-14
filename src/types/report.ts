import type { JSONContent } from '@tiptap/core'
import type { RecistBaseline } from './measurements'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  content: JSONContent
}

export interface Report {
  id: string
  templateId: string
  content: JSONContent
  recistData: RecistBaseline
  createdAt: Date
  exportedAt?: Date
}
