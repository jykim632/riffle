'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from './auth-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAllIndicators } from '@/lib/ecos'

/**
 * 관리자 수동 경제지표 갱신
 */
export async function refreshIndicatorsAction() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const adminSupabase = createAdminClient()

  // 현재 주차 조회
  const { data: currentWeek } = await auth.supabase
    .from('weeks')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentWeek) {
    return { success: false, error: '현재 주차가 없습니다.' }
  }

  // 오늘(KST) 이미 수집했는지 확인
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const { count: alreadyCollected } = await adminSupabase
    .from('economic_indicators')
    .select('*', { count: 'exact', head: true })
    .eq('week_id', currentWeek.id)
    .gte('fetched_at', `${todayKST}T00:00:00+09:00`)

  if (alreadyCollected && alreadyCollected > 0) {
    return { success: false, error: '오늘 이미 수집된 데이터가 있습니다.' }
  }

  // ECOS 데이터 조회
  const indicators = await fetchAllIndicators()

  if (indicators.length === 0) {
    return { success: false, error: 'ECOS에서 데이터를 가져오지 못했습니다.' }
  }

  // DB 저장 (service_role로 RLS 우회)
  const rows = indicators.map((ind) => ({
    indicator_code: ind.indicatorCode,
    stat_code: ind.statCode,
    item_code: ind.itemCode,
    data_value: ind.dataValue,
    unit_name: ind.unitName,
    time_label: ind.timeLabel,
    week_id: currentWeek.id,
  }))

  const { error } = await adminSupabase.from('economic_indicators').insert(rows)

  if (error) {
    return { success: false, error: `저장 실패: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/indicators')

  return { success: true, count: indicators.length }
}

/**
 * 오늘(KST) 수집한 경제지표 데이터 삭제
 */
export async function deleteTodayIndicatorsAction() {
  const auth = await requireAdmin()
  if (!auth.authorized) return auth.response

  const adminSupabase = createAdminClient()

  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const { count } = await adminSupabase
    .from('economic_indicators')
    .select('*', { count: 'exact', head: true })
    .gte('fetched_at', `${todayKST}T00:00:00+09:00`)

  if (!count || count === 0) {
    return { success: false, error: '오늘 수집된 데이터가 없습니다.' }
  }

  const { error } = await adminSupabase
    .from('economic_indicators')
    .delete()
    .gte('fetched_at', `${todayKST}T00:00:00+09:00`)

  if (error) {
    return { success: false, error: `삭제 실패: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/indicators')
  revalidatePath('/admin/indicators')

  return { success: true, count }
}
