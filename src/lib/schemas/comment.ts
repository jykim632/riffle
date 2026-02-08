import { z } from 'zod'

// 댓글 작성 스키마
export const createCommentSchema = z.object({
  summaryId: z.string().uuid('유효하지 않은 요약본 ID입니다'),
  content: z
    .string()
    .min(1, '댓글을 입력해주세요')
    .max(500, '댓글은 500자 이하로 작성해주세요')
    .refine((val) => val.trim().length > 0, {
      message: '빈 댓글은 제출할 수 없습니다',
    }),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

// 댓글 수정 스키마
export const updateCommentSchema = z.object({
  commentId: z.string().uuid('유효하지 않은 댓글 ID입니다'),
  content: z
    .string()
    .min(1, '댓글을 입력해주세요')
    .max(500, '댓글은 500자 이하로 작성해주세요')
    .refine((val) => val.trim().length > 0, {
      message: '빈 댓글은 제출할 수 없습니다',
    }),
})

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>

// 댓글 삭제 스키마
export const deleteCommentSchema = z.object({
  commentId: z.string().uuid('유효하지 않은 댓글 ID입니다'),
})

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>
