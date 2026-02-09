'use client'

import dynamic from 'next/dynamic'
import { commands } from '@uiw/react-md-editor'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[200px] max-h-[500px] h-[300px] rounded-md border border-input bg-muted/50 animate-pulse" />
  ),
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const toolbarCommands = [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.divider,
  commands.link,
  commands.quote,
]

export function MarkdownEditor({ value, onChange, disabled }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        preview="edit"
        commands={toolbarCommands}
        extraCommands={[]}
        highlightEnable={false}
        visibleDragbar={true}
        minHeight={200}
        maxHeight={500}
        height={300}
        textareaProps={{
          disabled,
          placeholder: '마크다운으로 요약본을 작성하세요.\n\n예시:\n# 제목\n\n**굵게**, *기울임*, [링크](https://...)\n\n- 항목 1\n- 항목 2',
        }}
      />
    </div>
  )
}
