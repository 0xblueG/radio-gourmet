import type { ReportTemplate } from '../../../types/report'

export const recistBaselineTemplate: ReportTemplate = {
  id: 'recist-baseline',
  name: 'RECIST 1.1 Baseline',
  description: 'Structured baseline assessment with target and non-target lesion tracking',
  content: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'RECIST 1.1 Baseline Assessment' }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Clinical Information' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'italic' }],
            text: '[Enter clinical information here]',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Technique' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'italic' }],
            text: '[Enter technique details here]',
          },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Findings' }],
      },
      {
        type: 'heading',
        attrs: { level: 4 },
        content: [{ type: 'text', text: 'Target Lesions ({{targetCount}})' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '{{targetLesionList}}' }],
      },
      {
        type: 'heading',
        attrs: { level: 4 },
        content: [{ type: 'text', text: 'Non-Target Lesions ({{nonTargetCount}})' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: '{{nonTargetLesionList}}' }],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Measurements Summary' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Sum of Longest Diameters (SLD): {{sld}} mm' },
        ],
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: 'Impression' }],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            marks: [{ type: 'italic' }],
            text: '[Enter impression here]',
          },
        ],
      },
    ],
  },
}
