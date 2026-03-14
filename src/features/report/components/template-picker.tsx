import { TEMPLATES } from '../store'
import { useReport } from '../hooks/use-report'

export function TemplatePicker() {
  const { baseline, startReport } = useReport()

  const targetCount = baseline.targetLesions.length
  const hasMeasurements = targetCount > 0 || baseline.nonTargetLesions.length > 0

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h2 className="mb-4 text-center text-lg font-medium text-zinc-300">
          Report Templates
        </h2>

        {/* RECIST data preview */}
        {hasMeasurements && (
          <div className="mb-4 rounded-lg bg-zinc-800/50 px-4 py-3 text-xs text-zinc-400">
            <div className="mb-1 font-medium text-zinc-300">Current Measurements</div>
            <div className="flex justify-between">
              <span>Target lesions</span>
              <span className="text-zinc-300">{targetCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Non-target lesions</span>
              <span className="text-zinc-300">{baseline.nonTargetLesions.length}</span>
            </div>
            <div className="flex justify-between">
              <span>SLD</span>
              <span className="font-mono text-zinc-300">
                {baseline.sumOfLongestDiameters.toFixed(1)} mm
              </span>
            </div>
          </div>
        )}

        {/* Template cards */}
        {TEMPLATES.map((template) => (
          <button
            key={template.id}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-left transition-colors hover:border-blue-500 hover:bg-zinc-800"
            onClick={() => startReport(template.id)}
          >
            <div className="font-medium text-zinc-200">{template.name}</div>
            <div className="mt-1 text-xs text-zinc-500">{template.description}</div>
          </button>
        ))}

        {!hasMeasurements && (
          <p className="mt-4 text-center text-xs text-zinc-600">
            Add measurements in the viewer to auto-fill the report
          </p>
        )}
      </div>
    </div>
  )
}
