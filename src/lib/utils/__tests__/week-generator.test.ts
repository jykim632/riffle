import { describe, it, expect, vi } from 'vitest'

// weekId를 모킹해서 예측 가능한 ID 생성
vi.mock('@/lib/nanoid', () => {
  let counter = 0
  return {
    weekId: () => `week-${++counter}`,
  }
})

import { generateWeeks } from '../week-generator'

describe('generateWeeks', () => {
  it('월요일 시작일이면 그 주부터 생성', () => {
    // 2025-01-06은 월요일
    const weeks = generateWeeks('2025-01-06', '2025-01-19', 'season-1')
    expect(weeks).toHaveLength(2)
    expect(weeks[0].week_number).toBe(1)
    expect(weeks[0].start_date).toBe('2025-01-06')
    expect(weeks[0].end_date).toBe('2025-01-12')
    expect(weeks[1].week_number).toBe(2)
    expect(weeks[1].start_date).toBe('2025-01-13')
    expect(weeks[1].end_date).toBe('2025-01-19')
  })

  it('월요일이 아닌 시작일이면 다음 월요일부터', () => {
    // 2025-01-08은 수요일 → 다음 월요일은 01-13
    const weeks = generateWeeks('2025-01-08', '2025-01-26', 'season-1')
    expect(weeks[0].start_date).toBe('2025-01-13')
  })

  it('일요일 시작이면 다음 날 월요일부터', () => {
    // 2025-01-05는 일요일 → 다음 월요일은 01-06
    const weeks = generateWeeks('2025-01-05', '2025-01-19', 'season-1')
    expect(weeks[0].start_date).toBe('2025-01-06')
  })

  it('종료일이 주 중간이면 종료일로 제한', () => {
    // 2025-01-06(월) ~ 2025-01-10(금)
    const weeks = generateWeeks('2025-01-06', '2025-01-10', 'season-1')
    expect(weeks).toHaveLength(1)
    expect(weeks[0].end_date).toBe('2025-01-10')
  })

  it('season_id가 올바르게 설정됨', () => {
    const weeks = generateWeeks('2025-01-06', '2025-01-12', 'my-season')
    expect(weeks[0].season_id).toBe('my-season')
  })

  it('첫 주차만 is_current가 true', () => {
    const weeks = generateWeeks('2025-01-06', '2025-01-26', 'season-1')
    expect(weeks[0].is_current).toBe(true)
    expect(weeks[1].is_current).toBe(false)
    expect(weeks[2].is_current).toBe(false)
  })

  it('title 형식이 N주차', () => {
    const weeks = generateWeeks('2025-01-06', '2025-01-19', 'season-1')
    expect(weeks[0].title).toBe('1주차')
    expect(weeks[1].title).toBe('2주차')
  })

  it('월 경계를 넘는 주차 생성', () => {
    // 2025-01-27(월) ~ 2025-02-09(일)
    const weeks = generateWeeks('2025-01-27', '2025-02-09', 'season-1')
    expect(weeks).toHaveLength(2)
    expect(weeks[0].start_date).toBe('2025-01-27')
    expect(weeks[0].end_date).toBe('2025-02-02')
    expect(weeks[1].start_date).toBe('2025-02-03')
    expect(weeks[1].end_date).toBe('2025-02-09')
  })

  it('시작일과 종료일 사이에 월요일이 없으면 빈 배열', () => {
    // 2025-01-07(화) ~ 2025-01-10(금) → 다음 월요일은 01-13으로 범위 밖
    const weeks = generateWeeks('2025-01-07', '2025-01-10', 'season-1')
    expect(weeks).toHaveLength(0)
  })

  it('id가 생성됨', () => {
    const weeks = generateWeeks('2025-01-06', '2025-01-12', 'season-1')
    expect(weeks[0].id).toBeTruthy()
  })
})
