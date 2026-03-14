import type { JSONContent } from '@tiptap/core'
import type { Lesion, RecistBaseline } from '../../types/measurements'
import { ORGAN_LABELS } from '../../types/measurements'

// Block-level placeholders that replace an entire paragraph with structured content
const BLOCK_PLACEHOLDERS = ['{{targetLesionList}}', '{{nonTargetLesionList}}']

function formatLesionItem(lesion: Lesion): string {
  const organ = ORGAN_LABELS[lesion.organ]
  if (lesion.organ === 'lymph_node' && lesion.shortAxis !== undefined) {
    return `${lesion.label} - ${organ}: ${lesion.longestDiameter.toFixed(1)} x ${lesion.shortAxis.toFixed(1)} mm (short axis)`
  }
  if (lesion.type === 'non-target') {
    return `${lesion.label} - ${organ}: present`
  }
  return `${lesion.label} - ${organ}: ${lesion.longestDiameter.toFixed(1)} mm`
}

function buildLesionList(lesions: Lesion[]): JSONContent {
  if (lesions.length === 0) {
    return {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [{ type: 'italic' }],
          text: 'None',
        },
      ],
    }
  }

  return {
    type: 'bulletList',
    content: lesions.map((lesion) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: formatLesionItem(lesion) }],
        },
      ],
    })),
  }
}

function buildInlineReplacements(data: RecistBaseline): Record<string, string> {
  return {
    '{{sld}}': data.sumOfLongestDiameters.toFixed(1),
    '{{targetCount}}': String(data.targetLesions.length),
    '{{nonTargetCount}}': String(data.nonTargetLesions.length),
    '{{validationStatus}}': data.isValid
      ? 'Valid'
      : data.validationErrors.map((e) => e.message).join('; '),
  }
}

function replaceInlineTokens(text: string, replacements: Record<string, string>): string {
  let result = text
  for (const [token, value] of Object.entries(replacements)) {
    result = result.replaceAll(token, value)
  }
  return result
}

function isBlockPlaceholder(node: JSONContent): string | null {
  if (
    node.type === 'paragraph' &&
    node.content?.length === 1 &&
    node.content[0].type === 'text' &&
    node.content[0].text
  ) {
    const text = node.content[0].text.trim()
    if (BLOCK_PLACEHOLDERS.includes(text)) {
      return text
    }
  }
  return null
}

function hydrateNode(
  node: JSONContent,
  data: RecistBaseline,
  replacements: Record<string, string>,
): JSONContent[] {
  // Check for block-level placeholder
  const blockToken = isBlockPlaceholder(node)
  if (blockToken) {
    if (blockToken === '{{targetLesionList}}') {
      return [buildLesionList(data.targetLesions)]
    }
    if (blockToken === '{{nonTargetLesionList}}') {
      return [buildLesionList(data.nonTargetLesions)]
    }
  }

  // Process text nodes for inline replacements
  if (node.type === 'text' && node.text) {
    return [{ ...node, text: replaceInlineTokens(node.text, replacements) }]
  }

  // Recurse into children
  if (node.content) {
    const newContent: JSONContent[] = []
    for (const child of node.content) {
      newContent.push(...hydrateNode(child, data, replacements))
    }
    return [{ ...node, content: newContent }]
  }

  return [node]
}

export function hydrateTemplate(template: JSONContent, data: RecistBaseline): JSONContent {
  const replacements = buildInlineReplacements(data)
  const results = hydrateNode(template, data, replacements)
  return results[0]
}

export { formatLesionItem, buildLesionList }
