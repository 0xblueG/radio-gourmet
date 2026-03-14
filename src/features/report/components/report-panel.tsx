export function ReportPanel() {
  return (
    <div className="flex h-full flex-col bg-zinc-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
        <h2 className="text-sm font-medium text-zinc-400">Report Editor</h2>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-600">Select a template to start</p>
      </div>
    </div>
  )
}
