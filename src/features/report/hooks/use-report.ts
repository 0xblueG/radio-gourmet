import { useCallback } from 'react'
import { useReportStore } from '../store'
import { useMeasurementsStore } from '../../measurements/store'

export function useReport() {
  const templateId = useReportStore((s) => s.templateId)
  const content = useReportStore((s) => s.content)
  const selectTemplate = useReportStore((s) => s.selectTemplate)
  const refreshRecistData = useReportStore((s) => s.refreshRecistData)
  const updateContent = useReportStore((s) => s.updateContent)
  const resetReport = useReportStore((s) => s.resetReport)

  const baseline = useMeasurementsStore((s) => s.baseline)

  const startReport = useCallback(
    (id: string) => {
      selectTemplate(id, baseline)
    },
    [selectTemplate, baseline],
  )

  const refreshReport = useCallback(() => {
    refreshRecistData(baseline)
  }, [refreshRecistData, baseline])

  return {
    templateId,
    content,
    baseline,
    startReport,
    refreshReport,
    updateContent,
    resetReport,
  }
}
