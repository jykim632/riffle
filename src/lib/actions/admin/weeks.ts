'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 현재 주차 설정 토글
 * 하나의 주차만 is_current=true일 수 있음
 */
export async function toggleWeekCurrentAction(weekId: string, isCurrent: boolean) {
  const supabase = await createClient()

  if (isCurrent) {
    // 활성화하려는 경우: 기존 현재 주차를 해제
    await supabase.from('weeks').update({ is_current: false }).eq('is_current', true)
  }

  const { error } = await supabase
    .from('weeks')
    .update({ is_current: isCurrent })
    .eq('id', weekId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/weeks')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * 주차 정보 수정 (title)
 */
export async function updateWeekAction(
  weekId: string,
  data: { title?: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('weeks')
    .update(data)
    .eq('id', weekId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/weeks')
  return { success: true }
}
