# 인증 메일 다시보내기 + 이메일 템플릿 수정

**날짜**: 2026-02-09
**브랜치**: feature/invite-code-season
**난이도**: 낮음

---

## 작업한 내용

### 1. 인증 메일 다시보내기 기능
- `check-email` 페이지에 "인증 메일 다시 보내기" 버튼 추가
- `resendVerificationEmail` 서버 액션 신규 작성 (`src/actions/auth.ts`)
- 60초 쿨다운 타이머 (클라이언트), IP 기반 분당 3회 rate limit (서버)

### 2. 이메일 템플릿 호환성 수정
- 회원가입 인증 메일 (`confirm-signup`) + 비밀번호 재설정 메일 (`reset-password`) 동일 수정
- 외부 SVG 아이콘 → 이모지(`📻`)로 교체
- CSS `background-clip: text` 그라데이션 → 단색 `color: #2563eb`
- 버튼 `linear-gradient` → `background-color` 단색 + Outlook VML 폴백

---

## 왜 했는지

- 회원가입 후 인증 메일이 스팸함에 빠지거나 늦게 도착하는 경우, 사용자가 재발송할 수단이 없었음
- 이메일 템플릿이 브라우저 미리보기에서는 정상이지만, 실제 메일 클라이언트(Gmail, Outlook)에서 디자인이 깨지는 문제 발견

---

## 결정된 내용

| 항목 | 결정 | 이유 |
|------|------|------|
| 아이콘 | 이모지(`📻`) 사용 | 외부 SVG/PNG 호스팅 불필요, 모든 메일 클라이언트 지원 |
| 텍스트 색상 | 단색 파란색 | `background-clip: text`는 이메일 CSS 미지원 |
| 버튼 | 단색 + VML 폴백 | Outlook은 CSS 버튼 무시, VML로 대응 |
| 쿨다운 | 60초 | 남용 방지 + Supabase rate limit과 균형 |
| Rate limit | 분당 3회 | signup(5회)보다 낮게 설정 |

---

## 발견/느낀 점

- **이메일 HTML은 1999년 수준의 CSS만 안전함** — `linear-gradient`, `background-clip`, 외부 SVG 전부 안 됨
- Supabase 대시보드 미리보기는 브라우저 렌더링이라 실제 메일 클라이언트와 차이 큼
- 스크린샷에서 폴백 링크가 `supabase.co/auth/v1/verify` 형태로 나온 건 **대시보드에 커스텀 템플릿이 미적용 상태**라는 뜻 — 템플릿 붙여넣기 필요

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `src/actions/auth.ts` | `resendVerificationEmail` 서버 액션 추가 |
| `src/app/(auth)/signup/check-email/page.tsx` | 다시보내기 버튼 + 쿨다운 + 상태 관리 |
| `docs/emails/confirm-signup.md` | 이메일 호환 템플릿으로 수정 |
| `docs/emails/reset-password.md` | 동일 수정 |

---

## 남은 것

- [ ] Supabase Dashboard에 수정된 템플릿 2개 실제 적용 (수동)
- [ ] 적용 후 실제 메일 수신 테스트로 렌더링 확인

---

## 다음 액션

1. Supabase Dashboard → Email Templates에 HTML 붙여넣기
2. 테스트 계정으로 가입 → 메일 수신 → 디자인 확인
3. 비밀번호 재설정도 동일 테스트
