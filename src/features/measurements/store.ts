import { create } from 'zustand'
import type { Lesion, RecistBaseline } from '../../types/measurements'
import { generateLesionLabel, validateBaseline } from './recist'

const EMPTY_BASELINE: RecistBaseline = {
  targetLesions: [],
  nonTargetLesions: [],
  sumOfLongestDiameters: 0,
  isValid: true,
  validationErrors: [],
}

interface MeasurementsState {
  lesions: Lesion[]
  baseline: RecistBaseline
  selectedLesionId: string | null

  addLesion: (data: Omit<Lesion, 'id' | 'label'>) => string
  removeLesion: (id: string) => void
  updateLesion: (
    id: string,
    updates: Partial<Pick<Lesion, 'type' | 'organ' | 'longestDiameter' | 'shortAxis'>>,
  ) => void
  selectLesion: (id: string | null) => void
  clearAll: () => void
}

function relabelLesions(lesions: Lesion[]): Lesion[] {
  let targetIndex = 0
  let nonTargetIndex = 0

  return lesions.map((lesion) => {
    if (lesion.type === 'target') {
      return { ...lesion, label: generateLesionLabel('target', targetIndex++) }
    }
    return { ...lesion, label: generateLesionLabel('non-target', nonTargetIndex++) }
  })
}

function revalidate(lesions: Lesion[]): RecistBaseline {
  const targets = lesions.filter((l) => l.type === 'target')
  const nonTargets = lesions.filter((l) => l.type === 'non-target')
  return validateBaseline(targets, nonTargets)
}

export const useMeasurementsStore = create<MeasurementsState>((set, get) => ({
  lesions: [],
  baseline: EMPTY_BASELINE,
  selectedLesionId: null,

  addLesion: (data) => {
    const id = crypto.randomUUID()
    const { lesions } = get()
    const typeCount = lesions.filter((l) => l.type === data.type).length
    const label = generateLesionLabel(data.type, typeCount)
    const newLesion: Lesion = { ...data, id, label }
    const updated = [...lesions, newLesion]

    set({
      lesions: updated,
      baseline: revalidate(updated),
    })

    return id
  },

  removeLesion: (id) => {
    const { lesions, selectedLesionId } = get()
    const filtered = lesions.filter((l) => l.id !== id)
    const relabeled = relabelLesions(filtered)

    set({
      lesions: relabeled,
      baseline: revalidate(relabeled),
      selectedLesionId: selectedLesionId === id ? null : selectedLesionId,
    })
  },

  updateLesion: (id, updates) => {
    const { lesions } = get()
    let updated = lesions.map((l) => (l.id === id ? { ...l, ...updates } : l))

    // Re-label if type changed
    if (updates.type !== undefined) {
      updated = relabelLesions(updated)
    }

    set({
      lesions: updated,
      baseline: revalidate(updated),
    })
  },

  selectLesion: (id) => {
    set({ selectedLesionId: id })
  },

  clearAll: () => {
    set({
      lesions: [],
      baseline: EMPTY_BASELINE,
      selectedLesionId: null,
    })
  },
}))
