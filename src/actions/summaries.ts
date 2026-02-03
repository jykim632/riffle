'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  createSummarySchema,
  updateSummarySchema,
  deleteSummarySchema,
} from '@/lib/schemas/summary'

// 요약본 작성
export async function createSummary(formData: FormData) {
  const rawData = {
    weekId: formData.get('weekId') as string,
    content: formData.get('content') as string,
  }

  // 입력값 검증
  const result = createSummarySchema.safeParse(rawData)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { error: firstError?.message || '입력값이 올바르지 않습니다.' }
  }

  const { weekId, content } = result.data
  const supabase = await createClient()

  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  // 요약본 작성 (RLS가 자동으로 author_id 검증)
  const { data, error } = await supabase
    .from('summaries')
    .insert({
      week_id: weekId,
      author_id: user.id,
      content,
    })
    .select('id')
    .single()

  if (error) {
    return { error: '요약본 제출에 실패했습니다.' }
  }

  redirect(`/mine/${data.id}`)
}

// 요약본 수정
export async function updateSummary(formData: FormData) {
  const rawData = {
    summaryId: formData.get('summaryId') as string,
    content: formData.get('content') as string,
  }

  // 입력값 검증
  const result = updateSummarySchema.safeParse(rawData)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { error: firstError?.message || '입력값이 올바르지 않습니다.' }
  }

  const { summaryId, content } = result.data
  const supabase = await createClient()

  // 요약본 수정 (RLS가 자동으로 본인 확인)
  const { error } = await supabase
    .from('summaries')
    .update({ content })
    .eq('id', summaryId)

  if (error) {
    return { error: '요약본 수정에 실패했습니다.' }
  }

  redirect(`/mine/${summaryId}`)
}

// 요약본 삭제
export async function deleteSummary(formData: FormData) {
  const rawData = {
    summaryId: formData.get('summaryId') as string,
  }

  // 입력값 검증
  const result = deleteSummarySchema.safeParse(rawData)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return { error: firstError?.message || '입력값이 올바르지 않습니다.' }
  }

  const { summaryId } = result.data
  const supabase = await createClient()

  // 요약본 삭제 (RLS가 자동으로 본인 확인)
  const { error } = await supabase.from('summaries').delete().eq('id', summaryId)

  if (error) {
    return { error: '요약본 삭제에 실패했습니다.' }
  }

  redirect('/mine')
}
