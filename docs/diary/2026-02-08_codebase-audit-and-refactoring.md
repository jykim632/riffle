# 2026-02-08 코드베이스 점검 및 리팩터링

## 작업한 내용

프로젝트 전체를 중복 코드, 보안, 런타임 문제 3가지 관점으로 점검하고 발견된 이슈를 전부 수정함.

### 버그 수정 (즉시/단기)
- **초대 코드 실패 시 회원가입 계속 진행되는 버그** 수정 — `acquire_invite_code` 실패 시 생성된 계정 삭제 후 에러 반환
- **`.single()` → `.maybeSingle()` 전환** (6곳) — 결과가 0개일 때 500 에러 대신 정상 null 처리
- **시즌 토글 원자성 확보** — 기존 활성 시즌 비활성화 에러 무시 → 에러 체크 + 실패 시 롤백 로직 추가
- **로그인 rate limit 추가** — 분당 10회 제한 (기존에 signup/password만 있었음)

### 리팩터링 (중기)
- `createAdminClient()` — service role 클라이언트 생성 5곳 → 1곳 통합
- `requireUser()` — 인증 체크 패턴 8곳+ → 공통 함수
- `getCurrentSeason/Week/getSeasonWeeks` — 시즌 조회 6곳+ → 쿼리 헬퍼
- `normalizeRelation()` — Supabase JOIN 타입 정규화 8곳 통합
- `<EmptyState>` — 빈 상태 UI 7곳 → 공통 컴포넌트
- `parseFormData()` — Zod 검증 에러 처리 9곳 통합
- `getClientIp()` — IP 추출 2곳 → 공통 유틸
- `getAuthorName()` — 탈퇴한 멤버 표시 3곳 통합
- `ActionResult` 타입 정의 추가

### 보안 강화
- CSP(Content-Security-Policy) 헤더 추가

### 수치
- 31개 파일 변경, **-814줄 삭제**, +488줄 추가 (순 326줄 감소)
- 새 유틸 파일 7개 생성

## 왜 했는지

코드가 빠르게 불어나면서 동일한 패턴이 여러 곳에 복사되고 있었음. 1인 운영 프로젝트라 지금 안 잡으면 나중에 하나 고칠 때 여러 곳을 찾아다녀야 하는 상황이 올 게 뻔했다.

보안 점검은 Supabase RLS + Auth 기반 프로젝트에서 놓치기 쉬운 부분(service role key 노출, rate limit 누락, .single() 크래시)을 한번에 훑기 위함.

## 논의/고민

- **CSP `unsafe-inline`/`unsafe-eval` 허용**: Next.js가 하이드레이션에 인라인 스크립트를 사용해서 불가피. nonce 기반 CSP로 강화하려면 미들웨어 수정 필요. 트래픽 규모 대비 ROI 고려해서 보류.
- **Rate limiter Redis 전환**: 현재 in-memory Map이라 Vercel 서버리스에서 인스턴스별 독립. 하지만 트래픽이 작아서 당장은 문제없음. 스케일링 시 Upstash Redis로 교체 예정.
- **formatDateRange 중복**: `week-select.tsx`의 로컬 함수("M/D ~ M/D")와 `lib/utils/date.ts`("YYYY.MM.DD - MM.DD")는 포맷이 달라서 의도적으로 분리 유지.
- **페이지 레이아웃 래퍼**: `max-w-7xl`, `max-w-4xl` 등 페이지마다 다름. 강제 통합하면 props만 늘어나고 가독성 하락. 의도적 skip.

## 결정된 내용

- `.single()` 대신 `.maybeSingle()` 기본 사용 (insert 직후 제외)
- admin 작업은 반드시 `createAdminClient()` 사용
- 페이지 인증은 `requireUser()` 통일
- 시즌/주차 조회는 `getCurrentSeason/Week` 쿼리 헬퍼 사용
- Zod 검증은 `parseFormData()` 사용

## 발견

- **초대 코드 버그**: `acquire_invite_code` 실패해도 `success: true` 반환하고 있었음. 같은 코드로 여러 계정 생성 가능했던 실제 보안 취약점.
- **`.env.local` 노출 의심**: 분석 시 Critical로 보고되었으나 확인 결과 `.gitignore`에 포함 + git history에도 없음. False positive.
- **`redirect()` in try-catch**: 서버 액션에 try-catch가 없어서 실제 문제 아님. False positive.
- `.single()`이 0개 결과에서 에러를 throw한다는 건 Supabase 사용 시 흔히 놓치는 부분.

## 남은 것

- [ ] nonce 기반 CSP 강화 (미들웨어 수정 필요, 우선순위 낮음)
- [ ] Rate limiter Redis 전환 (트래픽 증가 시)
- [ ] OAuth callback에서도 초대 코드 실패 시 계정 정리 (현재 로그만 남김)

## 다음 액션

당장 필요한 건 없음. 남은 항목들은 트래픽 증가나 보안 요구사항 변경 시 처리.

## 새로 생성된 파일 구조

```
src/lib/
├── auth.ts                  # requireUser()
├── supabase/
│   ├── admin.ts             # createAdminClient()
│   ├── server.ts            # (기존)
│   └── client.ts            # (기존)
├── queries/
│   └── season.ts            # getCurrentSeason/Week/getSeasonWeeks
├── actions/
│   └── types.ts             # ActionResult, parseFormData()
└── utils/
    ├── supabase.ts          # normalizeRelation(), getAuthorName()
    ├── ip.ts                # getClientIp()
    ├── date.ts              # (기존)
    └── season-membership.ts # (기존)

src/components/
└── empty-state.tsx          # EmptyState 컴포넌트
```
