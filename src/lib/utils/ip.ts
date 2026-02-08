import { headers } from 'next/headers'

/**
 * 요청 클라이언트 IP 추출 (rate limiting용)
 * Cloudflare 프록시 → Vercel 순서로 확인
 */
export async function getClientIp(): Promise<string> {
  const h = await headers()
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
