# 2026-02-09 Resend 이메일 서비스 세팅

## 작업 내용

### Resend 도입 (Supabase 내장 이메일 → Resend)
- Supabase Custom SMTP를 Resend로 교체
- Resend SDK 설치 및 클라이언트 코드 작성 (향후 알림 기능용)
- 이메일 알림 계획 문서를 AWS SES → Resend로 전면 교체

### 이메일 인증 링크 버그 수정
- **증상**: 회원가입 이메일은 오지만 인증 링크 클릭 시 "잘못된 링크입니다" 에러
- **원인**: 이메일 템플릿이 `{{ .ConfirmationURL }}` 사용 → Supabase 서버에서 토큰 소비 후 앱으로 리다이렉트 → `token_hash`, `type` 파라미터 누락 → `/auth/confirm` 라우트에서 실패
- **해결**: 템플릿을 `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard` 형식으로 변경 (PKCE 방식으로 앱에서 직접 토큰 검증)

## 왜 했는지

- Supabase 내장 이메일: 시간당 3~4통 제한, 스팸함 도착 빈번, 커스텀 도메인 불가
- AWS SES 대신 Resend 선택: sandbox 탈출 불필요, 설정 간단 (host/username 고정), SDK 가벼움
- 무료 플랜 월 3,000건이면 스터디 규모에 충분

## 결정된 내용

| 항목 | 결정 |
|------|------|
| 이메일 서비스 | Resend (SMTP + API 동일 키) |
| Auth 이메일 | Supabase SMTP 백엔드만 교체 (코드 변경 없음) |
| 커스텀 알림 | Resend SDK로 직접 발송 (클라이언트 준비 완료) |
| 이메일 템플릿 | `{{ .TokenHash }}` 기반 PKCE 방식 |
| 도메인 | `noreply@riffles.cloud` |

## 변경 파일

| 파일 | 변경 |
|------|------|
| `package.json` | `resend` 6.9.1 추가 |
| `src/lib/email/resend.ts` | 신규 - Resend 클라이언트 |
| `.env.example` | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 추가 |
| `docs/emails/confirm-signup.md` | `{{ .ConfirmationURL }}` → `{{ .TokenHash }}` + Outlook VML 호환 |
| `docs/emails/reset-password.md` | 동일 |
| `docs/email-notification-plan.md` | AWS SES → Resend 전면 교체 |

## 발견/배운 점

- `@supabase/ssr`(PKCE 방식)에서는 `{{ .ConfirmationURL }}`이 아닌 `{{ .TokenHash }}`를 써야 함. `ConfirmationURL`은 Supabase 서버에서 토큰을 소비하고 리다이렉트하는데, PKCE는 앱에서 직접 `verifyOtp()`를 호출하는 구조라 파라미터가 전달되지 않음
- Resend는 내부적으로 AWS SES를 사용하지만, DNS 레코드도 amazonses.com 기반. DKIM/SPF 설정이 SES와 유사

## 남은 것

- [ ] Supabase Dashboard에서 이메일 템플릿 실제 적용 (confirm signup, reset password)
- [ ] Site URL이 프로덕션 도메인으로 설정되어 있는지 확인
- [ ] 이메일 인증 플로우 E2E 테스트
- [ ] 알림 기능 구현 (DB 마이그레이션, Server Action, UI 토글) — `docs/email-notification-plan.md` 참조

## 난이도

낮음. Resend 세팅 자체는 간단. 이메일 인증 버그 원인 파악이 핵심이었음.
