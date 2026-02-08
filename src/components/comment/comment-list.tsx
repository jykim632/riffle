import { normalizeRelation } from '@/lib/utils/supabase'
import { CommentItem } from './comment-item'

interface CommentData {
  id: string
  summary_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  profiles: { nickname: string } | { nickname: string }[] | null
}

interface CommentListProps {
  comments: CommentData[]
  currentUserId: string
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
      </p>
    )
  }

  return (
    <div className="divide-y">
      {comments.map((comment) => {
        const profiles = normalizeRelation(comment.profiles)
        return (
          <CommentItem
            key={comment.id}
            comment={{
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              updated_at: comment.updated_at,
              author_id: comment.author_id,
              nickname: profiles?.nickname ?? null,
            }}
            isAuthor={comment.author_id === currentUserId}
          />
        )
      })}
    </div>
  )
}
