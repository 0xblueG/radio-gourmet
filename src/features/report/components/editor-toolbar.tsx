import type { Editor } from '@tiptap/react'

interface EditorToolbarProps {
  editor: Editor | null
  onRefreshRecist: () => void
  onNewReport: () => void
}

interface ToolbarButtonProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function ToolbarButton({ label, isActive, onClick }: ToolbarButtonProps) {
  return (
    <button
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export function EditorToolbar({ editor, onRefreshRecist, onNewReport }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900 px-3 py-1.5">
      <ToolbarButton
        label="B"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="I"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />

      <div className="mx-1 h-4 w-px bg-zinc-700" />

      <ToolbarButton
        label="H2"
        isActive={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="H3"
        isActive={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="H4"
        isActive={editor.isActive('heading', { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      />

      <div className="mx-1 h-4 w-px bg-zinc-700" />

      <ToolbarButton
        label="List"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />

      {/* Spacer */}
      <div className="flex-1" />

      <button
        className="rounded px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-900/30 hover:text-blue-300"
        onClick={onRefreshRecist}
        title="Re-fill report with current measurements"
      >
        Refresh RECIST
      </button>

      <button
        className="rounded px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
        onClick={onNewReport}
      >
        New Report
      </button>
    </div>
  )
}
