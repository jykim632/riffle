'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'
import { weekIdSchema, updateWeekSchema } from '@/lib/schemas/admin'

/**
 * 현재 주차 설정 토글
 * 하나의 주차만 is_current=true일 수 있음
 */
export async function toggleWeekCurrentAction(weekId: string, isCurrent: boolean) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsed = weekIdSchema.safeParse(weekId)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  if (isCurrent) {
    // 활성화하려는 경우: 기존 현재 주차를 해제
    await auth.supabase.from('weeks').update({ is_current: false }).eq('is_current', true)
  }

  const { error } = await auth.supabase
    .from('weeks')
    .update({ is_current: isCurrent })
    .eq('id', weekId)

  if (error) {
    return { success: false, error: '주차 설정 변경에 실패했습니다.' }
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
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const parsedId = weekIdSchema.safeParse(weekId)
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0].message }
  }
  const parsedData = updateWeekSchema.safeParse(data)
  if (!parsedData.success) {
    return { success: false, error: parsedData.error.issues[0].message }
  }

  const { error } = await auth.supabase
    .from('weeks')
    .update(data)
    .eq('id', weekId)

  if (error) {
    return { success: false, error: '주차 수정에 실패했습니다.' }
  }

  revalidatePath('/admin/weeks')
  return { success: true }
}
