import { useMeasurementsStore } from '../store'
import type { Lesion, Organ } from '../../../types/measurements'
import { ORGAN_LABELS } from '../../../types/measurements'

const ORGAN_OPTIONS: Organ[] = [
  'liver',
  'lung',
  'lymph_node',
  'bone',
  'brain',
  'adrenal',
  'kidney',
  'peritoneum',
  'soft_tissue',
  'other',
]

interface LesionListProps {
  onDeleteAnnotation: (annotationUID: string) => void
  onScrollToLesion?: (imageId: string) => void
}

export function LesionList({ onDeleteAnnotation, onScrollToLesion }: LesionListProps) {
  const lesions = useMeasurementsStore((s) => s.lesions)
  const baseline = useMeasurementsStore((s) => s.baseline)
  const selectedLesionId = useMeasurementsStore((s) => s.selectedLesionId)
  const selectLesion = useMeasurementsStore((s) => s.selectLesion)
  const updateLesion = useMeasurementsStore((s) => s.updateLesion)
  const removeLesion = useMeasurementsStore((s) => s.removeLesion)

  const targets = lesions.filter((l) => l.type === 'target')
  const nonTargets = lesions.filter((l) => l.type === 'non-target')

  const handleDelete = (lesion: Lesion) => {
    onDeleteAnnotation(lesion.annotationUID)
    removeLesion(lesion.id)
  }

  const handleClick = (lesion: Lesion) => {
    selectLesion(lesion.id)
    if (onScrollToLesion && lesion.imageId) {
      onScrollToLesion(lesion.imageId)
    }
  }

  const handleTypeToggle = (lesion: Lesion) => {
    updateLesion(lesion.id, {
      type: lesion.type === 'target' ? 'non-target' : 'target',
    })
  }

  const handleOrganChange = (lesion: Lesion, organ: Organ) => {
    updateLesion(lesion.id, { organ })
  }

  if (lesions.length === 0) {
    return (
      <div className="border-t border-zinc-800 p-3">
        <p className="text-xs text-zinc-500">
          No lesions tracked. Use the Length (L) or Bidirectional (B) tool to measure.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col border-t border-zinc-800 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5">
        <span className="font-medium text-zinc-300">RECIST Baseline</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            baseline.isValid
              ? 'bg-emerald-900/50 text-emerald-400'
              : 'bg-amber-900/50 text-amber-400'
          }`}
        >
          {baseline.isValid ? 'Valid' : 'Issues'}
        </span>
      </div>

      {/* Target lesions */}
      <div className="px-3 py-1.5">
        <div className="mb-1 flex items-center justify-between text-zinc-500">
          <span>Target Lesions</span>
          <span>{targets.length}/5</span>
        </div>
        {targets.map((lesion) => (
          <LesionRow
            key={lesion.id}
            lesion={lesion}
            isSelected={selectedLesionId === lesion.id}
            onClick={() => handleClick(lesion)}
            onDelete={() => handleDelete(lesion)}
            onTypeToggle={() => handleTypeToggle(lesion)}
            onOrganChange={(organ) => handleOrganChange(lesion, organ)}
          />
        ))}
      </div>

      {/* Non-target lesions */}
      {nonTargets.length > 0 && (
        <div className="px-3 py-1.5">
          <div className="mb-1 text-zinc-500">Non-Target Lesions</div>
          {nonTargets.map((lesion) => (
            <LesionRow
              key={lesion.id}
              lesion={lesion}
              isSelected={selectedLesionId === lesion.id}
              onClick={() => handleClick(lesion)}
              onDelete={() => handleDelete(lesion)}
              onTypeToggle={() => handleTypeToggle(lesion)}
              onOrganChange={(organ) => handleOrganChange(lesion, organ)}
            />
          ))}
        </div>
      )}

      {/* SLD */}
      <div className="border-t border-zinc-800 px-3 py-1.5">
        <div className="flex items-center justify-between text-zinc-400">
          <span>SLD</span>
          <span className="font-mono">{baseline.sumOfLongestDiameters.toFixed(1)} mm</span>
        </div>
      </div>

      {/* Validation errors */}
      {baseline.validationErrors.length > 0 && (
        <div className="border-t border-zinc-800 px-3 py-1.5">
          {baseline.validationErrors.map((err, i) => (
            <div key={i} className="flex items-start gap-1 text-amber-400">
              <span className="mt-0.5 shrink-0">!</span>
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface LesionRowProps {
  lesion: Lesion
  isSelected: boolean
  onClick: () => void
  onDelete: () => void
  onTypeToggle: () => void
  onOrganChange: (organ: Organ) => void
}

function LesionRow({
  lesion,
  isSelected,
  onClick,
  onDelete,
  onTypeToggle,
  onOrganChange,
}: LesionRowProps) {
  const measurement =
    lesion.type === 'target'
      ? lesion.organ === 'lymph_node' && lesion.shortAxis !== undefined
        ? `${lesion.longestDiameter.toFixed(1)} / ${lesion.shortAxis.toFixed(1)} mm`
        : `${lesion.longestDiameter.toFixed(1)} mm`
      : 'present'

  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 transition-colors ${
        isSelected ? 'bg-blue-900/40 text-blue-300' : 'text-zinc-300 hover:bg-zinc-800'
      }`}
      onClick={onClick}
    >
      {/* Label */}
      <button
        className="shrink-0 rounded bg-zinc-700 px-1 py-0.5 text-[10px] font-medium hover:bg-zinc-600"
        onClick={(e) => {
          e.stopPropagation()
          onTypeToggle()
        }}
        title="Toggle target / non-target"
      >
        {lesion.label}
      </button>

      {/* Organ */}
      <select
        className="min-w-0 flex-1 truncate border-none bg-transparent text-xs text-zinc-400 outline-none"
        value={lesion.organ}
        onChange={(e) => onOrganChange(e.target.value as Organ)}
        onClick={(e) => e.stopPropagation()}
      >
        {ORGAN_OPTIONS.map((organ) => (
          <option key={organ} value={organ}>
            {ORGAN_LABELS[organ]}
          </option>
        ))}
      </select>

      {/* Measurement */}
      <span className="shrink-0 font-mono text-zinc-400">{measurement}</span>

      {/* Delete */}
      <button
        className="shrink-0 text-zinc-600 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        title="Remove lesion"
      >
        x
      </button>
    </div>
  )
}
