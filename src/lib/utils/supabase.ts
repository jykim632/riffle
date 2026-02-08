/**
 * Supabase JOIN 결과 타입 정규화.
 * JOIN이 배열 또는 단일 객체로 올 수 있어서 통일해준다.
 */
export function normalizeRelation<T>(relation: T | T[] | null): T | null {
  if (relation == null) return null
  return Array.isArray(relation) ? relation[0] ?? null : relation
}

/**
 * 탈퇴한 멤버 닉네임 표시
 */
export function getAuthorName(
  authorId: string | null,
  nickname: string | null | undefined
): string {
  if (authorId === null) return '탈퇴한 멤버'
  return nickname || '알 수 없음'
}
