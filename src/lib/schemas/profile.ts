import { z } from 'zod'

// 닉네임 변경 스키마
export const updateNicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, '닉네임을 입력해주세요')
    .max(20, '닉네임은 20자 이하여야 합니다')
    .regex(/^[a-zA-Z0-9가-힣_]+$/, '닉네임은 한글, 영문, 숫자, _만 사용 가능합니다'),
})

export type UpdateNicknameInput = z.infer<typeof updateNicknameSchema>
