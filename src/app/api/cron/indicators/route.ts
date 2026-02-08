import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchAllIndicators } from '@/lib/ecos'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel Cron 인증 검증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 현재 주차 조회
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('id')
    .eq('is_current', true)
    .maybeSingle()

  if (!currentWeek) {
    return NextResponse.json({ error: '현재 주차 없음' }, { status: 200 })
  }

  // 오늘(KST) 이미 수집했는지 확인
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const { count: alreadyCollected } = await supabase
    .from('economic_indicators')
    .select('*', { count: 'exact', head: true })
    .eq('week_id', currentWeek.id)
    .gte('fetched_at', `${todayKST}T00:00:00+09:00`)

  if (alreadyCollected && alreadyCollected > 0) {
    return NextResponse.json({ skipped: true, message: '오늘 이미 수집됨' })
  }

  // ECOS 데이터 조회
  const indicators = await fetchAllIndicators()

  if (indicators.length === 0) {
    return NextResponse.json({ error: '지표 데이터 없음' }, { status: 200 })
  }

  // DB 저장
  const rows = indicators.map((ind) => ({
    indicator_code: ind.indicatorCode,
    stat_code: ind.statCode,
    item_code: ind.itemCode,
    data_value: ind.dataValue,
    unit_name: ind.unitName,
    time_label: ind.timeLabel,
    week_id: currentWeek.id,
  }))

  const { error } = await supabase.from('economic_indicators').insert(rows)

  if (error) {
    console.error('[Cron] 지표 저장 실패:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 캐시 무효화
  revalidatePath('/dashboard')
  revalidatePath('/indicators')

  return NextResponse.json({
    success: true,
    count: indicators.length,
    weekId: currentWeek.id,
  })
}
