/**
 * 날짜 범위를 포맷팅합니다.
 * @param start - 시작 날짜 (YYYY-MM-DD)
 * @param end - 종료 날짜 (YYYY-MM-DD)
 * @returns "YYYY.MM.DD - MM.DD" 형식의 문자열
 * @example formatDateRange('2026-02-03', '2026-02-09') // "2026.02.03 - 02.09"
 */
export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const startFormatted = `${startDate.getFullYear()}.${String(
    startDate.getMonth() + 1
  ).padStart(2, '0')}.${String(startDate.getDate()).padStart(2, '0')}`

  const endFormatted = `${String(endDate.getMonth() + 1).padStart(
    2,
    '0'
  )}.${String(endDate.getDate()).padStart(2, '0')}`

  return `${startFormatted} - ${endFormatted}`
}

/**
 * 날짜를 "YYYY.MM.DD HH:mm" 형식으로 포맷팅합니다.
 * @param date - 날짜 문자열 또는 Date 객체
 * @returns "YYYY.MM.DD HH:mm" 형식의 문자열
 * @example formatDateTime('2026-02-03T10:30:00Z') // "2026.02.03 10:30"
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${hours}:${minutes}`
}

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷팅합니다.
 * @param date - 날짜 문자열 또는 Date 객체
 * @returns "YYYY.MM.DD" 형식의 문자열
 * @example formatDate('2026-02-03') // "2026.02.03"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}
