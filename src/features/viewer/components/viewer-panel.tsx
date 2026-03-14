import { useState, useCallback, useEffect } from 'react'
import { useCornerstone } from '../hooks/use-cornerstone'
import { useDicomLoader } from '../hooks/use-dicom-loader'
import { ViewerToolbar } from './viewer-toolbar'
import { setActivePrimaryTool, type ActiveTool } from '../utils/cornerstone-init'
import { useAnnotationEvents } from '../../measurements/hooks/use-annotation-events'
import { LesionList } from '../../measurements/components/lesion-list'

export function ViewerPanel() {
  const { containerRef, isReady, getViewport, render } = useCornerstone()
  const { totalSlices, isLoading, error, loadFiles } = useDicomLoader(
    getViewport,
    render,
  )
  const [activeTool, setActiveTool] = useState<ActiveTool>('WindowLevel')
  const [currentSlice, setCurrentSlice] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  const { removeAnnotation } = useAnnotationEvents(isReady)

  // Track current slice index via Cornerstone events
  useEffect(() => {
    const el = containerRef.current
    if (!el || !isReady) return

    const handleImageRendered = () => {
      const viewport = getViewport()
      if (viewport) {
        setCurrentSlice(viewport.getCurrentImageIdIndex())
      }
    }

    el.addEventListener('CORNERSTONE_IMAGE_RENDERED' as string, handleImageRendered)
    return () => {
      el.removeEventListener('CORNERSTONE_IMAGE_RENDERED' as string, handleImageRendered)
    }
  }, [isReady, containerRef, getViewport])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      const keyMap: Record<string, ActiveTool> = {
        w: 'WindowLevel',
        p: 'Pan',
        z: 'Zoom',
        l: 'Length',
        b: 'Bidirectional',
      }

      const tool = keyMap[e.key.toLowerCase()]
      if (tool) {
        setActivePrimaryTool(tool)
        setActiveTool(tool)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        loadFiles(files)
      }
    },
    [loadFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        loadFiles(files)
      }
    },
    [loadFiles],
  )

  const hasImages = totalSlices > 0

  const handleScrollToLesion = useCallback(
    (imageId: string) => {
      const viewport = getViewport()
      if (!viewport) return
      const imageIds = viewport.getImageIds()
      const index = imageIds.indexOf(imageId)
      if (index >= 0) {
        viewport.setImageIdIndex(index)
      }
    },
    [getViewport],
  )

  return (
    <div className="flex h-full flex-col bg-black">
      <ViewerToolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        sliceInfo={hasImages ? { current: currentSlice, total: totalSlices } : null}
      />

      {/* Viewport container */}
      <div
        className="relative min-h-0 flex-1"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Cornerstone3D viewport */}
        <div ref={containerRef} className="h-full w-full" />

        {/* Drop zone overlay (shown when no images loaded or dragging) */}
        {(!hasImages || isDragOver) && (
          <div
            className={`absolute inset-0 flex items-center justify-center transition-colors ${
              isDragOver ? 'bg-blue-900/30' : hasImages ? 'pointer-events-none' : ''
            }`}
          >
            {!hasImages && !isLoading && (
              <label className="cursor-pointer text-center">
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
                <p className="text-lg text-zinc-500">
                  {isDragOver ? 'Drop DICOM files' : 'Drop DICOM files here'}
                </p>
                {!isDragOver && (
                  <p className="mt-1 text-sm text-zinc-600 underline">
                    or click to browse
                  </p>
                )}
              </label>
            )}

            {isLoading && (
              <p className="text-sm text-zinc-400">Loading DICOM...</p>
            )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="absolute bottom-4 left-4 rounded bg-red-900/80 px-3 py-1.5 text-xs text-red-200">
            {error}
          </div>
        )}
      </div>

      {/* Lesion list */}
      {hasImages && (
        <div className="max-h-[40%] shrink-0 overflow-y-auto">
          <LesionList
            onDeleteAnnotation={removeAnnotation}
            onScrollToLesion={handleScrollToLesion}
          />
        </div>
      )}
    </div>
  )
}
