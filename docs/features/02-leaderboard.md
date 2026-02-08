# 멤버 통계/리더보드

> **이슈:** riffle-91n | **우선순위:** P1 | **타입:** feature

## Context
현재 대시보드에서는 "이번 주" 제출 현황만 보여줌. 멤버들의 장기 참여도를 파악하고, 가벼운 경쟁 요소로 제출률을 높이기 위한 통계 페이지. 기존 데이터만으로 구현 가능 (새 테이블 불필요).

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 데이터 소스 | 서버 JS 계산 | 트래픽 작고 멤버 소수, View/RPC는 유지보수 부담 |
| 페이지 위치 | `/dashboard/stats` | 기존 dashboard 레이아웃 재사용 |
| 시즌 선택 | 드롭다운 (현재 시즌 기본) | 과거 시즌 통계도 확인 가능 |
| 차트 | Progress 컴포넌트 + CSS | 외부 라이브러리 불필요 |
| 스트릭 | 현재 + 최대 스트릭 둘 다 | 계산 비용 동일, 동기부여 효과 |
| 정렬 | 제출률 기본, 동률 시 스트릭 순 | 가장 직관적 |

## 데이터 쿼리

새 테이블 없이 기존 데이터로 계산:

```typescript
// 4개 쿼리 병렬 실행
const [seasons, weeks, members, submissions] = await Promise.all([
  getAllSeasons(supabase),
  getSeasonWeeks(supabase, seasonId),
  getSeasonMembers(supabase, seasonId),
  supabase.from('first_summaries').select('author_id, week_id').in('week_id', weekIds)
])
```

### 통계 계산 (순수 함수)

```typescript
interface MemberStats {
  userId: string
  nickname: string
  submissionCount: number    // 제출 횟수
  totalWeeks: number         // 전체 주차 수
  submissionRate: number     // 제출률 (0-100)
  currentStreak: number      // 현재 연속 제출
  maxStreak: number          // 최대 연속 제출
  rank: number               // 순위
}

interface SeasonStats {
  totalMembers: number
  totalWeeks: number
  completedWeeks: number
  averageSubmissionRate: number
  perfectWeeks: number         // 전원 제출 주차 수
}
```

### 스트릭 알고리즘
1. 주차를 week_number 오름차순 정렬
2. 현재 주차 이전까지 카운트 대상
3. 멤버별 각 주차 제출 여부 boolean 배열 생성
4. currentStreak: 끝에서부터 역순으로 연속 true 카운트
5. maxStreak: 전체 기간 중 최대 연속 true 구간

## 구현 단계

### 1. 통계 계산 유틸리티
**파일:** `src/lib/utils/stats.ts` (신규)
- `calculateMemberStats()` — 멤버별 제출률, 스트릭, 순위 계산
- `calculateSeasonStats()` — 시즌 전체 요약

### 2. 쿼리 헬퍼 추가
**파일:** `src/lib/queries/season.ts` (수정)
- `getAllSeasons()` — 전체 시즌 목록 (최신순)
- `getSeasonMembers()` — 시즌 멤버 목록 + 닉네임 JOIN

### 3. 페이지
**파일:** `src/app/(dashboard)/dashboard/stats/page.tsx` (신규)
- Server Component
- `searchParams.season`으로 시즌 선택 (기본: 활성 시즌)
- 4개 쿼리 병렬 실행 → 통계 계산 → 컴포넌트 렌더

### 4. UI 컴포넌트

**`src/components/stats/season-stats-summary.tsx`** — 시즌 요약 카드 4개 그리드
- 참여 멤버 / 완료 주차 / 평균 제출률 / 전원 제출 주차

**`src/components/stats/leaderboard.tsx`** — 리더보드 테이블
- shadcn Table 사용
- 순위, 닉네임, 제출률(Progress), 제출 횟수, 스트릭
- 본인 행 하이라이트 (`bg-primary/5`)
- 모바일 반응형 (보조 열 숨김)

**`src/components/stats/submission-heatmap.tsx`** — 주차별 제출 히트맵
- CSS Grid 기반, 차트 라이브러리 불필요
- 제출 O: 초록, 미제출 X: 회색
- 멤버 이름 왼쪽 고정 (sticky), 가로 스크롤

**`src/components/stats/season-select.tsx`** — 시즌 선택 드롭다운
- 기존 WeekSelect 패턴 참고

### 5. 네비게이션
**파일:** `src/components/dashboard/header.tsx` (수정)
- "통계" 링크 추가

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `src/lib/utils/stats.ts` | 신규 — 통계 계산 순수 함수 |
| `src/lib/queries/season.ts` | 수정 — 쿼리 헬퍼 추가 |
| `src/app/(dashboard)/dashboard/stats/page.tsx` | 신규 — 통계 페이지 |
| `src/components/stats/season-stats-summary.tsx` | 신규 — 시즌 요약 카드 |
| `src/components/stats/leaderboard.tsx` | 신규 — 리더보드 테이블 |
| `src/components/stats/submission-heatmap.tsx` | 신규 — 제출 히트맵 |
| `src/components/stats/season-select.tsx` | 신규 — 시즌 선택 |
| `src/components/dashboard/header.tsx` | 수정 — 네비게이션 |

## 검증
1. `/dashboard/stats` 접근 시 현재 시즌 통계 기본 표시
2. 시즌 드롭다운 전환 시 통계 올바르게 변경
3. 제출률 수동 검산 (제출 수 / 완료 주차)
4. 스트릭 엣지 케이스: 연속 제출 → 미제출 → 재개
5. 시즌에 주차/멤버 0개일 때 EmptyState
6. 탈퇴 멤버 처리 (getAuthorName 패턴)
7. 모바일/태블릿/데스크톱 반응형
8. `pnpm build` 에러 없음
