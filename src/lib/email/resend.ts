import { Resend } from 'resend'

/**
 * Resend 클라이언트 (서버 전용)
 * 커스텀 이메일 발송용 (요약본 알림 등).
 * Supabase Auth 이메일(가입 인증, 비밀번호 재설정)은 Supabase SMTP 설정으로 처리.
 */
export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@riffles.cloud'
