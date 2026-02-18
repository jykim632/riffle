# Riffle 프로젝트 종합 분석 보고서 v2

> 날짜: 2026-02-14
> 분석 방법: 4명 시니어 에이전트 병렬 분석 (아키텍트, 보안 리뷰어, 백엔드 리스크, UX 비평)
> v2 변경사항: Next.js 16 proxy.ts 변경의 **설계 철학 + CVE-2025-29927 + breaking changes** 반영. 기존 v1은 파일명만 바꾸고 핵심을 놓쳤음.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스 | 매주 경제 라디오 요약본을 제출/관리하는 폐쇄형 스터디 웹앱 |
| 규모 | ~11,750줄 TypeScript/React |
| 스택 | Next.js 16.1.6 (App Router) + React 19.2.3 + Supabase + Tailwind v4.1.18 + shadcn/ui |
| 배포 | Vercel + Supabase Cloud |
| 개발/운영 | 1인 |

---

## 0. v1 대비 핵심 변경점

기존 보고서(v1)가 놓친 것들:

| 항목 | v1 | v2 |
|------|-----|-----|
| proxy.ts 분석 | 파일명 변경만 언급 | 설계 철학, CVE, Supabase 공식 패턴, 런타임 변경 심층 분석 |
| CVE-2025-29927 | 미언급 | Node.js 런타임에서 해결됨 — 현재 안전 |
| Next.js 16 breaking changes | 미분석 | Async APIs, Turbopack, React Compiler 등 전체 영향 분석 |
| React 19.2 신기능 | 미언급 | View Transitions, Activity, useEffectEvent 활용 기회 |
| proxy.ts 세션 갱신 | "미들웨어"로 서술 | Supabase 공식 권장 패턴임을 확인 — 제거 불가 |
| 대시보드 쿼리 | "7~10개 순차" | 실제 코드 기반: 9번 라운드트립, 일부 이미 Promise.all 사용 |
| RISK-14 (빈 catch) | "디버깅 불가능" | Supabase 공식 패턴 (Server Component에서 쿠키 설정 불가하여 의도적) |
| Enhanced routing | 미분석 | prefetch 요청 증가 → proxy.ts 실행 빈도 증가 리스크 추가 |

---

## 1. Next.js 16 proxy.ts 심층 분석 (신규 섹션)

### 1.1 배경: middleware.ts → proxy.ts 왜 바꿨나?

Next.js 16에서 `middleware.ts`를 `proxy.ts`로 이름을 바꾼 이유:

1. **CVE-2025-29927**: Edge Runtime에서 고부하 시 middleware 인증을 우회할 수 있는 취약점 발견
2. **용어 혼란**: "middleware"가 Express.js 미들웨어와 혼동 → 과도한 로직 집중 유도
3. **설계 방향**: proxy.ts는 **네트워크 경계의 프록시**로, 라우팅(rewrite/redirect/headers) 전용 권장
4. **런타임 변경**: Edge → **Node.js 고정** (설정 변경 불가)

### 1.2 현재 proxy.ts 평가

```
src/proxy.ts의 두 가지 역할:
├── (1) Supabase 세션 갱신 (쿠키 기반 토큰 리프레시)
└── (2) 라우트 보호 (미인증 사용자 /login 리다이렉트)
```

#### (1) Supabase 세션 갱신 — 유지 필수

**결론: 제거 불가. Supabase 공식 권장 패턴.**

- `@supabase/ssr` 패키지는 proxy.ts에서 세션 갱신하도록 설계됨
- 토큰 리프레시는 **모든 요청의 response 쿠키에 반영**해야 함
- Layout/Server Component에서는 response 쿠키를 직접 설정할 수 없음
- proxy.ts가 유일하게 request → response 쿠키 파이프라인을 제어할 수 있는 위치

> 근거: [Supabase SSR Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — "Refresh tokens in middleware/proxy"

#### (2) 라우트 보호 — UX 레이어 (보안 아님)

**결론: 유지 권장하되, "보안 계층"으로 간주하면 안 됨.**

| 관점 | 분석 |
|------|------|
| Next.js 16 권장 | proxy.ts에서 인증 "가능"하지만 Layout/Route Handler 권장 |
| 현재 상태 | Layout `requireUser()`가 실제 보안 게이트 |
| proxy.ts 인증 제거 시 | 미인증 사용자가 Layout에서 에러 → `/login` 리다이렉트 (UX 저하, 보안은 유지) |
| 제거 여부 | 유지 추천 — UX 가치 > 미미한 오버헤드 |

#### CVE-2025-29927 현재 프로젝트 영향

| 항목 | 상태 |
|------|------|
| 취약점 | Edge Runtime에서 고부하 시 middleware auth bypass |
| 현재 런타임 | **Node.js** (Next.js 16 기본) |
| 영향 | **해당 없음** — Node.js 런타임에서 CVE 재현 불가 |
| 추가 방어 | Layout `requireUser()` + RLS로 이중 보호 |

#### Node.js 런타임 전환 영향

| 항목 | Edge (v15) | Node.js (v16) |
|------|-----------|---------------|
| Cold start | ~5-50ms | ~200-500ms |
| Region | 사용자 가까운 엣지 | Vercel Function 리전 |
| API 호환성 | 제한적 | 전체 Node.js API |
| Supabase 안정성 | 가끔 불안정 | 안정적 |
| 이 프로젝트 영향 | - | 소규모 한국 대상, 무시 가능 |

### 1.3 proxy.ts 개선 필요 사항

#### [중요] config.matcher에서 API 라우트 제외

```typescript
// 현재 (문제)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// 개선안: api 라우트 제외 + prefetch 요청 최적화
export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
```

이점:
- API 라우트에 외부 서비스 콜백 추가해도 인증 redirect 안 걸림
- prefetch 요청에 proxy 실행 안 함 → Supabase `getUser()` 호출 감소

#### [권장] protectedPaths 화이트리스트 전환

```typescript
// 현재: 블랙리스트 (보호 경로 나열) — 누락 위험
const protectedPaths = ['/dashboard', '/admin', '/mine', '/summaries']
// 누락: /indicators, /settings, /guide (requireUser()로 커버되긴 함)

// 개선안: 화이트리스트 (공개 경로 나열)
const publicPaths = ['/login', '/signup', '/reset-password', '/auth']
const isPublicPath = publicPaths.some(p => request.nextUrl.pathname.startsWith(p))
if (!isPublicPath && !user) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## 2. Next.js 16 Breaking Changes 영향 분석 (신규 섹션)

### 적용 완료

| 변경사항 | 상태 | 근거 |
|---------|------|------|
| middleware.ts → proxy.ts | ✅ 완료 | `src/proxy.ts` 존재 |
| Async Request APIs | ✅ 완료 | `server.ts`에서 `await cookies()` 사용 |
| Turbopack 기본값 | ✅ 호환 | webpack 커스텀 설정 없음 (Sentry `withSentryConfig`는 호환) |
| AMP 제거 | ✅ 해당 없음 | AMP 미사용 |
| Runtime config 제거 | ✅ 해당 없음 | 미사용 |

### 적용 필요/검토 필요

| 변경사항 | 상태 | 권장 조치 | 난이도 |
|---------|------|---------|--------|
| React Compiler | ⚠️ 미활성화 | `next.config.ts`에 `reactCompiler: true` 추가 | 매우 낮 |
| ESLint Flat Config | ⚠️ 확인 필요 | `eslint-config-next` 16.1.6 설치됨, flat config 마이그레이션 확인 | 낮 |
| next/image `localPatterns.search` | ⚠️ 확인 필요 | 쿼리스트링 있는 로컬 이미지 사용 시 설정 필요 | 낮 |
| `config.matcher` API 라우트 제외 | ❌ 미적용 | 위 1.3 참조 | 낮 |
| Parallel routes `default.js` | ✅ 해당 없음 | `@` slot 미사용 | - |

### 활용 가능 신기능

| 신기능 | 설명 | 활용 지점 | 난이도 | 가치 |
|--------|------|---------|--------|------|
| React Compiler | 자동 메모이제이션 | 전체 앱 | 매우 낮 | 중 |
| View Transitions | 페이지 전환 애니메이션 | 대시보드↔요약본, 관리자↔대시보드 | 중 | 높 |
| Activity | 백그라운드 렌더링 | 요약본 작성 중 다른 페이지 갔다 올 때 상태 유지 | 중 | 높 |
| updateTag | Server Action 후 즉시 UI 반영 | 댓글/요약본 CRUD | 낮 | 중 |
| useEffectEvent | Effect 내 비반응형 로직 분리 | 클라이언트 컴포넌트 | 낮 | 낮 |
| refresh() | Server Action에서 라우터 리프레시 | 알림/상태 변경 | 낮 | 낮 |

---

## 3. 아키텍처 분석

### 디렉토리 구조

```
src/
├── actions/           # 사용자향 Server Actions (auth, summaries, comments, profile, password)
├── app/               # Next.js App Router 라우트
│   ├── (auth)/        # 인증 (로그인, 회원가입, 비밀번호 재설정)
│   ├── (dashboard)/   # 메인 앱 (대시보드, 요약본, 경제지표, 설정, 가이드)
│   ├── admin/         # 관리자 패널 (시즌, 주차, 멤버, 초대코드, 지표)
│   ├── api/cron/      # Vercel Cron (경제지표 자동 수집)
│   └── auth/          # OAuth 콜백 & 이메일 인증 라우트 핸들러
├── components/        # UI 컴포넌트
│   ├── ui/            # shadcn/ui 기본 (22개)
│   ├── admin/         # 관리자 전용
│   ├── dashboard/     # 대시보드 위젯
│   ├── summary/       # 요약본 CRUD
│   ├── comment/       # 댓글
│   ├── indicators/    # 경제지표 카드/차트
│   ├── season/        # 시즌 접근 제어
│   └── auth/          # 인증 UI
├── lib/
│   ├── supabase/      # Supabase 클라이언트 3종 (server, client, admin)
│   ├── schemas/       # Zod 스키마
│   ├── actions/admin/ # 관리자 Server Actions + auth-guard
│   ├── queries/       # 재사용 DB 쿼리 함수
│   ├── ecos/          # 한국은행 ECOS API 클라이언트
│   ├── types/         # TypeScript 타입
│   ├── utils/         # 유틸리티
│   ├── email/         # Resend 이메일
│   └── auth.ts        # requireUser() 핵심 인증
├── proxy.ts           # Next.js 16 프록시 (세션 갱신 + UX 라우트 보호)
└── instrumentation.ts # Sentry 초기화
```

### 데이터 모델

```
auth.users (Supabase 관리)
  └── profiles (1:1, 트리거 자동 생성)
        ├── role: admin | member
        └── nickname

seasons (시즌)
  ├── weeks (주차) - 시즌별 자동 생성
  │     ├── summaries (요약본)
  │     │     └── comments (댓글)
  │     └── economic_indicators (경제지표 스냅샷)
  └── season_members (시즌 멤버)

invite_codes (초대코드) - 가입 시 소비, season_id 연결 가능

DB Views:
  - latest_summaries: 사용자별 최신 요약만
  - first_summaries: 사용자별 첫 요약만 (대시보드)
  - indicator_snapshots: 경제지표 스냅샷 뷰
```

### 인증/인가 레이어 (5중 보호) — 역할 재정의

| 레이어 | 구현 | 역할 | 제거 가능? |
|--------|------|------|-----------|
| proxy.ts 세션 갱신 | `createServerClient` + `getUser()` | 토큰 리프레시 (Supabase 필수) | **불가** |
| proxy.ts 라우트 보호 | `protectedPaths` 매칭 | **UX 편의** (로그인 리다이렉트) | 가능 (UX 저하) |
| Layout `requireUser()` | DB `getUser()` 호출 | **실제 보안 게이트** | 불가 |
| Server Action `requireAdmin()` | 인증 + 역할 체크 | 뮤테이션 보호 | 불가 |
| RLS (Supabase) | PostgreSQL 정책 | 최종 데이터 보호 | 불가 |

> v1 오해 교정: proxy.ts의 라우트 보호는 "보안 레이어"가 아니라 "UX 레이어"임. 보안은 Layout `requireUser()` + RLS가 담당.

### 잘된 점

- 관심사 분리 명확 (actions / queries / schemas / components)
- Server Components 우선 → 전역 상태 없이 복잡도 최소화
- Route Groups `(auth)`, `(dashboard)` 레이아웃 분리
- Zod 스키마 중앙화, DB 뷰 활용
- `normalizeRelation()` 유틸로 Supabase JOIN 타입 불일치 일관 처리
- Async Request APIs 정상 적용 (`await cookies()` 등)

### 개선 필요점

- `dashboard/page.tsx` 순차 쿼리 9번 라운드트립 (일부만 `Promise.all` 적용) → 추가 병렬화 필요
- `isAdmin()`, `isCurrentSeasonMember()`가 각각 `createClient()` 생성 → `requireUser()` 결과 재사용 가능
- `protectedPaths` 블랙리스트 방식 + `/indicators`, `/settings`, `/guide` 누락
- `config.matcher`가 API 라우트 미제외 + prefetch 요청 미최적화
- Supabase 뷰 JOIN 결과 타입 매번 인라인 선언 → 공용 타입 추출 가능
- React Compiler 미활성화 (설정 한 줄로 적용 가능)

---

## 4. 코드 품질 & 보안

### 보안 강점 (업계 모범 사례 수준)

1. CSP 헤더 설정 (script-src, connect-src 등 명시)
2. XSS 방어 (인라인 HTML 미사용, `react-markdown` sanitize)
3. Open Redirect 방어 (`next.startsWith('/')` 검증)
4. Race Condition 방어 (`acquire_invite_code` FOR UPDATE 행 잠금)
5. Role Escalation 방어 (DB 트리거 `prevent_role_escalation`)
6. RLS FORCE 전 테이블 적용
7. Rate Limiting: 로그인(10/분), 가입(5/분), 비밀번호(3~5/분)
8. CSRF: Server Actions 자동 관리
9. 초대코드 유령 계정 방지 (OAuth 실패 시 계정 삭제)
10. 보안 헤더: X-Frame-Options DENY, X-Content-Type-Options nosniff 등
11. **CVE-2025-29927 영향 없음**: Node.js 런타임 + Layout 이중 보호

### 발견 이슈

#### [High] 고정 비밀번호 초기화

- **파일**: `src/lib/actions/admin/members.ts:59-79`
- `ADMIN_RESET_PASSWORD` 환경변수에 설정된 고정 비밀번호로 모든 멤버 초기화
- 한 명이 초기화 비밀번호를 알면 다른 초기화 계정에도 접근 가능
- 비밀번호 변경 강제 메커니즘 없음
- **개선안**: `crypto.randomBytes()`로 랜덤 임시 비밀번호 생성 + Resend로 이메일 발송, 또는 `resetPasswordForEmail` 방식으로 전환

#### [High] 유닛 테스트 전무

- Playwright E2E 1개 파일(`tests/e2e/auth.spec.ts`)만 존재
- jest/vitest 미설치
- **누락 영역**: Zod 스키마, Server Action 통합, rate limiting, ECOS API 파싱, 유틸리티 함수
- **개선안**: Vitest 도입, 스키마/유틸부터 시작, 핵심 비즈니스 로직(초대코드, 멤버십) 통합 테스트

#### [High] `password.ts` origin을 FormData에서 수신

- **파일**: `src/actions/password.ts:36`
- `const origin = formData.get('origin') as string` — 클라이언트가 제출한 FormData에서 origin 수신
- 악의적 origin 주입 시 비밀번호 재설정 이메일 리다이렉트 URL 조작 가능 (피싱 벡터)
- **개선안**: `process.env.NEXT_PUBLIC_APP_URL` 환경변수 사용 (Next.js 16에서 `headers()`도 async이므로 환경변수가 더 단순)
- **v1에서 Medium이었으나 v2에서 High로 상향**: 피싱 공격 벡터가 명확하고 수정이 매우 간단

#### [Medium] `auth.ts` origin 헤더 의존

- **파일**: `src/actions/auth.ts:87-88`
- `h.get('origin') || h.get('x-forwarded-proto') + '://' + h.get('host')` — 헤더 기반 origin 구성
- Vercel에서는 안전하지만, 다른 환경에서 조작 가능
- **개선안**: `process.env.NEXT_PUBLIC_APP_URL` 환경변수 우선 사용

#### [Medium] Admin Action Zod 검증 부재

- **파일**: `src/lib/actions/admin/seasons.ts`, `weeks.ts`, `members.ts`, `invite-codes.ts`, `indicators.ts`
- Admin action들이 파라미터를 Zod 없이 직접 DB에 전달
- Server Action은 HTTP endpoint로 노출되므로, `requireAdmin()` 인가는 있지만 입력 형식 검증 없음
- **개선안**: Admin 전용 Zod 스키마 추가

#### [Medium] Cron Route 에러 정보 노출

- **파일**: `src/app/api/cron/indicators/route.ts`
- DB 에러 메시지를 `error.message`로 외부에 반환 → DB 구조 정보 유출 가능
- **개선안**: `{ error: 'Internal error' }`로 대체, 내부 로깅만 유지

#### [Medium] protectedPaths 블랙리스트 방식

- **파일**: `src/proxy.ts:38`
- 보호 경로 나열 방식 → 새 경로 추가 시 누락 위험
- `/indicators`, `/settings`, `/guide` 누락 (Layout에서 커버되긴 함)
- **개선안**: 공개 경로 화이트리스트로 전환 (1.3 참조)

#### [Medium] config.matcher API 라우트 미제외

- **파일**: `src/proxy.ts:57-61`
- API 라우트에도 proxy 실행됨 → 외부 서비스 콜백용 API 추가 시 문제
- **개선안**: matcher에 `api` 제외 추가 (1.3 참조)

#### [Low] Database 타입 미바인딩

- `Database` 타입이 정의되어 있지만 `createServerClient`에 제네릭으로 전달 안 됨
- Supabase 쿼리 응답이 타입 추론 혜택을 못 받음
- **개선안**: `createServerClient<Database>(...)` 형태로 바인딩

#### [Low] `as string` 캐스팅 패턴

- `formData.get('email') as string` — null/File 가능성 무시
- Zod parseFormData가 커버하므로 런타임에서는 안전하지만 TS 관점 불안정
- **개선안**: `String(formData.get('email') ?? '')` 또는 공통 헬퍼

#### [Low] 응답 타입 불일치

- 일반 action: `{ error: string }` / admin action: `{ success: false, error: string }`
- `ActionResult<T>` 타입이 있지만 admin actions이 미사용
- **개선안**: 모든 action에 `ActionResult<T>` 통일

#### [Low] CSP `unsafe-inline` + `unsafe-eval`

- Next.js + Sentry 환경에서 필요한 현실적 타협
- react-markdown sanitize + 인라인 HTML 미사용으로 실질적 XSS 벡터 제한적

#### [Low/정정] server.ts 빈 catch 블록

- **파일**: `src/lib/supabase/server.ts:20`
- **v1 판정**: "디버깅 불가능" → **v2 정정**: Supabase 공식 패턴
- Server Component에서는 쿠키 설정이 구조적으로 불가능 (Server Action/Route Handler에서만 가능)
- 빈 catch는 의도적이며 주석도 달려 있음
- **현재 상태 유지 OK** — 다만 개발 환경에서 `console.warn` 추가하면 디버깅에 도움

---

## 5. 백엔드 리스크

### RISK-01: 대시보드 순차 쿼리 9번 라운드트립

- **파일**: `src/app/(dashboard)/dashboard/page.tsx`
- **실제 호출 순서**:
  1. `requireUser()` → createClient + getUser
  2. `getCurrentSeason(supabase)`
  3. `getCurrentWeek(supabase, seasonId)`
  4. `isCurrentSeasonMember(userId)` — 내부에서 createClient 재생성
  5. `isAdmin(userId)` — 내부에서 createClient 재생성
  6. `supabase.from('summaries')` — 내 제출 현황
  7. `supabase.from('profiles')` — 전체 프로필
  8. `supabase.from('summaries')` — 전체 제출 현황
  9. `Promise.all([totalWeeks, seasonMembers])` — 이미 병렬화됨
  10. `supabase.from('first_summaries')` — 현재 주차 요약본
- **문제**: 4, 5번이 각각 createClient() 재생성. 6~8번 독립 쿼리가 순차 실행.
- 발생 가능성: **높** / 영향도: **중**
- **개선안**:
  ```typescript
  // 4~5번: requireUser() 결과 재사용
  const { supabase, user } = await requireUser()
  const [member, admin] = await Promise.all([
    isCurrentSeasonMember(user.id, supabase),  // supabase 전달
    isAdmin(user.id, supabase),                 // supabase 전달
  ])
  // 6~8번: 병렬화
  const [mySubmission, allProfiles, allSubmissions] = await Promise.all([...])
  ```

### RISK-02: summaries 중복 제출 (유니크 제약 없음)

- **파일**: summaries 테이블
- `(week_id, author_id)` 유니크 제약 없음 → 연타/다중 탭 시 중복 생성
- 발생 가능성: **높** / 영향도: **중**
- **개선안**: `ALTER TABLE summaries ADD CONSTRAINT unique_week_author UNIQUE (week_id, author_id)`

### RISK-03: economic_indicators 중복/인덱스 부재

- 같은 주차에 같은 지표 중복 fetch 시 중복 행 누적
- 발생 가능성: **높** / 영향도: **낮**
- **개선안**: `UNIQUE(week_id, indicator_code)` + `ON CONFLICT UPDATE`

### RISK-04: pg_cron 주차 전환 실패 무감지

- 주차 자동 전환은 서비스 핵심 흐름인데 실패 시 알림 없음
- 수동으로 Supabase pg_cron 로그 확인해야 함
- 발생 가능성: **중** / 영향도: **높**
- **개선안**: 전환 함수에서 실패 시 admin에게 이메일 알림 (Resend 활용) 또는 Sentry 알림

### RISK-05: isAdmin() 이중 Supabase 클라이언트 생성

- **파일**: `src/lib/utils/season-membership.ts`
- `requireAdmin()`이 createClient()로 user 가져온 뒤, `isAdmin(userId)` 내부에서 또 createClient() 호출
- 불필요한 오버헤드 + 두 클라이언트 간 세션 상태 불일치 가능성
- 발생 가능성: **중** / 영향도: **중**
- **개선안**: `isAdmin(userId, supabase?)` 형태로 기존 클라이언트 전달 가능하게

### RISK-06: weeks.is_current 시즌 간 충돌

- partial unique index가 시즌 구분 없이 전체 테이블에서 하나만 current 허용
- 다음 시즌 미리 세팅 시 기존 시즌과 충돌
- 발생 가능성: **중** / 영향도: **중**
- **개선안**: partial index에 season_id 포함

### RISK-07: 회원가입 실패 시 좀비 계정

- `acquire_invite_code` 실패 → `deleteUser` 호출 → 이것도 실패하면 유령 계정 잔류
- 발생 가능성: **낮** / 영향도: **높**
- **개선안**: 주기적 cleanup job 또는 삭제 재시도 로직

### RISK-08: summaries content 길이 무제한

- comments는 500자 제한 있지만 summaries는 없음
- 수 MB짜리 마크다운 저장 가능 → react-markdown 렌더링 시 브라우저 멈춤
- 발생 가능성: **중** / 영향도: **중**
- **개선안**: Zod 스키마 + DB CHECK 제약 (예: 50,000자)

### RISK-09: `check_email_exists` 이메일 열거 공격

- **파일**: `src/actions/password.ts`
- rate limit 3/분이어도 자동화하면 하루 4,320건 시도 가능
- 발생 가능성: **중** / 영향도: **중**
- **개선안**: 성공/실패 동일 응답 패턴

### RISK-10: requireAdmin() 누락 시 앱 레벨 보호 실패

- 새 admin Server Action 추가 시 requireAdmin() 빠뜨리면 RLS만으로 보호
- 발생 가능성: **중** / 영향도: **높**
- **개선안**: admin action 파일에 lint rule 또는 테스트 추가

### RISK-11: admin 계정 탈취 시 전체 데이터 위험

- summaries RLS에서 admin이면 모든 시즌 데이터 수정/삭제 가능
- comments RLS는 시즌 멤버십 체크 안 함
- 발생 가능성: **낮** / 영향도: **치명**
- **개선안**: admin 계정 2FA 검토 (Supabase MFA 지원)

### RISK-12: service_role 키 노출 시 전체 DB 접근

- `SUPABASE_SERVICE_ROLE_KEY`로 RLS 완전 우회 가능
- 발생 가능성: **낮** / 영향도: **치명**
- **현재 대응**: 서버 전용 격리 (`admin.ts`)

### RISK-13 (신규): Enhanced Routing으로 proxy 실행 빈도 증가

- **Next.js 16 특이사항**: incremental prefetching으로 레이아웃별 개별 prefetch 요청
- 각 요청마다 proxy.ts → `getUser()` → Supabase 호출
- 발생 가능성: **중** / 영향도: **낮** (소규모 트래픽)
- **개선안**: config.matcher에서 prefetch 요청 제외 (1.3 참조)

### RISK-14 (정정): 빈 catch 블록 — 의도적 패턴

- **파일**: `src/lib/supabase/server.ts`
- **v1 판정**: 리스크 → **v2 정정**: Supabase 공식 패턴이며 의도적
- Server Component에서 쿠키 설정은 구조적으로 불가능
- **리스크 제거** — 정상 동작

### RISK-15: summaries/comments Rate Limit 없음

- 인증된 유저가 자동화 스크립트로 댓글 초당 수백 개 생성 가능
- 발생 가능성: **낮** / 영향도: **중**
- **개선안**: Upstash rate limiter 적용 (이미 auth에서 사용 중)

### RISK-16: `is_admin()` SECURITY DEFINER 성능

- 매 RLS 체크마다 profiles 테이블 조회 (캐시 없음)
- 트래픽 증가 시 성능 병목
- 발생 가능성: **낮** / 영향도: **중**

---

## 6. UI/UX 분석

### 혼란 유발 지점

1. **다크모드 유령 기능**: `next-themes` 설치됨 + `ThemeProvider` 사용 중 + `globals.css` dark 변수 정의됨. 하지만 **토글 UI 없음** — 시스템 설정 따라가기만 하는 중간 상태.
2. **`/mine` vs `/summaries` 분리**: 사용자 입장에서 "내 글은 어디?" 혼란. `/mine`으로 가는 진입점 불명확.
3. **주차 개념의 암묵적 전제**: 신규/중간 합류자가 주차/시즌 맥락 없이 대시보드를 봄.
4. **비멤버 상태 안내 부족**: `NonMemberAlert` 컴포넌트가 있지만, "어떻게 멤버가 되는지" 안내 불충분.
5. **설정 페이지 분리**: profile/password 2개뿐인데 별도 페이지 → 과잉.
6. **경제지표 티커 정보 과부하**: 12개 지표 60초 스크롤, 모바일에서 hover 불가능.
7. **가이드 발견 가능성**: MobileNav의 extraItems에만 존재, 데스크톱에서 찾기 어려움.

### 흐름/상호작용 문제

1. **대시보드 `loading.tsx` 존재 확인됨**: 스켈레톤인지 스피너인지 내용 확인 필요. 순차 쿼리 9번이라 체감 로딩 길 수 있음.
2. **요약본 작성 시 뒤로가기 방지 없음**: `beforeunload` 미적용. 긴 글 작성 중 실수로 나가면 소실.
3. **댓글 작성/삭제 후 피드백**: `revalidatePath` 사이 "내 댓글이 등록됐나?" 불확실성. `sonner` 설치됐으니 toast 활용 가능.
4. **관리자↔대시보드 컨텍스트 단절**: 완전 별개 Layout, 이동 시 헤더/네비 통째 바뀜.
5. **인증 에러 복구**: 비밀번호 재설정 링크 만료 시 에러 표시 불확실.

### Next.js 16 / React 19.2 활용 기회

| 기능 | 활용 지점 | 난이도 | 효과 |
|------|---------|--------|------|
| **View Transitions** | 대시보드↔요약본 전환, 관리자↔대시보드 전환 | 중 | 높 |
| **Activity** | 요약본 작성 중 페이지 이동 시 상태 유지 (beforeunload 대안) | 중 | 높 |
| **React Compiler** | 전체 앱 자동 메모이제이션 | 매우 낮 | 중 |
| **updateTag** | 댓글/요약본 CRUD 후 즉시 UI 반영 (revalidatePath 대체) | 낮 | 중 |

### Quick Wins (하루 안에 처리 가능)

| 항목 | 난이도 | 효과 |
|------|--------|------|
| React Compiler 활성화 (`reactCompiler: true`) | 매우 낮 | 중 |
| SummaryForm `beforeunload` 이벤트 추가 | 매우 낮 | 높 |
| proxy.ts `config.matcher`에서 API 라우트 + prefetch 제외 | 낮 | 중 |
| 댓글 작성/삭제 시 toast 피드백 (sonner 이미 설치됨) | 낮 | 중 |
| 다크모드 토글 UI 추가 (또는 next-themes/CSS 정리) | 낮 | 낮 |
| 설정 페이지 통합 (profile + password) | 낮 | 낮 |

---

## 7. 교차 분석: 공통 발견사항

4개 분석에서 반복적으로 지적된 이슈:

### (1) proxy.ts 최적화 (아키텍트 + 보안 + 백엔드)

- **세션 갱신 유지 필수** (Supabase 공식 패턴)
- **인증 체크는 UX 레이어** (보안은 Layout이 담당)
- **config.matcher 개선 필요**: API 라우트 제외 + prefetch 요청 제외
- **protectedPaths → 화이트리스트** 전환 권장
- **CVE-2025-29927 안전** (Node.js 런타임)

### (2) 대시보드 쿼리 과다 (아키텍트 + 백엔드)

- 9번 라운드트립 중 6~8번 독립 쿼리가 순차 실행
- `isAdmin()`, `isCurrentSeasonMember()`가 각각 `createClient()` 재생성
- `Promise.all()` 추가 병렬화 + supabase 클라이언트 재사용으로 개선 가능

### (3) summaries 데이터 무결성 (백엔드 + UX)

- `(week_id, author_id)` 유니크 제약 없음 → 중복 제출 가능
- content 길이 무제한
- `beforeunload` 미적용 → 데이터 손실

### (4) Next.js 16 신기능 미활용 (아키텍트 + UX) — 신규

- React Compiler 미활성화 (설정 한 줄)
- View Transitions / Activity 미활용
- updateTag로 즉시 UI 반영 가능

---

## 8. 종합 액션 플랜

### 즉시 (이번 주)

| # | 이슈 | 난이도 | 근거 |
|---|------|--------|------|
| 1 | `password.ts` origin을 `process.env.NEXT_PUBLIC_APP_URL`로 변경 | 매우 낮 | 피싱 벡터 제거 (High 이슈) |
| 2 | `summaries` 테이블에 `UNIQUE(week_id, author_id)` 제약 추가 | 낮 | RISK-02: 가장 먼저 보일 문제 |
| 3 | `SummaryForm`에 `beforeunload` 이벤트 추가 | 매우 낮 | 데이터 손실 방지 |
| 4 | `next.config.ts`에 `reactCompiler: true` 추가 | 매우 낮 | 무료 성능 개선 |
| 5 | proxy.ts `config.matcher` 개선 (API 라우트 + prefetch 제외) | 낮 | RISK-13, 보안 |

### 단기 (2주 이내)

| # | 이슈 | 난이도 | 근거 |
|---|------|--------|------|
| 6 | proxy.ts `protectedPaths` → 화이트리스트 전환 | 낮 | 보안 강화 |
| 7 | 대시보드 쿼리 `Promise.all()` 병렬화 + supabase 클라이언트 재사용 | 중 | TTFB 단축 |
| 8 | Admin 비밀번호 초기화 → `resetPasswordForEmail` 전환 | 중 | 보안 강화 (High 이슈) |
| 9 | Admin Action에 Zod 스키마 검증 추가 | 중 | 입력값 검증 |
| 10 | summaries content DB 길이 제약 추가 | 낮 | RISK-08 |
| 11 | 댓글 작성/삭제 시 toast 피드백 (sonner) | 낮 | UX |

### 중기 (1개월)

| # | 이슈 | 난이도 | 근거 |
|---|------|--------|------|
| 12 | Vitest 도입 + 핵심 스키마/유틸/비즈니스 로직 테스트 | 높 | 장기 안정성 |
| 13 | pg_cron 모니터링 (실패 시 알림) | 중 | RISK-04 |
| 14 | View Transitions 적용 (대시보드↔요약본 전환) | 중 | UX 향상 |
| 15 | `createServerClient<Database>(...)` 타입 바인딩 | 낮 | 타입 안전성 |
| 16 | 이메일 열거 방지 (성공/실패 동일 응답) | 중 | RISK-09 |

### 백로그 (여유 시 검토)

- React 19.2 Activity 적용 (요약본 작성 중 상태 유지)
- updateTag으로 revalidatePath 대체
- 다크모드 정리 (토글 추가 또는 CSS 제거)
- 설정 페이지 통합
- `/mine` vs `/summaries?filter=mine` 정리
- 관리자↔대시보드 네비게이션 연결 개선
- summaries/comments rate limit 추가
- 응답 타입 `ActionResult<T>` 통일
- admin 2FA (Supabase MFA)

---

## 9. 잘된 점 총평 (Top 12)

1. 관심사 분리 명확 (actions / queries / schemas / components)
2. 5중 인증/인가 보호 — proxy(UX) → layout(보안) → action(뮤테이션) → RLS(데이터)
3. Supabase 세션 갱신 공식 패턴 정확히 적용 (proxy.ts)
4. Zod 스키마 검증 일관 적용 (ECOS 외부 API 응답까지)
5. `acquire_invite_code` RPC로 race condition 방어
6. Server Components 우선 전략 → 전역 상태 없는 단순 구조
7. Next.js 16 Async Request APIs 정상 적용 (`await cookies()` 등)
8. CSP + 보안 헤더 + XSS 방어
9. Rate Limiting 주요 인증 엔드포인트 적용
10. Role Escalation 방어 (DB 트리거)
11. service_role 클라이언트 서버 전용 격리
12. CVE-2025-29927에 영향 없는 안전한 아키텍처 (Node.js 런타임 + Layout 이중 보호)

---

## 리스크 우선순위 매트릭스

| 순위 | ID | 리스크 | 가능성 | 영향도 |
|------|------|------|------|------|
| 1 | RISK-02 | summaries 중복 제출 | 높 | 중 |
| 2 | RISK-04 | pg_cron 주차 전환 실패 무감지 | 중 | 높 |
| 3 | RISK-01 | 대시보드 순차 쿼리 9번 라운드트립 | 높 | 중 |
| 4 | RISK-05 | isAdmin() 이중 클라이언트 | 중 | 중 |
| 5 | RISK-10 | requireAdmin() 누락 가능성 | 중 | 높 |
| 6 | RISK-07 | 회원가입 실패 시 좀비 계정 | 낮 | 높 |
| 7 | RISK-08 | summaries content 길이 무제한 | 중 | 중 |
| 8 | RISK-06 | weeks.is_current 시즌 간 충돌 | 중 | 중 |
| 9 | RISK-09 | 이메일 열거 공격 가능성 | 중 | 중 |
| 10 | RISK-11 | admin 계정 탈취 시 전체 데이터 위험 | 낮 | 치명 |
| 11 | RISK-12 | service_role 키 노출 시 전체 DB 접근 | 낮 | 치명 |
| 12 | RISK-13 | Enhanced routing으로 proxy 실행 빈도 증가 | 중 | 낮 |
| 13 | RISK-03 | economic_indicators 중복/인덱스 없음 | 높 | 낮 |
| 14 | RISK-15 | summaries/comments rate limit 없음 | 낮 | 중 |
| 15 | RISK-16 | is_admin() SECURITY DEFINER 성능 | 낮 | 중 |
| ~~14~~ | ~~RISK-14~~ | ~~빈 catch 블록~~ | ~~제거~~ | ~~Supabase 공식 패턴~~ |

> 참고 문서: [Next.js 16 Proxy 공식 문서](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) | [Next.js 16 업그레이드 가이드](https://nextjs.org/docs/app/guides/upgrading/version-16) | [CVE-2025-29927 관련](https://nextjs.org/docs/messages/middleware-to-proxy)
