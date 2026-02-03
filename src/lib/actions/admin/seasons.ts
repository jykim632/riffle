'use server'

import { createClient } from '@/lib/supabase/server'
import { seasonId } from '@/lib/nanoid'
import { generateWeeks } from '@/lib/utils/week-generator'
import { revalidatePath } from 'next/cache'

interface CreateSeasonInput {
  name: string
  start_date: string
  end_date: string
}

/**
 * 시즌 생성 + 주차 자동 생성
 */
export async function createSeasonAction(data: CreateSeasonInput) {
  const supabase = await createClient()

  // 1. 시즌 생성
  const newSeasonId = seasonId()

  const { error: seasonError } = await supabase.from('seasons').insert({
    id: newSeasonId,
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: false, // 생성 시 비활성
  })

  if (seasonError) {
    return { success: false, error: seasonError.message }
  }

  // 2. 주차 자동 생성
  const weeks = generateWeeks(data.start_date, data.end_date, newSeasonId)

  const { error: weeksError } = await supabase.from('weeks').insert(weeks)

  if (weeksError) {
    // 주차 생성 실패 시 시즌 삭제 (롤백)
    await supabase.from('seasons').delete().eq('id', newSeasonId)
    return { success: false, error: weeksError.message }
  }

  revalidatePath('/admin/seasons')
  return { success: true, seasonId: newSeasonId }
}

/**
 * 시즌 정보 수정
 */
export async function updateSeasonAction(
  seasonId: string,
  data: Partial<CreateSeasonInput>
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('seasons')
    .update(data)
    .eq('id', seasonId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}

/**
 * 시즌 활성화/비활성화
 */
export async function toggleSeasonActiveAction(seasonId: string, isActive: boolean) {
  const supabase = await createClient()

  if (isActive) {
    // 활성화하려는 경우: 기존 활성 시즌을 비활성화
    await supabase.from('seasons').update({ is_active: false }).eq('is_active', true)
  }

  // 선택한 시즌을 활성화/비활성화
  const { error } = await supabase
    .from('seasons')
    .update({ is_active: isActive })
    .eq('id', seasonId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/seasons')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * 시즌 멤버 추가
 */
export async function addSeasonMembersAction(seasonId: string, userIds: string[]) {
  const supabase = await createClient()

  const members = userIds.map((userId) => ({
    season_id: seasonId,
    user_id: userId,
  }))

  const { error } = await supabase.from('season_members').insert(members)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}

/**
 * 시즌 멤버 제거
 */
export async function removeSeasonMemberAction(seasonId: string, userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('season_members')
    .delete()
    .eq('season_id', seasonId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/seasons')
  return { success: true }
}
