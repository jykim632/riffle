'use server'

import { seasonId } from '@/lib/nanoid'
import { generateWeeks } from '@/lib/utils/week-generator'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'

interface CreateSeasonInput {
  name: string
  start_date: string
  end_date: string
}

/**
 * 시즌 생성 + 주차 자동 생성
 */
export async function createSeasonAction(data: CreateSeasonInput) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  // 1. 시즌 생성
  const newSeasonId = seasonId()

  const { error: seasonError } = await auth.supabase.from('seasons').insert({
    id: newSeasonId,
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: false, // 생성 시 비활성
  })

  if (seasonError) {
    return { success: false, error: '시즌 생성에 실패했습니다.' }
  }

  // 2. 주차 자동 생성
  const weeks = generateWeeks(data.start_date, data.end_date, newSeasonId)

  const { error: weeksError } = await auth.supabase.from('weeks').insert(weeks)

  if (weeksError) {
    // 주차 생성 실패 시 시즌 삭제 (롤백)
    await auth.supabase.from('seasons').delete().eq('id', newSeasonId)
    return { success: false, error: '주차 생성에 실패했습니다.' }
  }

  revalidatePath('/admin/seasons')
  return { success: true, seasonId: newSeasonId }
}

/**
 * 시즌 정보 수정
 */
export async function updateSeasonAction(
  sid: string,
  data: Partial<CreateSeasonInput>
) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const { error } = await auth.supabase
    .from('seasons')
    .update(data)
    .eq('id', sid)

  if (error) {
    return { success: false, error: '시즌 수정에 실패했습니다.' }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}

/**
 * 시즌 활성화/비활성화
 */
export async function toggleSeasonActiveAction(sid: string, isActive: boolean) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  if (isActive) {
    // 활성화하려는 경우: 기존 활성 시즌을 확인하고 비활성화
    const { data: currentActive } = await auth.supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (currentActive) {
      const { error: deactivateError } = await auth.supabase
        .from('seasons')
        .update({ is_active: false })
        .eq('id', currentActive.id)

      if (deactivateError) {
        return { success: false, error: '기존 시즌 비활성화에 실패했습니다.' }
      }
    }

    // 선택한 시즌을 활성화
    const { error } = await auth.supabase
      .from('seasons')
      .update({ is_active: true })
      .eq('id', sid)

    if (error) {
      // 롤백: 이전 활성 시즌 복원
      if (currentActive) {
        await auth.supabase
          .from('seasons')
          .update({ is_active: true })
          .eq('id', currentActive.id)
      }
      return { success: false, error: '시즌 활성화에 실패했습니다.' }
    }
  } else {
    // 비활성화
    const { error } = await auth.supabase
      .from('seasons')
      .update({ is_active: false })
      .eq('id', sid)

    if (error) {
      return { success: false, error: '시즌 비활성화에 실패했습니다.' }
    }
  }

  revalidatePath('/admin/seasons')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * 시즌 멤버 추가
 */
export async function addSeasonMembersAction(sid: string, userIds: string[]) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const members = userIds.map((userId) => ({
    season_id: sid,
    user_id: userId,
  }))

  const { error } = await auth.supabase.from('season_members').insert(members)

  if (error) {
    return { success: false, error: '멤버 추가에 실패했습니다.' }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}

/**
 * 시즌 멤버 제거
 */
export async function removeSeasonMemberAction(sid: string, userId: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const { error } = await auth.supabase
    .from('season_members')
    .delete()
    .eq('season_id', sid)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: '멤버 제거에 실패했습니다.' }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}
