import { type ActiveTool, setActivePrimaryTool } from '../utils/cornerstone-init'

interface ViewerToolbarProps {
  activeTool: ActiveTool
  onToolChange: (tool: ActiveTool) => void
  sliceInfo: { current: number; total: number } | null
}

const tools: { id: ActiveTool; label: string; shortcut: string }[] = [
  { id: 'WindowLevel', label: 'W/L', shortcut: 'W' },
  { id: 'Pan', label: 'Pan', shortcut: 'P' },
  { id: 'Zoom', label: 'Zoom', shortcut: 'Z' },
  { id: 'Length', label: 'Length', shortcut: 'L' },
  { id: 'Bidirectional', label: 'Bidir', shortcut: 'B' },
]

export function ViewerToolbar({
  activeTool,
  onToolChange,
  sliceInfo,
}: ViewerToolbarProps) {
  const handleToolClick = (tool: ActiveTool) => {
    setActivePrimaryTool(tool)
    onToolChange(tool)
  }

  return (
    <div className="flex items-center gap-1 border-b border-zinc-800 px-3 py-1.5">
      <span className="mr-2 text-xs font-medium text-zinc-500">Tools</span>

      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => handleToolClick(tool.id)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            activeTool === tool.id
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
          title={`${tool.label} (${tool.shortcut})`}
        >
          {tool.label}
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Slice info */}
      {sliceInfo && sliceInfo.total > 0 && (
        <span className="text-xs tabular-nums text-zinc-500">
          {sliceInfo.current + 1} / {sliceInfo.total}
        </span>
      )}
    </div>
  )
}
