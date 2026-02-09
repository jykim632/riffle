# 출시 전 보안 점검 및 버그 수정

**날짜**: 2026-02-09
**모드**: log

---

## 작업한 내용

### 1. 전체 코드베이스 보안 점검 (3개 영역 병렬 리뷰)
- **인증 플로우**: 회원가입, 로그인, OAuth 콜백, 비밀번호 초기화, 세션 관리
- **핵심 기능**: Server Actions 인증 체크, Zod 검증, RLS, 마크다운 XSS
- **UI/모바일**: 반응형 레이아웃, 다크모드, 접근성, 로딩/에러 상태

### 2. Critical 이슈 수정
- **C-1**: OAuth 콜백에서 초대코드 실패 시 `signOut()` → `deleteUser()`로 변경하여 유령 계정 방지
- **C-2**: `/reset-password/update` 페이지에 서버사이드 세션 검증 추가 (서버 컴포넌트 + 클라이언트 폼 분리)

### 3. Important 이슈 수정
- **I-1**: 회원가입 비밀번호 placeholder "6자 이상" → 실제 검증 규칙(8자)과 일치하도록 수정

### 4. 비밀번호 규칙 중앙화 + 복잡도 강화
- `PASSWORD_MIN_LENGTH`, `PASSWORD_MAX_LENGTH` 상수 도입
- `passwordField` 공통 Zod 필드로 4개 스키마 통합
- 대문자 1개 + 특수문자 1개 필수 규칙 추가
- 로그인 스키마는 기존 사용자 호환을 위해 복잡도 검증 미적용

### 5. 사용자 가이드 업데이트
- Google 로그인 시 Supabase URL 표시에 대한 안심 안내 FAQ 추가

---

## 왜 했는지

서비스 오픈 직전, 사용자에게 공개하기 전에 실제 운영 환경에서 발생할 수 있는 버그와 보안 취약점을 사전에 제거하기 위해.

---

## 논의/고민

- **로그인 스키마에 복잡도 검증 넣을지**: 기존 사용자가 새 규칙에 안 맞는 비밀번호로 로그인 못 하는 문제 → 로그인에는 미적용으로 결정
- **비밀번호 검증 3중 방어**: 프론트(Zod+RHF) / Server Actions(Zod) / Supabase Auth(대시보드 설정) — Supabase 대시보드 설정은 수동으로 해야 함
- **OAuth 유령 계정 문제**: `signOut()`만 하면 auth.users에 레코드가 남고, profiles 트리거로 쓰레기 데이터 생성 → `adminClient.auth.admin.deleteUser()`로 완전 삭제

---

## 결정된 내용

| 항목 | 결정 |
|------|------|
| 비밀번호 복잡도 | 8자 이상 + 대문자 1개 + 특수문자 1개 |
| 로그인 검증 | 복잡도 미적용 (기존 사용자 호환) |
| OAuth 실패 처리 | signOut → deleteUser |
| reset-password/update | 서버 컴포넌트에서 세션 검증 후 클라이언트 폼 렌더 |

---

## 발견/느낀 점

- 전체적인 보안 수준은 높았음 (RLS, Zod, rate limiting, 초대코드 race condition 방어 등)
- OAuth 콜백이 가장 취약 지점 — 여러 분기에서 계정 정리가 일관되지 않았음
- 비밀번호 규칙이 4곳에 하드코딩되어 있었는데, 중앙화하니 변경이 한 곳에서 끝남
- 리뷰에서 나온 나머지 이슈들(댓글 rate limiting, admin Zod 검증, 다크모드 토글 등)은 출시 후 개선 가능

---

## 남은 것 / 출시 후 개선

- [ ] Supabase 대시보드 Password Policy 설정 (대문자/특수문자 규칙 동기화)
- [ ] 댓글 작성에 rate limiting 추가
- [ ] Admin actions에 Zod 스키마 검증 추가
- [ ] 비밀번호 초기화 API 이메일 존재 여부 노출 방지 (타이밍 공격)
- [ ] 다크모드 토글 메커니즘 구현 (ThemeProvider + 토글 버튼)
- [ ] 관리자 테이블 모바일 UX 개선

---

## 다음 액션

- Supabase 대시보드 Password Policy 수동 설정
- 카카오톡 오픈 알림 발송
- 사용자 피드백 수집 후 우선순위 조정

---

## 커밋 로그

- `a19f969` feat: 사용자 가이드에 Google 로그인 Supabase URL 안내 FAQ 추가
- `77de4d0` fix: 출시 전 보안 점검 이슈 수정
