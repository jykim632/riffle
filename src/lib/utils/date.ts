const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

/**
 * 날짜 문자열 또는 Date 객체를 Date로 변환합니다.
 * YYYY-MM-DD 형식의 문자열은 로컬 시간으로 파싱하여 타임존 이슈를 방지합니다.
 */
function toDate(date: string | Date): Date {
  if (typeof date !== 'string') return date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + 'T00:00:00')
  // YYYYMMDD (ECOS API 등)
  if (/^\d{8}$/.test(date)) return new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00`)
  // YYYYMM
  if (/^\d{6}$/.test(date)) return new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-01T00:00:00`)
  // YYYYQN (분기: 2024Q1 → 2024-01, 2024Q4 → 2024-10)
  const qMatch = date.match(/^(\d{4})Q([1-4])$/)
  if (qMatch) {
    const month = String((Number(qMatch[2]) - 1) * 3 + 1).padStart(2, '0')
    return new Date(`${qMatch[1]}-${month}-01T00:00:00`)
  }
  return new Date(date)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD (분기 형식은 YYYY년 NQ로 표시) */
export function formatDate(date: string | Date): string {
  // 분기 형식은 그대로 표시
  if (typeof date === 'string') {
    const qMatch = date.match(/^(\d{4})Q([1-4])$/)
    if (qMatch) return `${qMatch[1]}년 ${qMatch[2]}Q`
  }
  const d = toDate(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** YYYY-MM-DD HH:mm */
export function formatDateTime(date: string | Date): string {
  const d = toDate(date)
  return `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** MM-DD */
export function formatShortDate(date: string | Date): string {
  const d = toDate(date)
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** MM-DD (요일) */
export function formatShortDateWithDay(date: string | Date): string {
  const d = toDate(date)
  return `${formatShortDate(d)} (${DAY_NAMES[d.getDay()]})`
}

/** YYYY-MM-DD ~ MM-DD */
export function formatDateRange(start: string, end: string): string {
  return `${formatDate(toDate(start))} ~ ${formatShortDate(toDate(end))}`
}

/** MM-DD ~ MM-DD */
export function formatShortDateRange(start: string, end: string): string {
  return `${formatShortDate(toDate(start))} ~ ${formatShortDate(toDate(end))}`
}
