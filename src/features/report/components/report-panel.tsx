import { useEffect, useCallback } from 'react'
import { useEditor } from '@tiptap/react'
import { StarterKit } from '@tiptap/starter-kit'
import { useReport } from '../hooks/use-report'
import { useReportStore } from '../store'
import { TemplatePicker } from './template-picker'
import { ReportEditor } from './report-editor'
import { EditorToolbar } from './editor-toolbar'

export function ReportPanel() {
  const { templateId, content, updateContent, resetReport, refreshReport } = useReport()
  const recistSnapshot = useReportStore((s) => s.recistSnapshot)

  const editor = useEditor({
    extensions: [StarterKit],
    content: content ?? undefined,
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none px-6 py-4 outline-none min-h-full ' +
          'prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-li:text-zinc-300 ' +
          'prose-strong:text-zinc-200 prose-em:text-zinc-400 ' +
          'prose-h2:text-xl prose-h3:text-base prose-h4:text-sm prose-h4:text-zinc-400',
      },
    },
    onUpdate: ({ editor: e }) => {
      updateContent(e.getJSON())
    },
  })

  // Push hydrated content into editor when template changes or RECIST data is refreshed
  useEffect(() => {
    if (editor && content && templateId) {
      editor.commands.setContent(content)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, templateId, recistSnapshot])

  const handleRefresh = useCallback(() => {
    refreshReport()
  }, [refreshReport])

  if (!templateId || !content) {
    return (
      <div className="flex h-full flex-col bg-zinc-900">
        <TemplatePicker />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-zinc-900">
      <EditorToolbar
        editor={editor}
        onRefreshRecist={handleRefresh}
        onNewReport={resetReport}
      />
      {editor && <ReportEditor editor={editor} />}
    </div>
  )
}
