import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshIndicatorsButton } from '@/components/admin/indicators/refresh-button'
import { INDICATOR_MAP } from '@/lib/ecos'
import { formatDate, formatDateTime } from '@/lib/utils/date'

export default async function AdminIndicatorsPage() {
  const supabase = await createClient()

  // 현재 주차
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('id, week_number, start_date, end_date')
    .eq('is_current', true)
    .maybeSingle()

  // 현재 주차 지표 현황
  const indicators = currentWeek
    ? (await supabase
        .from('indicator_snapshots')
        .select('indicator_code, data_value, unit_name, time_label, fetched_at')
        .eq('week_id', currentWeek.id)
      ).data ?? []
    : []

  // 전체 저장 건수
  const { count: totalCount } = await supabase
    .from('economic_indicators')
    .select('*', { count: 'exact', head: true })

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">경제지표 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            ECOS API를 통한 경제지표 수집 및 관리
          </p>
        </div>
        <RefreshIndicatorsButton />
      </div>

      {/* 현황 카드 */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>현재 주차</CardDescription>
            <CardTitle className="text-2xl">
              {currentWeek ? `${currentWeek.week_number}주차` : '-'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>이번 주 수집 지표</CardDescription>
            <CardTitle className="text-2xl">
              {indicators.length}개
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전체 저장 건수</CardDescription>
            <CardTitle className="text-2xl">
              {totalCount?.toLocaleString() ?? 0}건
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 현재 주차 지표 목록 */}
      {indicators.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">현재 주차 수집 데이터</CardTitle>
            <CardDescription>
              마지막 수집: {formatDateTime(indicators[0].fetched_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">지표</th>
                    <th className="pb-2 pr-4 text-right">값</th>
                    <th className="pb-2 pr-4">단위</th>
                    <th className="pb-2">기준일</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((ind) => {
                    const def = INDICATOR_MAP[ind.indicator_code]
                    return (
                      <tr key={ind.indicator_code} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">
                          {def?.label ?? ind.indicator_code}
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">
                          {Number(ind.data_value).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground">
                          {ind.unit_name ?? def?.unit ?? '-'}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {formatDate(ind.time_label)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            수집된 경제지표 데이터가 없습니다. 위 버튼으로 수동 수집하세요.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
