import { useEffect, useRef, useState } from 'react'
import { RenderingEngine, Enums, type Types } from '@cornerstonejs/core'
import {
  initializeCornerstone,
  createToolGroup,
  RENDERING_ENGINE_ID,
  VIEWPORT_ID,
} from '../utils/cornerstone-init'

export function useCornerstone() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<RenderingEngine | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let destroyed = false

    const setup = async () => {
      if (!containerRef.current) return

      await initializeCornerstone()

      if (destroyed) return

      const engine = new RenderingEngine(RENDERING_ENGINE_ID)
      engineRef.current = engine

      engine.enableElement({
        viewportId: VIEWPORT_ID,
        element: containerRef.current,
        type: Enums.ViewportType.STACK,
        defaultOptions: {
          background: [0, 0, 0] as Types.Point3,
        },
      })

      createToolGroup(VIEWPORT_ID)

      engine.render()
      setIsReady(true)
    }

    setup()

    // Resize observer to keep viewport in sync with container size
    const resizeObserver = new ResizeObserver(() => {
      if (engineRef.current) {
        engineRef.current.resize(true)
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      destroyed = true
      resizeObserver.disconnect()
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
      setIsReady(false)
    }
  }, [])

  const getViewport = () => {
    return engineRef.current?.getStackViewport(VIEWPORT_ID) ?? null
  }

  const render = () => {
    engineRef.current?.renderViewport(VIEWPORT_ID)
  }

  return { containerRef, isReady, getViewport, render }
}
