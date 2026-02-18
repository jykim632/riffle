import { describe, it, expect } from 'vitest'
import {
  userIdSchema,
  updateMemberRoleSchema,
  createSeasonSchema,
  addSeasonMembersSchema,
  adminCreateInviteCodeSchema,
  inviteCodeIdSchema,
  updateWeekSchema,
} from '../admin'

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

describe('userIdSchema', () => {
  it('유효한 UUID 통과', () => {
    expect(userIdSchema.safeParse(validUUID).success).toBe(true)
  })

  it('잘못된 UUID 거부', () => {
    expect(userIdSchema.safeParse('not-a-uuid').success).toBe(false)
  })
})

describe('updateMemberRoleSchema', () => {
  it('admin 역할 통과', () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: validUUID,
      role: 'admin',
    })
    expect(result.success).toBe(true)
  })

  it('member 역할 통과', () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: validUUID,
      role: 'member',
    })
    expect(result.success).toBe(true)
  })

  it('잘못된 역할 거부', () => {
    const result = updateMemberRoleSchema.safeParse({
      userId: validUUID,
      role: 'superadmin',
    })
    expect(result.success).toBe(false)
  })
})

describe('createSeasonSchema', () => {
  it('유효한 시즌 데이터 통과', () => {
    const result = createSeasonSchema.safeParse({
      name: '시즌 1',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
    })
    expect(result.success).toBe(true)
  })

  it('빈 이름 거부', () => {
    const result = createSeasonSchema.safeParse({
      name: '',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
    })
    expect(result.success).toBe(false)
  })

  it('100자 초과 이름 거부', () => {
    const result = createSeasonSchema.safeParse({
      name: 'a'.repeat(101),
      start_date: '2025-01-01',
      end_date: '2025-03-31',
    })
    expect(result.success).toBe(false)
  })

  // 날짜 형식
  it('잘못된 날짜 형식 거부 (DD/MM/YYYY)', () => {
    const result = createSeasonSchema.safeParse({
      name: '시즌',
      start_date: '01/01/2025',
      end_date: '31/03/2025',
    })
    expect(result.success).toBe(false)
  })

  it('잘못된 날짜 형식 거부 (YYYYMMDD)', () => {
    const result = createSeasonSchema.safeParse({
      name: '시즌',
      start_date: '20250101',
      end_date: '20250331',
    })
    expect(result.success).toBe(false)
  })

  // start > end 거부
  it('종료일이 시작일보다 앞서면 거부', () => {
    const result = createSeasonSchema.safeParse({
      name: '시즌',
      start_date: '2025-03-31',
      end_date: '2025-01-01',
    })
    expect(result.success).toBe(false)
  })

  it('시작일과 종료일이 같으면 거부', () => {
    const result = createSeasonSchema.safeParse({
      name: '시즌',
      start_date: '2025-01-01',
      end_date: '2025-01-01',
    })
    expect(result.success).toBe(false)
  })
})

describe('addSeasonMembersSchema', () => {
  it('유효한 멤버 추가 통과', () => {
    const result = addSeasonMembersSchema.safeParse({
      seasonId: 'season-1',
      userIds: [validUUID],
    })
    expect(result.success).toBe(true)
  })

  it('빈 userIds 거부', () => {
    const result = addSeasonMembersSchema.safeParse({
      seasonId: 'season-1',
      userIds: [],
    })
    expect(result.success).toBe(false)
  })

  it('잘못된 UUID 포함 시 거부', () => {
    const result = addSeasonMembersSchema.safeParse({
      seasonId: 'season-1',
      userIds: ['not-uuid'],
    })
    expect(result.success).toBe(false)
  })
})

describe('adminCreateInviteCodeSchema', () => {
  it('유효한 count 통과', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 5 })
    expect(result.success).toBe(true)
  })

  it('count 1 경계값 통과', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 1 })
    expect(result.success).toBe(true)
  })

  it('count 50 경계값 통과', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 50 })
    expect(result.success).toBe(true)
  })

  it('count 0 거부', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 0 })
    expect(result.success).toBe(false)
  })

  it('count 51 거부', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 51 })
    expect(result.success).toBe(false)
  })

  it('소수점 count 거부', () => {
    const result = adminCreateInviteCodeSchema.safeParse({ count: 3.5 })
    expect(result.success).toBe(false)
  })

  it('seasonId nullable 허용', () => {
    const result = adminCreateInviteCodeSchema.safeParse({
      count: 1,
      seasonId: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('inviteCodeIdSchema', () => {
  it('유효한 UUID 통과', () => {
    expect(inviteCodeIdSchema.safeParse(validUUID).success).toBe(true)
  })

  it('잘못된 UUID 거부', () => {
    expect(inviteCodeIdSchema.safeParse('bad').success).toBe(false)
  })
})

describe('updateWeekSchema', () => {
  it('유효한 제목 통과', () => {
    const result = updateWeekSchema.safeParse({ title: '1주차' })
    expect(result.success).toBe(true)
  })

  it('null 제목 통과', () => {
    const result = updateWeekSchema.safeParse({ title: null })
    expect(result.success).toBe(true)
  })

  it('200자 초과 제목 거부', () => {
    const result = updateWeekSchema.safeParse({ title: 'a'.repeat(201) })
    expect(result.success).toBe(false)
  })
})
