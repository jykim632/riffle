import { z } from 'zod'

/**
 * Server Action 공통 응답 타입
 */
export type ActionResult<T = void> =
  | ({ success: true } & (T extends void ? object : T))
  | { success: false; error: string }

/**
 * Zod 스키마 검증 후 첫 번째 에러 메시지 반환.
 * 성공 시 파싱된 데이터, 실패 시 { error } 반환.
 */
export function parseFormData<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (!result.success) {
    const firstError = result.error.issues[0]
    return {
      success: false,
      error: firstError?.message || '입력값이 올바르지 않습니다.',
    }
  }
  return { success: true, data: result.data }
}
