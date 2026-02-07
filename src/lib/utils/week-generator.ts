import { weekId } from '@/lib/nanoid'

interface Week {
  id: string
  season_id: string
  week_number: number
  title: string
  start_date: string
  end_date: string
  is_current: boolean
}

/**
 * 시작일~종료일 범위를 주 단위로 나누어 주차 배열 생성
 * 각 주차는 월요일 시작, 일요일 종료 (ISO 8601)
 */
export function generateWeeks(
  startDate: string,
  endDate: string,
  seasonId: string
): Week[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const weeks: Week[] = []

  // 시작일의 요일 확인 (0 = 일요일, 1 = 월요일, ...)
  const currentDate = new Date(start)

  // 시작일이 월요일이 아니면 다음 월요일로 이동
  const dayOfWeek = currentDate.getDay()
  if (dayOfWeek !== 1) {
    // 다음 월요일까지 날짜 계산
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    currentDate.setDate(currentDate.getDate() + daysUntilMonday)
  }

  let weekNumber = 1

  while (currentDate <= end) {
    const weekStart = new Date(currentDate)
    const weekEnd = new Date(currentDate)
    weekEnd.setDate(weekEnd.getDate() + 6) // 일요일

    // 종료일을 넘어가면 종료일로 제한
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime())
    }

    weeks.push({
      id: weekId(),
      season_id: seasonId,
      week_number: weekNumber,
      title: `${weekNumber}주차`,
      start_date: formatDate(weekStart),
      end_date: formatDate(weekEnd),
      is_current: weekNumber === 1, // 첫 주차만 현재 주차
    })

    // 다음 월요일로 이동
    currentDate.setDate(currentDate.getDate() + 7)
    weekNumber++
  }

  return weeks
}

/**
 * Date 객체를 YYYY-MM-DD 형식으로 변환
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
