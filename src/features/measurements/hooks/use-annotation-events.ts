import { useEffect, useRef } from 'react'
import { eventTarget } from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools'
import { useMeasurementsStore } from '../store'

const { Events: ToolEvents } = cornerstoneTools.Enums

interface AnnotationDetail {
  annotation: {
    annotationUID: string
    metadata: {
      toolName: string
      referencedImageId?: string
    }
    data: {
      cachedStats: Record<
        string,
        { length?: number; width?: number }
      >
      handles: {
        points: Array<[number, number, number]>
      }
    }
  }
}

function extractMeasurements(annotation: AnnotationDetail['annotation']): {
  longestDiameter: number
  shortAxis?: number
} {
  const stats = annotation.data.cachedStats
  const firstKey = Object.keys(stats)[0]
  if (!firstKey) {
    return { longestDiameter: 0 }
  }

  const entry = stats[firstKey]
  const longestDiameter = entry.length ?? 0
  const toolName = annotation.metadata.toolName

  if (toolName === 'Bidirectional' && entry.width !== undefined) {
    return { longestDiameter, shortAxis: entry.width }
  }

  return { longestDiameter }
}

export function useAnnotationEvents(isReady: boolean) {
  const addLesion = useMeasurementsStore((s) => s.addLesion)
  const updateLesion = useMeasurementsStore((s) => s.updateLesion)
  const removeLesion = useMeasurementsStore((s) => s.removeLesion)

  // Track annotation UIDs managed by the store to avoid duplicate processing
  const managedAnnotations = useRef(new Set<string>())
  // Guard against removal loops (store removal → Cornerstone removal → event → store removal)
  const removingAnnotations = useRef(new Set<string>())

  useEffect(() => {
    if (!isReady) return

    const handleAnnotationCompleted = (evt: Event) => {
      const { annotation } = (evt as CustomEvent).detail as AnnotationDetail
      const { annotationUID, metadata } = annotation

      // Only process Length and Bidirectional tools
      if (metadata.toolName !== 'Length' && metadata.toolName !== 'Bidirectional') return
      if (managedAnnotations.current.has(annotationUID)) return

      const { longestDiameter, shortAxis } = extractMeasurements(annotation)
      const imageId = metadata.referencedImageId ?? ''

      managedAnnotations.current.add(annotationUID)

      addLesion({
        type: 'target',
        organ: 'other',
        longestDiameter,
        shortAxis,
        annotationUID,
        seriesInstanceUID: '',
        imageId,
      })
    }

    const handleAnnotationModified = (evt: Event) => {
      const { annotation } = (evt as CustomEvent).detail as AnnotationDetail
      const { annotationUID, metadata } = annotation

      if (metadata.toolName !== 'Length' && metadata.toolName !== 'Bidirectional') return
      if (!managedAnnotations.current.has(annotationUID)) return

      const { longestDiameter, shortAxis } = extractMeasurements(annotation)

      // Find lesion by annotationUID
      const lesion = useMeasurementsStore.getState().lesions.find(
        (l) => l.annotationUID === annotationUID,
      )
      if (lesion) {
        updateLesion(lesion.id, { longestDiameter, shortAxis })
      }
    }

    const handleAnnotationRemoved = (evt: Event) => {
      const { annotation } = (evt as CustomEvent).detail as AnnotationDetail
      const { annotationUID } = annotation

      if (!managedAnnotations.current.has(annotationUID)) return
      if (removingAnnotations.current.has(annotationUID)) return

      managedAnnotations.current.delete(annotationUID)

      const lesion = useMeasurementsStore.getState().lesions.find(
        (l) => l.annotationUID === annotationUID,
      )
      if (lesion) {
        removeLesion(lesion.id)
      }
    }

    eventTarget.addEventListener(
      ToolEvents.ANNOTATION_COMPLETED,
      handleAnnotationCompleted as EventListener,
    )
    eventTarget.addEventListener(
      ToolEvents.ANNOTATION_MODIFIED,
      handleAnnotationModified as EventListener,
    )
    eventTarget.addEventListener(
      ToolEvents.ANNOTATION_REMOVED,
      handleAnnotationRemoved as EventListener,
    )

    return () => {
      eventTarget.removeEventListener(
        ToolEvents.ANNOTATION_COMPLETED,
        handleAnnotationCompleted as EventListener,
      )
      eventTarget.removeEventListener(
        ToolEvents.ANNOTATION_MODIFIED,
        handleAnnotationModified as EventListener,
      )
      eventTarget.removeEventListener(
        ToolEvents.ANNOTATION_REMOVED,
        handleAnnotationRemoved as EventListener,
      )
    }
  }, [isReady, addLesion, updateLesion, removeLesion])

  // Expose a function to programmatically remove an annotation (from lesion list delete)
  return {
    removeAnnotation: (annotationUID: string) => {
      removingAnnotations.current.add(annotationUID)
      managedAnnotations.current.delete(annotationUID)
      cornerstoneTools.annotation.state.removeAnnotation(annotationUID)
      removingAnnotations.current.delete(annotationUID)
    },
  }
}
