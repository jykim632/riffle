import { z } from 'zod'

export const linkCategorySchema = z.enum(['article', 'book', 'video'])

export type LinkCategory = z.infer<typeof linkCategorySchema>

export const LINK_CATEGORY_LABELS: Record<LinkCategory, string> = {
  article: '기사',
  book: '책',
  video: '영상',
}

export const createSharedLinkSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요')
    .url('올바른 URL 형식이 아닙니다'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(200, '제목은 200자 이하로 작성해주세요'),
  category: linkCategorySchema,
  comment: z
    .string()
    .max(300, '코멘트는 300자 이하로 작성해주세요')
    .optional()
    .transform((val) => (val?.trim() === '' ? undefined : val)),
})

export type CreateSharedLinkInput = z.infer<typeof createSharedLinkSchema>

export const deleteSharedLinkSchema = z.object({
  linkId: z.string().uuid('유효하지 않은 링크 ID입니다'),
})

export type DeleteSharedLinkInput = z.infer<typeof deleteSharedLinkSchema>
