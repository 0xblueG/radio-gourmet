import { describe, it, expect } from 'vitest'
import type { Lesion } from '../../types/measurements'
import {
  validateTargetLesionCount,
  validateTargetLesionsPerOrgan,
  validateMeasurability,
  calculateSLD,
  generateLesionLabel,
  validateBaseline,
} from './recist'

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

describe('validateTargetLesionCount', () => {
  it('returns no errors for 0 lesions', () => {
    expect(validateTargetLesionCount([])).toEqual([])
  })

  it('returns no errors for 5 lesions', () => {
    const lesions = Array.from({ length: 5 }, (_, i) =>
      makeLesion({ id: `l${i}`, label: `T${i + 1}` }),
    )
    expect(validateTargetLesionCount(lesions)).toEqual([])
  })

  it('returns error for 6 lesions', () => {
    const lesions = Array.from({ length: 6 }, (_, i) =>
      makeLesion({ id: `l${i}`, label: `T${i + 1}` }),
    )
    const errors = validateTargetLesionCount(lesions)
    expect(errors).toHaveLength(1)
    expect(errors[0].rule).toBe('max-target-lesions')
  })
})

describe('validateTargetLesionsPerOrgan', () => {
  it('returns no errors for 2 lesions in same organ', () => {
    const lesions = [
      makeLesion({ id: 'l1', organ: 'liver' }),
      makeLesion({ id: 'l2', organ: 'liver' }),
    ]
    expect(validateTargetLesionsPerOrgan(lesions)).toEqual([])
  })

  it('returns error for 3 lesions in same organ', () => {
    const lesions = [
      makeLesion({ id: 'l1', organ: 'lung' }),
      makeLesion({ id: 'l2', organ: 'lung' }),
      makeLesion({ id: 'l3', organ: 'lung' }),
    ]
    const errors = validateTargetLesionsPerOrgan(lesions)
    expect(errors).toHaveLength(1)
    expect(errors[0].rule).toBe('max-target-per-organ')
    expect(errors[0].message).toContain('lung')
  })

  it('returns no errors for 2 organs each with 2 lesions', () => {
    const lesions = [
      makeLesion({ id: 'l1', organ: 'liver' }),
      makeLesion({ id: 'l2', organ: 'liver' }),
      makeLesion({ id: 'l3', organ: 'lung' }),
      makeLesion({ id: 'l4', organ: 'lung' }),
    ]
    expect(validateTargetLesionsPerOrgan(lesions)).toEqual([])
  })

  it('returns error only for the violating organ', () => {
    const lesions = [
      makeLesion({ id: 'l1', organ: 'liver' }),
      makeLesion({ id: 'l2', organ: 'liver' }),
      makeLesion({ id: 'l3', organ: 'liver' }),
      makeLesion({ id: 'l4', organ: 'lung' }),
    ]
    const errors = validateTargetLesionsPerOrgan(lesions)
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('liver')
  })
})

describe('validateMeasurability', () => {
  it('accepts non-lymph-node lesion with longestDiameter >= 10mm', () => {
    expect(validateMeasurability(makeLesion({ longestDiameter: 10 }))).toEqual([])
  })

  it('rejects non-lymph-node lesion with longestDiameter < 10mm', () => {
    const errors = validateMeasurability(makeLesion({ longestDiameter: 9.9 }))
    expect(errors).toHaveLength(1)
    expect(errors[0].rule).toBe('target-too-small')
  })

  it('accepts lymph node with shortAxis >= 15mm', () => {
    const lesion = makeLesion({ organ: 'lymph_node', shortAxis: 15 })
    expect(validateMeasurability(lesion)).toEqual([])
  })

  it('rejects lymph node with shortAxis < 15mm', () => {
    const lesion = makeLesion({ organ: 'lymph_node', shortAxis: 14.9 })
    const errors = validateMeasurability(lesion)
    expect(errors).toHaveLength(1)
    expect(errors[0].rule).toBe('lymph-node-too-small')
  })

  it('rejects lymph node with no shortAxis', () => {
    const lesion = makeLesion({ organ: 'lymph_node', shortAxis: undefined })
    const errors = validateMeasurability(lesion)
    expect(errors).toHaveLength(1)
    expect(errors[0].rule).toBe('lymph-node-missing-short-axis')
  })
})

describe('calculateSLD', () => {
  it('returns 0 for empty array', () => {
    expect(calculateSLD([])).toBe(0)
  })

  it('sums longestDiameter for non-lymph-node lesions', () => {
    const lesions = [
      makeLesion({ longestDiameter: 12 }),
      makeLesion({ longestDiameter: 18.5 }),
    ]
    expect(calculateSLD(lesions)).toBeCloseTo(30.5)
  })

  it('uses shortAxis for lymph nodes', () => {
    const lesions = [
      makeLesion({ organ: 'liver', longestDiameter: 12 }),
      makeLesion({ organ: 'lymph_node', longestDiameter: 25, shortAxis: 18 }),
    ]
    // 12 (liver longest) + 18 (lymph node short axis)
    expect(calculateSLD(lesions)).toBeCloseTo(30)
  })

  it('falls back to longestDiameter for lymph node without shortAxis', () => {
    const lesions = [
      makeLesion({ organ: 'lymph_node', longestDiameter: 20, shortAxis: undefined }),
    ]
    expect(calculateSLD(lesions)).toBeCloseTo(20)
  })
})

describe('generateLesionLabel', () => {
  it('generates target label', () => {
    expect(generateLesionLabel('target', 0)).toBe('T1')
    expect(generateLesionLabel('target', 4)).toBe('T5')
  })

  it('generates non-target label', () => {
    expect(generateLesionLabel('non-target', 0)).toBe('NT1')
    expect(generateLesionLabel('non-target', 2)).toBe('NT3')
  })
})

describe('validateBaseline', () => {
  it('returns valid baseline with valid target and non-target lesions', () => {
    const targets = [
      makeLesion({ id: 'l1', organ: 'liver', longestDiameter: 15, label: 'T1' }),
      makeLesion({ id: 'l2', organ: 'lung', longestDiameter: 12, label: 'T2' }),
      makeLesion({ id: 'l3', organ: 'bone', longestDiameter: 20, label: 'T3' }),
    ]
    const nonTargets = [
      makeLesion({ id: 'nt1', type: 'non-target', organ: 'kidney', label: 'NT1' }),
    ]

    const result = validateBaseline(targets, nonTargets)
    expect(result.isValid).toBe(true)
    expect(result.validationErrors).toEqual([])
    expect(result.targetLesions).toHaveLength(3)
    expect(result.nonTargetLesions).toHaveLength(1)
    expect(result.sumOfLongestDiameters).toBeCloseTo(47)
  })

  it('returns invalid baseline when too many targets', () => {
    const targets = Array.from({ length: 6 }, (_, i) =>
      makeLesion({
        id: `l${i}`,
        organ: i % 2 === 0 ? 'liver' : 'lung',
        label: `T${i + 1}`,
      }),
    )

    const result = validateBaseline(targets, [])
    expect(result.isValid).toBe(false)
    expect(result.validationErrors.some((e) => e.rule === 'max-target-lesions')).toBe(true)
  })

  it('returns invalid baseline when too many targets per organ', () => {
    const targets = [
      makeLesion({ id: 'l1', organ: 'liver', label: 'T1' }),
      makeLesion({ id: 'l2', organ: 'liver', label: 'T2' }),
      makeLesion({ id: 'l3', organ: 'liver', label: 'T3' }),
    ]

    const result = validateBaseline(targets, [])
    expect(result.isValid).toBe(false)
    expect(result.validationErrors.some((e) => e.rule === 'max-target-per-organ')).toBe(true)
  })

  it('returns invalid baseline when target is too small', () => {
    const targets = [makeLesion({ longestDiameter: 5, label: 'T1' })]

    const result = validateBaseline(targets, [])
    expect(result.isValid).toBe(false)
    expect(result.validationErrors.some((e) => e.rule === 'target-too-small')).toBe(true)
  })

  it('aggregates multiple validation errors', () => {
    const targets = [
      makeLesion({ id: 'l1', organ: 'liver', longestDiameter: 5, label: 'T1' }),
      makeLesion({ id: 'l2', organ: 'liver', longestDiameter: 8, label: 'T2' }),
      makeLesion({ id: 'l3', organ: 'liver', longestDiameter: 12, label: 'T3' }),
    ]

    const result = validateBaseline(targets, [])
    expect(result.isValid).toBe(false)
    // Should have: max-target-per-organ (3 in liver) + 2x target-too-small
    expect(result.validationErrors.length).toBeGreaterThanOrEqual(3)
  })

  it('computes SLD correctly including lymph nodes', () => {
    const targets = [
      makeLesion({ id: 'l1', organ: 'liver', longestDiameter: 20, label: 'T1' }),
      makeLesion({ id: 'l2', organ: 'lymph_node', longestDiameter: 30, shortAxis: 18, label: 'T2' }),
    ]

    const result = validateBaseline(targets, [])
    // SLD = 20 (liver longest) + 18 (lymph node short axis)
    expect(result.sumOfLongestDiameters).toBeCloseTo(38)
  })
})
