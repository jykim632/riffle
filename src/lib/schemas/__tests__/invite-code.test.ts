import { describe, it, expect } from 'vitest'
import { verifyInviteCodeSchema } from '../invite-code'

describe('verifyInviteCodeSchema', () => {
  it('유효한 8자 대문자+숫자 코드 통과', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCD1234' }).success
    ).toBe(true)
  })

  it('숫자로만 된 8자 코드 통과', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: '12345678' }).success
    ).toBe(true)
  })

  it('대문자로만 된 8자 코드 통과', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCDEFGH' }).success
    ).toBe(true)
  })

  it('소문자 포함 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'abcd1234' }).success
    ).toBe(false)
  })

  it('특수문자 포함 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCD123!' }).success
    ).toBe(false)
  })

  it('7자 코드 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCD123' }).success
    ).toBe(false)
  })

  it('9자 코드 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCD12345' }).success
    ).toBe(false)
  })

  it('빈 문자열 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: '' }).success
    ).toBe(false)
  })

  it('공백 포함 거부', () => {
    expect(
      verifyInviteCodeSchema.safeParse({ code: 'ABCD 234' }).success
    ).toBe(false)
  })
})
