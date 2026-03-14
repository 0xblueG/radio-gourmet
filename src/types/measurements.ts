export type Organ =
  | 'liver'
  | 'lung'
  | 'lymph_node'
  | 'bone'
  | 'brain'
  | 'adrenal'
  | 'kidney'
  | 'peritoneum'
  | 'soft_tissue'
  | 'other'

export type LesionType = 'target' | 'non-target'

export interface Lesion {
  id: string
  type: LesionType
  organ: Organ
  longestDiameter: number // mm
  shortAxis?: number // mm, lymph nodes only
  annotationUID: string // links to Cornerstone3D annotation
  seriesInstanceUID: string
  imageId: string
  label: string // auto-generated: "T1", "NT2", etc.
}

export interface ValidationError {
  rule: string // machine-readable id
  message: string // human-readable
}

export interface RecistBaseline {
  targetLesions: Lesion[]
  nonTargetLesions: Lesion[]
  sumOfLongestDiameters: number // calculated, mm
  isValid: boolean
  validationErrors: ValidationError[]
}

export const ORGAN_LABELS: Record<Organ, string> = {
  liver: 'Liver',
  lung: 'Lung',
  lymph_node: 'Lymph Node',
  bone: 'Bone',
  brain: 'Brain',
  adrenal: 'Adrenal',
  kidney: 'Kidney',
  peritoneum: 'Peritoneum',
  soft_tissue: 'Soft Tissue',
  other: 'Other',
}
