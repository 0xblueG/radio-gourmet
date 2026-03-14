import { EditorContent, type Editor } from '@tiptap/react'

interface ReportEditorProps {
  editor: Editor
}

export function ReportEditor({ editor }: ReportEditorProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <EditorContent editor={editor} className="h-full" />
    </div>
  )
}
