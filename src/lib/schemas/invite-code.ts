import { z } from 'zod'

// 초대 코드 생성 스키마 (관리자 전용)
export const createInviteCodeSchema = z.object({
  // 초대 코드는 서버에서 자동 생성하므로 입력 필요 없음
})

export type CreateInviteCodeInput = z.infer<typeof createInviteCodeSchema>

// 초대 코드 검증 스키마
export const verifyInviteCodeSchema = z.object({
  code: z
    .string()
    .min(8, '초대 코드는 8자여야 합니다')
    .max(8, '초대 코드는 8자여야 합니다')
    .regex(/^[A-Z0-9]+$/, '유효하지 않은 초대 코드 형식입니다'),
})

export type VerifyInviteCodeInput = z.infer<typeof verifyInviteCodeSchema>
