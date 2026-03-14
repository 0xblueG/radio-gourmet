import { init as initCore } from '@cornerstonejs/core'
import * as cornerstoneTools from '@cornerstonejs/tools'
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader'

const {
  init: initTools,
  addTool,
  Enums: ToolEnums,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  LengthTool,
  BidirectionalTool,
  ToolGroupManager,
} = cornerstoneTools

const { MouseBindings } = ToolEnums

export const TOOL_GROUP_ID = 'radio-gourmet-tools'
export const RENDERING_ENGINE_ID = 'radio-gourmet-engine'
export const VIEWPORT_ID = 'dicom-viewport'

let initialized = false

export async function initializeCornerstone(): Promise<void> {
  if (initialized) return

  // 1. Core
  initCore()

  // 2. DICOM image loader
  cornerstoneDICOMImageLoader.init()
  cornerstoneDICOMImageLoader.wadouri.register()

  // 3. Tools
  initTools()

  // Register tools globally
  addTool(WindowLevelTool)
  addTool(PanTool)
  addTool(ZoomTool)
  addTool(StackScrollTool)
  addTool(LengthTool)
  addTool(BidirectionalTool)

  initialized = true
}

export function createToolGroup(viewportId: string): void {
  const existing = ToolGroupManager.getToolGroup(TOOL_GROUP_ID)
  if (existing) {
    ToolGroupManager.destroyToolGroup(TOOL_GROUP_ID)
  }

  const toolGroup = ToolGroupManager.createToolGroup(TOOL_GROUP_ID)
  if (!toolGroup) return

  toolGroup.addViewport(viewportId, RENDERING_ENGINE_ID)

  // Add all tools
  toolGroup.addTool(WindowLevelTool.toolName)
  toolGroup.addTool(PanTool.toolName)
  toolGroup.addTool(ZoomTool.toolName)
  toolGroup.addTool(StackScrollTool.toolName)
  toolGroup.addTool(LengthTool.toolName)
  toolGroup.addTool(BidirectionalTool.toolName)

  // Default bindings
  toolGroup.setToolActive(WindowLevelTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  })
  toolGroup.setToolActive(PanTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Auxiliary }],
  })
  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Secondary }],
  })
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Wheel }],
  })
}

export type ActiveTool = 'WindowLevel' | 'Pan' | 'Zoom' | 'Length' | 'Bidirectional'

export function setActivePrimaryTool(tool: ActiveTool): void {
  const toolGroup = ToolGroupManager.getToolGroup(TOOL_GROUP_ID)
  if (!toolGroup) return

  const toolNameMap: Record<ActiveTool, string> = {
    WindowLevel: WindowLevelTool.toolName,
    Pan: PanTool.toolName,
    Zoom: ZoomTool.toolName,
    Length: LengthTool.toolName,
    Bidirectional: BidirectionalTool.toolName,
  }

  // Set all primary-bindable tools to passive first
  const primaryTools = [
    WindowLevelTool.toolName,
    PanTool.toolName,
    ZoomTool.toolName,
    LengthTool.toolName,
    BidirectionalTool.toolName,
  ]

  for (const t of primaryTools) {
    toolGroup.setToolPassive(t)
  }

  // Activate selected tool on primary mouse button
  toolGroup.setToolActive(toolNameMap[tool], {
    bindings: [{ mouseButton: MouseBindings.Primary }],
  })

  // Keep scroll on wheel always
  toolGroup.setToolActive(StackScrollTool.toolName, {
    bindings: [{ mouseButton: MouseBindings.Wheel }],
  })
}
