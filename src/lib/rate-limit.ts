import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

interface RateLimitOptions {
  /** 윈도우 내 최대 요청 수 */
  limit: number
  /** 윈도우 크기 (ms) */
  windowMs: number
}

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
    const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL 및 UPSTASH_REDIS_REST_TOKEN 환경변수가 필요합니다.'
      )
    }
    redis = new Redis({ url, token })
  }
  return redis
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    })
    limiters.set(key, limiter)
  }
  return limiter
}

/**
 * Rate limit 체크. 초과 시 { limited: true } 반환.
 * key는 IP나 userId 등 식별자.
 */
export async function rateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): Promise<{ limited: boolean }> {
  const { success } = await getLimiter(limit, windowMs).limit(key)
  return { limited: !success }
}
