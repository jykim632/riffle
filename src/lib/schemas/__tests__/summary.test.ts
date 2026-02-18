import { describe, it, expect } from 'vitest'
import {
  createSummarySchema,
  updateSummarySchema,
  deleteSummarySchema,
} from '../summary'

describe('createSummarySchema', () => {
  it('유효한 요약본 통과', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: '이것은 10자 이상의 유효한 요약본입니다.',
    })
    expect(result.success).toBe(true)
  })

  it('빈 weekId 거부', () => {
    const result = createSummarySchema.safeParse({
      weekId: '',
      content: '이것은 10자 이상의 유효한 요약본입니다.',
    })
    expect(result.success).toBe(false)
  })

  // content 경계값
  it('정확히 10자 content 통과', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: '1234567890',
    })
    expect(result.success).toBe(true)
  })

  it('9자 content 거부', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: '123456789',
    })
    expect(result.success).toBe(false)
  })

  it('10000자 content 통과', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: 'a'.repeat(10000),
    })
    expect(result.success).toBe(true)
  })

  it('10001자 content 거부', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: 'a'.repeat(10001),
    })
    expect(result.success).toBe(false)
  })

  it('공백만 있는 content 거부', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: '          ',
    })
    expect(result.success).toBe(false)
  })

  it('앞뒤 공백 + 유효 텍스트 통과', () => {
    const result = createSummarySchema.safeParse({
      weekId: 'week-123',
      content: '   유효한 요약본 내용입니다   ',
    })
    expect(result.success).toBe(true)
  })
})

describe('updateSummarySchema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000'

  it('유효한 수정 데이터 통과', () => {
    const result = updateSummarySchema.safeParse({
      summaryId: validUUID,
      weekId: 'week-123',
      content: '수정된 요약본 내용입니다.',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 UUID 거부', () => {
    const result = updateSummarySchema.safeParse({
      summaryId: 'not-a-uuid',
      weekId: 'week-123',
      content: '수정된 요약본 내용입니다.',
    })
    expect(result.success).toBe(false)
  })

  it('content 경계값 동일 적용', () => {
    const result = updateSummarySchema.safeParse({
      summaryId: validUUID,
      weekId: 'week-123',
      content: '123456789',
    })
    expect(result.success).toBe(false)
  })
})

describe('deleteSummarySchema', () => {
  it('유효한 UUID 통과', () => {
    const result = deleteSummarySchema.safeParse({
      summaryId: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 UUID 거부', () => {
    const result = deleteSummarySchema.safeParse({
      summaryId: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})
