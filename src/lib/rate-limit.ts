/**
 * 간단한 in-memory rate limiter (서버 사이드 전용)
 * 단일 인스턴스 배포 기준. 스케일링 시 Redis 등으로 교체 필요.
 */

const store = new Map<string, { count: number; resetAt: number }>()

// 오래된 엔트리 주기적 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}

interface RateLimitOptions {
  /** 윈도우 내 최대 요청 수 */
  limit: number
  /** 윈도우 크기 (ms) */
  windowMs: number
}

/**
 * Rate limit 체크. 초과 시 { limited: true } 반환.
 * key는 IP나 userId 등 식별자.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): { limited: boolean } {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }

  entry.count++
  if (entry.count > limit) {
    return { limited: true }
  }

  return { limited: false }
}
