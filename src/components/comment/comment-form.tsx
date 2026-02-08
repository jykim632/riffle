'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createComment } from '@/actions/comments'

interface CommentFormProps {
  summaryId: string
}

export function CommentForm({ summaryId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('summaryId', summaryId)
    formData.append('content', content)

    const result = await createComment(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setContent('')
    setLoading(false)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="댓글을 입력하세요 (최대 500자)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={loading}
        rows={3}
        maxLength={500}
        className="resize-none"
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/500
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={loading || content.trim().length === 0}
        >
          {loading ? '작성 중...' : '댓글 작성'}
        </Button>
      </div>
    </form>
  )
}
