import { describe, it, expect } from 'vitest'
import {
  createCommentSchema,
  updateCommentSchema,
  deleteCommentSchema,
} from '../comment'

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('createCommentSchema', () => {
  it('유효한 댓글 통과', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: '좋은 요약이네요!',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 summaryId 거부', () => {
    const result = createCommentSchema.safeParse({
      summaryId: 'not-uuid',
      content: '댓글 내용',
    })
    expect(result.success).toBe(false)
  })

  // content 경계값
  it('1자 content 통과', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: 'a',
    })
    expect(result.success).toBe(true)
  })

  it('빈 content 거부', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: '',
    })
    expect(result.success).toBe(false)
  })

  it('500자 content 통과', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: 'a'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('501자 content 거부', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: 'a'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('공백만 있는 content 거부', () => {
    const result = createCommentSchema.safeParse({
      summaryId: validUUID,
      content: '   ',
    })
    expect(result.success).toBe(false)
  })
})

describe('updateCommentSchema', () => {
  it('유효한 수정 데이터 통과', () => {
    const result = updateCommentSchema.safeParse({
      commentId: validUUID,
      content: '수정된 댓글',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 commentId 거부', () => {
    const result = updateCommentSchema.safeParse({
      commentId: 'bad-id',
      content: '수정된 댓글',
    })
    expect(result.success).toBe(false)
  })

  it('공백만 있는 content 거부', () => {
    const result = updateCommentSchema.safeParse({
      commentId: validUUID,
      content: '   ',
    })
    expect(result.success).toBe(false)
  })
})

describe('deleteCommentSchema', () => {
  it('유효한 UUID 통과', () => {
    expect(
      deleteCommentSchema.safeParse({ commentId: validUUID }).success
    ).toBe(true)
  })

  it('잘못된 UUID 거부', () => {
    expect(
      deleteCommentSchema.safeParse({ commentId: 'not-uuid' }).success
    ).toBe(false)
  })
})
