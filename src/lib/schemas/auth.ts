import { z } from 'zod'

// 로그인 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다'),
})

export type LoginInput = z.infer<typeof loginSchema>

// 회원가입 스키마
export const signupSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .max(100, '비밀번호는 100자 이하여야 합니다'),
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
