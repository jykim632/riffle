import { z } from 'zod'

export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 100

const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다`)
  .max(PASSWORD_MAX_LENGTH, `비밀번호는 ${PASSWORD_MAX_LENGTH}자 이하여야 합니다`)
  .regex(/[A-Z]/, '대문자를 최소 1개 포함해야 합니다')
  .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, '특수문자를 최소 1개 포함해야 합니다')

// 로그인 스키마 (기존 사용자 호환을 위해 복잡도 검증 미적용)
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})

export type LoginInput = z.infer<typeof loginSchema>

// 회원가입 스키마
export const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: passwordField,
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9가-힣_]+$/, '닉네임은 한글, 영문, 숫자, _만 사용 가능합니다'),
  inviteCode: z
    .string()
    .min(8, '초대 코드는 8자여야 합니다')
    .max(8, '초대 코드는 8자여야 합니다')
    .regex(/^[A-Z0-9]+$/, '유효하지 않은 초대 코드입니다'),
})

export type SignupInput = z.infer<typeof signupSchema>

// 비밀번호 초기화 요청 스키마
export const resetRequestSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
})

export type ResetRequestInput = z.infer<typeof resetRequestSchema>

// 새 비밀번호 설정 스키마
export const updatePasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

// 비밀번호 변경 스키마 (로그인 상태에서)
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
