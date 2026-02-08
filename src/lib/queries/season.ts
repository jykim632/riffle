import { SupabaseClient } from '@supabase/supabase-js'

/**
 * 현재 활성 시즌 조회
 */
export async function getCurrentSeason(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .maybeSingle()
  return data
}

/**
 * 현재 시즌의 활성 주차 조회
 */
export async function getCurrentWeek(supabase: SupabaseClient, seasonId: string) {
  const { data } = await supabase
    .from('weeks')
    .select('*')
    .eq('season_id', seasonId)
    .eq('is_current', true)
    .maybeSingle()
  return data
}

/**
 * 시즌의 전체 주차 목록 조회
 */
export async function getSeasonWeeks(
  supabase: SupabaseClient,
  seasonId: string,
  ascending = true
) {
  const { data } = await supabase
    .from('weeks')
    .select('id, season_id, week_number, title, start_date, end_date, is_current')
    .eq('season_id', seasonId)
    .order('week_number', { ascending })
  return data ?? []
}
