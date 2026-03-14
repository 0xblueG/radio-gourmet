import type { Lesion, LesionType, RecistBaseline, ValidationError } from '../../types/measurements'

const MAX_TARGET_LESIONS = 5
const MAX_TARGET_PER_ORGAN = 2
const MIN_TARGET_DIAMETER_MM = 10
const MIN_LYMPH_NODE_SHORT_AXIS_MM = 15

export function validateTargetLesionCount(lesions: Lesion[]): ValidationError[] {
  if (lesions.length > MAX_TARGET_LESIONS) {
    return [
      {
        rule: 'max-target-lesions',
        message: `Too many target lesions: ${lesions.length} (max ${MAX_TARGET_LESIONS})`,
      },
    ]
  }
  return []
}

export function validateTargetLesionsPerOrgan(lesions: Lesion[]): ValidationError[] {
  const errors: ValidationError[] = []
  const countByOrgan = new Map<string, number>()

  for (const lesion of lesions) {
    countByOrgan.set(lesion.organ, (countByOrgan.get(lesion.organ) ?? 0) + 1)
  }

  for (const [organ, count] of countByOrgan) {
    if (count > MAX_TARGET_PER_ORGAN) {
      errors.push({
        rule: 'max-target-per-organ',
        message: `Too many target lesions in ${organ}: ${count} (max ${MAX_TARGET_PER_ORGAN})`,
      })
    }
  }

  return errors
}

export function validateMeasurability(lesion: Lesion): ValidationError[] {
  if (lesion.organ === 'lymph_node') {
    if (lesion.shortAxis === undefined) {
      return [
        {
          rule: 'lymph-node-missing-short-axis',
          message: `${lesion.label}: Lymph node target lesion requires short axis measurement`,
        },
      ]
    }
    if (lesion.shortAxis < MIN_LYMPH_NODE_SHORT_AXIS_MM) {
      return [
        {
          rule: 'lymph-node-too-small',
          message: `${lesion.label}: Lymph node short axis ${lesion.shortAxis.toFixed(1)}mm is below ${MIN_LYMPH_NODE_SHORT_AXIS_MM}mm threshold`,
        },
      ]
    }
    return []
  }

  if (lesion.longestDiameter < MIN_TARGET_DIAMETER_MM) {
    return [
      {
        rule: 'target-too-small',
        message: `${lesion.label}: Longest diameter ${lesion.longestDiameter.toFixed(1)}mm is below ${MIN_TARGET_DIAMETER_MM}mm threshold`,
      },
    ]
  }

  return []
}

/**
 * Sum of Longest Diameters — per RECIST 1.1:
 * - For lymph node targets: use short axis
 * - For all other targets: use longest diameter
 */
export function calculateSLD(lesions: Lesion[]): number {
  return lesions.reduce((sum, lesion) => {
    if (lesion.organ === 'lymph_node' && lesion.shortAxis !== undefined) {
      return sum + lesion.shortAxis
    }
    return sum + lesion.longestDiameter
  }, 0)
}

export function generateLesionLabel(type: LesionType, index: number): string {
  return type === 'target' ? `T${index + 1}` : `NT${index + 1}`
}

export function validateBaseline(
  targetLesions: Lesion[],
  nonTargetLesions: Lesion[],
): RecistBaseline {
  const errors: ValidationError[] = [
    ...validateTargetLesionCount(targetLesions),
    ...validateTargetLesionsPerOrgan(targetLesions),
    ...targetLesions.flatMap(validateMeasurability),
  ]

  return {
    targetLesions,
    nonTargetLesions,
    sumOfLongestDiameters: calculateSLD(targetLesions),
    isValid: errors.length === 0,
    validationErrors: errors,
  }
}
