# 2026-02-07 비밀번호 초기화 기능 구현

## 작업 내용

Supabase Auth 기반 이메일 비밀번호 초기화 플로우 전체 구현.

### 생성/수정 파일 (6개)

| 파일 | 작업 |
|------|------|
| `src/lib/schemas/auth.ts` | `resetRequestSchema`, `updatePasswordSchema` 추가 |
| `src/actions/password.ts` | 신규 - `requestPasswordReset`, `updatePassword` 서버 액션 |
| `src/app/auth/confirm/route.ts` | 신규 - `verifyOtp` 토큰 교환 Route Handler |
| `src/app/(auth)/reset-password/page.tsx` | 신규 - 이메일 입력 페이지 |
| `src/app/(auth)/reset-password/update/page.tsx` | 신규 - 새 비밀번호 설정 페이지 |
| `src/app/(auth)/login/page.tsx` | "비밀번호를 잊으셨나요?" 링크 + 성공 메시지 표시 |

### 사용자 플로우

```
로그인 → "비밀번호를 잊으셨나요?" 클릭
→ /reset-password: 이메일 입력
→ 성공 메시지 (이메일 존재 여부 무관 - 보안)
→ 이메일 링크 클릭
→ /auth/confirm: verifyOtp 토큰 교환
→ /reset-password/update: 새 비밀번호 입력
→ signOut → /login?message=비밀번호가 변경되었습니다
```

## 왜 했는지

로그인 페이지에 비밀번호 분실 시 복구 방법이 없었음. 기본적인 인증 플로우 완성을 위해 필요.

## 결정된 내용

- **토큰 교환 방식**: `verifyOtp({ token_hash, type })` 사용. 기존 OAuth 콜백(`exchangeCodeForSession`)과 분리된 별도 `/auth/confirm` 엔드포인트
- **보안**: 이메일 존재 여부 미노출 (항상 성공 응답), open redirect 방지 (`next` 파라미터 `/` 시작 검증), rate limiting (초기화 3회/분, 변경 5회/분)
- **비밀번호 변경 후**: `signOut()` 호출하여 재로그인 유도
- **Suspense 경계**: `useSearchParams()` 사용하는 로그인/초기화 페이지에 Suspense boundary 추가 (Next.js 빌드 요구사항)

## 난이도/발견

- 난이도: 중하. 기존 auth 패턴(로그인/회원가입/OAuth 콜백)이 잘 잡혀 있어서 동일 패턴 따라가면 됨
- `useSearchParams()` 사용 시 Next.js가 Suspense boundary를 요구하는 것 빌드 시 발견 → 컴포넌트 분리로 해결
- Supabase PKCE 플로우에서 `token_hash`에 `pkce_` prefix가 붙는데, `verifyOtp`가 이를 처리함

## 남은 것

- **Supabase Dashboard 수동 설정 필수**: Authentication → Email Templates → Reset Password 에서 링크를 아래로 변경:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/update
  ```
- SMTP 설정: 기본 Supabase 이메일은 하루 4통 제한 + 스팸함 위험. 배포 전 Resend/Brevo 등 SMTP 설정 권장
- develop 브랜치 푸시 → dev 환경 배포 후 실제 이메일 플로우 E2E 테스트 필요

## 다음 액션

1. develop 브랜치 푸시하여 dev 환경 배포
2. Supabase Dashboard에서 이메일 템플릿 변경
3. 실제 이메일로 비밀번호 초기화 E2E 테스트
4. (선택) SMTP 설정으로 이메일 전송 안정화
