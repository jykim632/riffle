import { z } from 'zod'

// 요약본 작성 스키마
export const createSummarySchema = z.object({
  weekId: z.string().min(1, '주차를 선택해주세요'),
  content: z
    .string()
    .min(10, '요약본은 최소 10자 이상 작성해주세요')
    .max(10000, '요약본은 10000자 이하로 작성해주세요')
    .refine((val) => val.trim().length > 0, {
      message: '빈 내용은 제출할 수 없습니다',
    }),
})

export type CreateSummaryInput = z.infer<typeof createSummarySchema>

// 요약본 수정 스키마
export const updateSummarySchema = z.object({
  summaryId: z.string().uuid('유효하지 않은 요약본 ID입니다'),
  weekId: z.string().min(1, '주차를 선택해주세요'),
  content: z
    .string()
    .min(10, '요약본은 최소 10자 이상 작성해주세요')
    .max(10000, '요약본은 10000자 이하로 작성해주세요')
    .refine((val) => val.trim().length > 0, {
      message: '빈 내용은 제출할 수 없습니다',
    }),
})

export type UpdateSummaryInput = z.infer<typeof updateSummarySchema>

// 요약본 삭제 스키마
export const deleteSummarySchema = z.object({
  summaryId: z.string().uuid('유효하지 않은 요약본 ID입니다'),
})

export type DeleteSummaryInput = z.infer<typeof deleteSummarySchema>
