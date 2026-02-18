import { describe, it, expect } from 'vitest'
import { normalizeRelation, getAuthorName } from '../supabase'

describe('normalizeRelation', () => {
  it('null 입력 시 null 반환', () => {
    expect(normalizeRelation(null)).toBeNull()
  })

  it('undefined 입력 시 null 반환', () => {
    expect(normalizeRelation(undefined as unknown as null)).toBeNull()
  })

  it('단일 객체 입력 시 그대로 반환', () => {
    const obj = { id: 1, name: 'test' }
    expect(normalizeRelation(obj)).toEqual(obj)
  })

  it('배열 입력 시 첫 번째 요소 반환', () => {
    const arr = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
    ]
    expect(normalizeRelation(arr)).toEqual({ id: 1, name: 'first' })
  })

  it('빈 배열 입력 시 null 반환', () => {
    expect(normalizeRelation([])).toBeNull()
  })

  it('한 요소 배열 입력 시 그 요소 반환', () => {
    const arr = [{ id: 1 }]
    expect(normalizeRelation(arr)).toEqual({ id: 1 })
  })

  it('문자열 단일 값 그대로 반환', () => {
    expect(normalizeRelation('hello')).toBe('hello')
  })

  it('문자열 배열 첫 요소 반환', () => {
    expect(normalizeRelation(['a', 'b'])).toBe('a')
  })
})

describe('getAuthorName', () => {
  it('authorId가 null이면 탈퇴한 멤버', () => {
    expect(getAuthorName(null, '닉네임')).toBe('탈퇴한 멤버')
  })

  it('authorId가 null이면 닉네임 무시', () => {
    expect(getAuthorName(null, null)).toBe('탈퇴한 멤버')
  })

  it('닉네임이 있으면 닉네임 반환', () => {
    expect(getAuthorName('user-1', '홍길동')).toBe('홍길동')
  })

  it('닉네임이 null이면 알 수 없음', () => {
    expect(getAuthorName('user-1', null)).toBe('알 수 없음')
  })

  it('닉네임이 undefined이면 알 수 없음', () => {
    expect(getAuthorName('user-1', undefined)).toBe('알 수 없음')
  })

  it('닉네임이 빈 문자열이면 알 수 없음', () => {
    expect(getAuthorName('user-1', '')).toBe('알 수 없음')
  })
})
