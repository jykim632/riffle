import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatShortDate,
  formatShortDateWithDay,
  formatDateRange,
  formatShortDateRange,
} from '../date'

describe('formatDate', () => {
  it('YYYY-MM-DD 문자열 그대로 포맷', () => {
    expect(formatDate('2025-01-15')).toBe('2025-01-15')
  })

  it('Date 객체 포맷', () => {
    const d = new Date(2025, 0, 15) // 2025-01-15
    expect(formatDate(d)).toBe('2025-01-15')
  })

  it('한 자리 월/일 패딩', () => {
    expect(formatDate('2025-03-05')).toBe('2025-03-05')
  })

  it('YYYYMMDD 형식 파싱', () => {
    expect(formatDate('20250115')).toBe('2025-01-15')
  })

  it('YYYYMM 형식 파싱 (1일로)', () => {
    expect(formatDate('202501')).toBe('2025-01-01')
  })

  it('분기 형식 YYYYQN → 한글 표시', () => {
    expect(formatDate('2024Q1')).toBe('2024년 1Q')
    expect(formatDate('2024Q4')).toBe('2024년 4Q')
  })
})

describe('formatDateTime', () => {
  it('날짜+시간 포맷', () => {
    const d = new Date(2025, 0, 15, 14, 30)
    expect(formatDateTime(d)).toBe('2025-01-15 14:30')
  })

  it('자정 시간 패딩', () => {
    const d = new Date(2025, 0, 1, 0, 5)
    expect(formatDateTime(d)).toBe('2025-01-01 00:05')
  })
})

describe('formatShortDate', () => {
  it('MM-DD 포맷', () => {
    expect(formatShortDate('2025-01-15')).toBe('01-15')
  })

  it('Date 객체 포맷', () => {
    const d = new Date(2025, 11, 25) // 12-25
    expect(formatShortDate(d)).toBe('12-25')
  })
})

describe('formatShortDateWithDay', () => {
  it('MM-DD (요일) 포맷 - 월요일', () => {
    // 2025-01-13은 월요일
    expect(formatShortDateWithDay('2025-01-13')).toBe('01-13 (월)')
  })

  it('MM-DD (요일) 포맷 - 일요일', () => {
    // 2025-01-19는 일요일
    expect(formatShortDateWithDay('2025-01-19')).toBe('01-19 (일)')
  })

  it('MM-DD (요일) 포맷 - 수요일', () => {
    // 2025-01-15은 수요일
    expect(formatShortDateWithDay('2025-01-15')).toBe('01-15 (수)')
  })

  it('MM-DD (요일) 포맷 - 토요일', () => {
    // 2025-01-18은 토요일
    expect(formatShortDateWithDay('2025-01-18')).toBe('01-18 (토)')
  })
})

describe('formatDateRange', () => {
  it('YYYY-MM-DD ~ MM-DD 포맷', () => {
    expect(formatDateRange('2025-01-13', '2025-01-19')).toBe(
      '2025-01-13 ~ 01-19'
    )
  })

  it('월 경계 포맷', () => {
    expect(formatDateRange('2025-01-27', '2025-02-02')).toBe(
      '2025-01-27 ~ 02-02'
    )
  })
})

describe('formatShortDateRange', () => {
  it('MM-DD ~ MM-DD 포맷', () => {
    expect(formatShortDateRange('2025-01-13', '2025-01-19')).toBe(
      '01-13 ~ 01-19'
    )
  })
})
