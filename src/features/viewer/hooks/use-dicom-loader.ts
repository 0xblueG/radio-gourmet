import { useState, useCallback } from 'react'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'
import type { Types } from '@cornerstonejs/core'

interface DicomLoaderState {
  imageIds: string[]
  currentIndex: number
  totalSlices: number
  isLoading: boolean
  error: string | null
}

export function useDicomLoader(
  getViewport: () => Types.IStackViewport | null,
  render: () => void,
) {
  const [state, setState] = useState<DicomLoaderState>({
    imageIds: [],
    currentIndex: 0,
    totalSlices: 0,
    isLoading: false,
    error: null,
  })

  const loadFiles = useCallback(
    async (files: File[]) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Filter for DICOM files (no extension check — DICOM files often lack .dcm)
        const imageIds: string[] = []

        for (const file of files) {
          const fileIndex =
            cornerstoneDICOMImageLoader.wadouri.fileManager.add(file)
          // fileManager.add() returns a complete imageId like "dicomfile:0"
          imageIds.push(fileIndex)
        }

        if (imageIds.length === 0) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'No DICOM files found',
          }))
          return
        }

        const viewport = getViewport()
        if (!viewport) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Viewport not ready',
          }))
          return
        }

        viewport.resize()
        await viewport.setStack(imageIds, 0)
        viewport.render()

        setState({
          imageIds,
          currentIndex: 0,
          totalSlices: imageIds.length,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to load DICOM',
        }))
      }
    },
    [getViewport, render],
  )

  return { ...state, loadFiles }
}
