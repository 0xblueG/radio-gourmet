import { useState, useCallback } from 'react'
import { ViewerPanel } from '../features/viewer/components/viewer-panel'
import { ReportPanel } from '../features/report/components/report-panel'

const MIN_PANEL_WIDTH_PERCENT = 20
const DEFAULT_SPLIT_PERCENT = 55

export function AppLayout() {
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)

    const handleMouseMove = (e: MouseEvent) => {
      const percent = (e.clientX / window.innerWidth) * 100
      const clamped = Math.min(
        100 - MIN_PANEL_WIDTH_PERCENT,
        Math.max(MIN_PANEL_WIDTH_PERCENT, percent),
      )
      setSplitPercent(clamped)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <div className="flex h-full w-full">
      {/* Left: DICOM Viewer */}
      <div
        className="h-full overflow-hidden"
        style={{ width: `${splitPercent}%` }}
      >
        <ViewerPanel />
      </div>

      {/* Resizable divider */}
      <div
        className={`w-1 cursor-col-resize transition-colors hover:bg-blue-500 ${
          isDragging ? 'bg-blue-500' : 'bg-zinc-700'
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Right: Report Editor */}
      <div
        className="h-full overflow-hidden"
        style={{ width: `${100 - splitPercent}%` }}
      >
        <ReportPanel />
      </div>
    </div>
  )
}
