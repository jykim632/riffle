'use client'

import { useState } from 'react'
import { Pencil, Trash2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateComment, deleteComment } from '@/actions/comments'
import { formatDate } from '@/lib/utils/date'

interface CommentItemProps {
  comment: {
    id: string
    content: string
    created_at: string
    updated_at: string
    author_id: string
    nickname: string | null
  }
  isAuthor: boolean
}

export function CommentItem({ comment, isAuthor }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdited = comment.updated_at !== comment.created_at

  const handleUpdate = async () => {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('commentId', comment.id)
    formData.append('content', editContent)

    const result = await updateComment(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setEditing(false)
    setLoading(false)
  }

  const handleDelete = async () => {
    setLoading(true)

    const formData = new FormData()
    formData.append('commentId', comment.id)

    const result = await deleteComment(formData)

    if (result?.error) {
      alert(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            {comment.nickname || '알 수 없음'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.created_at)}
            {isEdited && ' (수정됨)'}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              disabled={loading}
              rows={2}
              maxLength={500}
              className="resize-none"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleUpdate}
                disabled={loading || editContent.trim().length === 0}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {loading ? '수정 중...' : '저장'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(false)
                  setEditContent(comment.content)
                  setError(null)
                }}
                disabled={loading}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                취소
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        )}
      </div>

      {isAuthor && !editing && (
        <div className="flex shrink-0 gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditing(true)}
            disabled={loading}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
