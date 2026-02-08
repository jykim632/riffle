import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 특정 주차의 최신 경제지표 스냅샷 조회
 */
export async function getIndicatorsByWeek(
  supabase: SupabaseClient,
  weekId: string
) {
  const { data } = await supabase
    .from('indicator_snapshots')
    .select('id, indicator_code, data_value, unit_name, time_label, fetched_at')
    .eq('week_id', weekId)
  return data ?? []
}

/**
 * 위젯용: 특정 주차의 특정 지표만 조회
 */
export async function getIndicatorsForWidget(
  supabase: SupabaseClient,
  weekId: string,
  codes: readonly string[]
) {
  const { data } = await supabase
    .from('indicator_snapshots')
    .select('id, indicator_code, data_value, unit_name, time_label, fetched_at')
    .eq('week_id', weekId)
    .in('indicator_code', [...codes])
  return data ?? []
}

/**
 * 스파크라인용: 지표별 최근 N주 히스토리 조회
 */
export async function getIndicatorHistory(
  supabase: SupabaseClient,
  indicatorCode: string,
  weekIds: string[]
) {
  if (weekIds.length === 0) return []

  const { data } = await supabase
    .from('indicator_snapshots')
    .select('indicator_code, data_value, time_label, week_id')
    .eq('indicator_code', indicatorCode)
    .in('week_id', weekIds)
    .order('fetched_at', { ascending: true })
  return data ?? []
}

/**
 * 배치 히스토리 조회: 여러 주차의 모든 지표를 한 번에 조회
 * 스파크라인용 히스토리 데이터를 N+1 없이 가져옴
 */
export async function getIndicatorsHistoryBatch(
  supabase: SupabaseClient,
  weekIds: string[]
): Promise<Record<string, number[]>> {
  if (weekIds.length === 0) return {}

  const { data } = await supabase
    .from('indicator_snapshots')
    .select('indicator_code, data_value, week_id')
    .in('week_id', weekIds)
    .order('fetched_at', { ascending: true })

  if (!data) return {}

  const result: Record<string, number[]> = {}
  for (const row of data) {
    const arr = result[row.indicator_code] ?? []
    arr.push(row.data_value)
    result[row.indicator_code] = arr
  }
  return result
}

/**
 * 현재 주차 기준 최근 N주의 weekId 목록 반환
 */
export async function getRecentWeekIds(
  supabase: SupabaseClient,
  seasonId: string,
  currentWeekNumber: number,
  count: number = 8
): Promise<string[]> {
  const minWeek = Math.max(1, currentWeekNumber - count + 1)

  const { data } = await supabase
    .from('weeks')
    .select('id')
    .eq('season_id', seasonId)
    .gte('week_number', minWeek)
    .lte('week_number', currentWeekNumber)
    .order('week_number', { ascending: true })

  return data?.map((w) => w.id) ?? []
}

/**
 * 이전 주차 지표 조회 (변동률 계산용)
 */
export async function getPreviousIndicators(
  supabase: SupabaseClient,
  weekId: string
) {
  // 이전 주차 ID 조회
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('season_id, week_number')
    .eq('id', weekId)
    .maybeSingle()

  if (!currentWeek || currentWeek.week_number <= 1) return []

  const { data: prevWeek } = await supabase
    .from('weeks')
    .select('id')
    .eq('season_id', currentWeek.season_id)
    .eq('week_number', currentWeek.week_number - 1)
    .maybeSingle()

  if (!prevWeek) return []

  return getIndicatorsByWeek(supabase, prevWeek.id)
}
