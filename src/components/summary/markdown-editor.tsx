'use client'

import dynamic from 'next/dynamic'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-md border border-input bg-muted/50 animate-pulse" />
  ),
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function MarkdownEditor({ value, onChange, disabled }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val ?? '')}
        preview="edit"
        height={400}
        textareaProps={{
          disabled,
          placeholder:
            '# 제목\n\n**볼드**, *이탤릭*, [링크](https://example.com)\n\n- 리스트 항목\n- 리스트 항목',
        }}
      />
    </div>
  )
}
