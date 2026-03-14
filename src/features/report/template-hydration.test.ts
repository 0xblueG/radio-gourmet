import { describe, it, expect } from 'vitest'
import type { JSONContent } from '@tiptap/core'
import type { Lesion, RecistBaseline } from '../../types/measurements'
import { hydrateTemplate, formatLesionItem, buildLesionList } from './template-hydration'

function makeLesion(overrides: Partial<Lesion> = {}): Lesion {
  return {
    id: 'test-id',
    type: 'target',
    organ: 'liver',
    longestDiameter: 15,
    annotationUID: 'ann-1',
    seriesInstanceUID: 'series-1',
    imageId: 'img-1',
    label: 'T1',
    ...overrides,
  }
}

function makeBaseline(overrides: Partial<RecistBaseline> = {}): RecistBaseline {
  return {
    targetLesions: [],
    nonTargetLesions: [],
    sumOfLongestDiameters: 0,
    isValid: true,
    validationErrors: [],
    ...overrides,
  }
}

describe('formatLesionItem', () => {
  it('formats a regular target lesion', () => {
    const lesion = makeLesion({ label: 'T1', organ: 'liver', longestDiameter: 15.3 })
    expect(formatLesionItem(lesion)).toBe('T1 - Liver: 15.3 mm')
  })

  it('formats a lymph node with short axis', () => {
    const lesion = makeLesion({
      label: 'T2',
      organ: 'lymph_node',
      longestDiameter: 25,
      shortAxis: 18.5,
    })
    expect(formatLesionItem(lesion)).toBe('T2 - Lymph Node: 25.0 x 18.5 mm (short axis)')
  })

  it('formats a non-target lesion', () => {
    const lesion = makeLesion({
      label: 'NT1',
      type: 'non-target',
      organ: 'bone',
      longestDiameter: 10,
    })
    expect(formatLesionItem(lesion)).toBe('NT1 - Bone: present')
  })
})

describe('buildLesionList', () => {
  it('returns italic "None" for empty list', () => {
    const result = buildLesionList([])
    expect(result.type).toBe('paragraph')
    expect(result.content?.[0].text).toBe('None')
    expect(result.content?.[0].marks?.[0].type).toBe('italic')
  })

  it('returns a bullet list for lesions', () => {
    const lesions = [
      makeLesion({ label: 'T1', organ: 'liver', longestDiameter: 12 }),
      makeLesion({ label: 'T2', organ: 'lung', longestDiameter: 18 }),
    ]
    const result = buildLesionList(lesions)
    expect(result.type).toBe('bulletList')
    expect(result.content).toHaveLength(2)
    expect(result.content?.[0].type).toBe('listItem')
  })
})

describe('hydrateTemplate', () => {
  it('replaces inline tokens in text nodes', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'SLD: {{sld}} mm' }],
        },
      ],
    }

    const data = makeBaseline({ sumOfLongestDiameters: 42.5 })
    const result = hydrateTemplate(template, data)

    expect(result.content?.[0].content?.[0].text).toBe('SLD: 42.5 mm')
  })

  it('replaces target count and non-target count', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 4 },
          content: [{ type: 'text', text: 'Targets ({{targetCount}}) / Non-Targets ({{nonTargetCount}})' }],
        },
      ],
    }

    const data = makeBaseline({
      targetLesions: [makeLesion(), makeLesion({ id: 'l2', label: 'T2' })],
      nonTargetLesions: [makeLesion({ id: 'nt1', type: 'non-target', label: 'NT1' })],
    })

    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].content?.[0].text).toBe('Targets (2) / Non-Targets (1)')
  })

  it('replaces block placeholder with lesion bullet list', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{targetLesionList}}' }],
        },
      ],
    }

    const targets = [
      makeLesion({ label: 'T1', organ: 'liver', longestDiameter: 15 }),
    ]
    const data = makeBaseline({ targetLesions: targets })

    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].type).toBe('bulletList')
    expect(result.content?.[0].content).toHaveLength(1)
  })

  it('replaces non-target block placeholder with "None" when empty', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{nonTargetLesionList}}' }],
        },
      ],
    }

    const data = makeBaseline()
    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].type).toBe('paragraph')
    expect(result.content?.[0].content?.[0].text).toBe('None')
  })

  it('preserves nodes without placeholders', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Report Title' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Regular text without tokens' }],
        },
      ],
    }

    const data = makeBaseline()
    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].content?.[0].text).toBe('Report Title')
    expect(result.content?.[1].content?.[0].text).toBe('Regular text without tokens')
  })

  it('handles mixed content: placeholders and regular text', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Total SLD: {{sld}} mm across {{targetCount}} targets' }],
        },
      ],
    }

    const data = makeBaseline({
      sumOfLongestDiameters: 55.2,
      targetLesions: [makeLesion(), makeLesion({ id: 'l2', label: 'T2' }), makeLesion({ id: 'l3', label: 'T3' })],
    })

    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].content?.[0].text).toBe('Total SLD: 55.2 mm across 3 targets')
  })

  it('replaces validation status when valid', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Status: {{validationStatus}}' }],
        },
      ],
    }

    const data = makeBaseline({ isValid: true })
    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].content?.[0].text).toBe('Status: Valid')
  })

  it('replaces validation status with errors when invalid', () => {
    const template: JSONContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '{{validationStatus}}' }],
        },
      ],
    }

    const data = makeBaseline({
      isValid: false,
      validationErrors: [
        { rule: 'max-target-lesions', message: 'Too many targets' },
        { rule: 'target-too-small', message: 'T1 too small' },
      ],
    })

    const result = hydrateTemplate(template, data)
    expect(result.content?.[0].content?.[0].text).toBe('Too many targets; T1 too small')
  })
})
