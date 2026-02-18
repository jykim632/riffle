import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  signupSchema,
  updatePasswordSchema,
  changePasswordSchema,
  resetRequestSchema,
} from '../auth'

describe('loginSchema', () => {
  it('유효한 이메일/비밀번호 통과', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password',
    })
    expect(result.success).toBe(true)
  })

  it('빈 이메일 거부', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password' })
    expect(result.success).toBe(false)
  })

  it('잘못된 이메일 형식 거부', () => {
    const result = loginSchema.safeParse({
      email: 'not-email',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  it('빈 비밀번호 거부', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('signupSchema', () => {
  const validSignup = {
    email: 'test@example.com',
    password: 'Abcdef1!',
    nickname: 'testUser',
    inviteCode: 'ABCD1234',
  }

  it('유효한 회원가입 데이터 통과', () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true)
  })

  // 비밀번호 복잡도
  it('대문자 없는 비밀번호 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'abcdef1!',
    })
    expect(result.success).toBe(false)
  })

  it('특수문자 없는 비밀번호 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Abcdef12',
    })
    expect(result.success).toBe(false)
  })

  it('8자 미만 비밀번호 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'Ab1!',
    })
    expect(result.success).toBe(false)
  })

  it('100자 초과 비밀번호 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: 'A!' + 'a'.repeat(99),
    })
    expect(result.success).toBe(false)
  })

  // 닉네임
  it('한글 닉네임 통과', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: '테스트유저',
    })
    expect(result.success).toBe(true)
  })

  it('밑줄 포함 닉네임 통과', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: 'test_user',
    })
    expect(result.success).toBe(true)
  })

  it('특수문자 포함 닉네임 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: 'test@user',
    })
    expect(result.success).toBe(false)
  })

  it('공백 포함 닉네임 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: 'test user',
    })
    expect(result.success).toBe(false)
  })

  it('빈 닉네임 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: '',
    })
    expect(result.success).toBe(false)
  })

  it('21자 닉네임 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      nickname: 'a'.repeat(21),
    })
    expect(result.success).toBe(false)
  })

  // 초대 코드
  it('유효한 초대코드 통과', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      inviteCode: 'ABCD1234',
    })
    expect(result.success).toBe(true)
  })

  it('소문자 초대코드 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      inviteCode: 'abcd1234',
    })
    expect(result.success).toBe(false)
  })

  it('7자 초대코드 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      inviteCode: 'ABCD123',
    })
    expect(result.success).toBe(false)
  })

  it('9자 초대코드 거부', () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      inviteCode: 'ABCD12345',
    })
    expect(result.success).toBe(false)
  })
})

describe('updatePasswordSchema', () => {
  it('일치하는 비밀번호 통과', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })
    expect(result.success).toBe(true)
  })

  it('불일치하는 비밀번호 거부', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'NewPass1!',
      confirmPassword: 'Different1!',
    })
    expect(result.success).toBe(false)
  })

  it('복잡도 미달 비밀번호 거부', () => {
    const result = updatePasswordSchema.safeParse({
      password: 'simple',
      confirmPassword: 'simple',
    })
    expect(result.success).toBe(false)
  })
})

describe('changePasswordSchema', () => {
  it('유효한 비밀번호 변경 통과', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })
    expect(result.success).toBe(true)
  })

  it('빈 현재 비밀번호 거부', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: '',
      newPassword: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })
    expect(result.success).toBe(false)
  })

  it('새 비밀번호 불일치 거부', () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: 'oldpassword',
      newPassword: 'NewPass1!',
      confirmPassword: 'Wrong1!',
    })
    expect(result.success).toBe(false)
  })
})

describe('resetRequestSchema', () => {
  it('유효한 이메일 통과', () => {
    expect(
      resetRequestSchema.safeParse({ email: 'a@b.com' }).success
    ).toBe(true)
  })

  it('잘못된 이메일 거부', () => {
    expect(
      resetRequestSchema.safeParse({ email: 'invalid' }).success
    ).toBe(false)
  })
})
