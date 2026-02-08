'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { parseFormData } from '@/lib/actions/types'
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from '@/lib/schemas/comment'

// 댓글 작성
export async function createComment(formData: FormData) {
  const rawData = {
    summaryId: formData.get('summaryId') as string,
    content: formData.get('content') as string,
  }

  const result = parseFormData(createCommentSchema, rawData)
  if (!result.success) return { error: result.error }

  const { summaryId, content } = result.data
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const { error } = await supabase.from('comments').insert({
    summary_id: summaryId,
    author_id: user.id,
    content,
  })

  if (error) {
    return { error: '댓글 작성에 실패했습니다.' }
  }

  revalidatePath(`/summaries/${summaryId}`)
  return { success: true }
}

// 댓글 수정
export async function updateComment(formData: FormData) {
  const rawData = {
    commentId: formData.get('commentId') as string,
    content: formData.get('content') as string,
  }

  const result = parseFormData(updateCommentSchema, rawData)
  if (!result.success) return { error: result.error }

  const { commentId, content } = result.data
  const supabase = await createClient()

  // summaryId 먼저 조회 (revalidatePath용)
  const { data: comment } = await supabase
    .from('comments')
    .select('summary_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return { error: '댓글을 찾을 수 없습니다.' }
  }

  const { error } = await supabase
    .from('comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) {
    return { error: '댓글 수정에 실패했습니다.' }
  }

  revalidatePath(`/summaries/${comment.summary_id}`)
  return { success: true }
}

// 댓글 삭제
export async function deleteComment(formData: FormData) {
  const rawData = {
    commentId: formData.get('commentId') as string,
  }

  const result = parseFormData(deleteCommentSchema, rawData)
  if (!result.success) return { error: result.error }

  const { commentId } = result.data
  const supabase = await createClient()

  // summaryId 먼저 조회 (revalidatePath용)
  const { data: comment } = await supabase
    .from('comments')
    .select('summary_id')
    .eq('id', commentId)
    .single()

  if (!comment) {
    return { error: '댓글을 찾을 수 없습니다.' }
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) {
    return { error: '댓글 삭제에 실패했습니다.' }
  }

  revalidatePath(`/summaries/${comment.summary_id}`)
  return { success: true }
}
