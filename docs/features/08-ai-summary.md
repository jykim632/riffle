# AI 요약 비교/종합

> **이슈:** riffle-ub0 | **우선순위:** P4 (백로그) | **타입:** feature

## Context
같은 주차 여러 멤버 요약을 AI가 종합 분석. 핵심 포인트 TOP 3, 관점 차이 하이라이트, 종합 요약 생성. MVP에 집중.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| LLM | Anthropic Claude (sonnet) | 한국어 성능, Claude 에코시스템 |
| 비용 관리 | DB 캐싱 (온디맨드) | source_hash로 변경 감지, 반복 호출 제거 |
| 트리거 | 관리자 수동 버튼 | MVP 단순, 비용 통제 |
| 캐싱 | Supabase 테이블 | 영속 저장, 별도 인프라 불필요 |
| 라우트 | `/summaries/weekly-digest` | 기존 summaries 하위 패턴 |
| LLM 호출 | Server Action | 프로젝트에 API Route 없음, 패턴 일관성 |

## 비용 추정

| 항목 | 5명 기준 | 10명 기준 |
|------|---------|----------|
| Input tokens | ~5,300 | ~10,300 |
| Output tokens | ~1,500 | ~1,500 |
| **주당 비용** | **~$0.04 (~50원)** | **~$0.06 (~80원)** |
| **연간 최대** | **~$4 (~5,000원)** | **~$6 (~8,000원)** |

## DB 스키마

```sql
CREATE TABLE public.weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  source_hash TEXT NOT NULL,        -- 요약본 content 해시 (캐시 무효화용)
  generated_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: SELECT all authenticated, INSERT/DELETE admin only
```

## 프롬프트 설계

- 시스템: "경제 스터디 그룹의 주간 요약 분석가"
- 유저: 멤버별 요약본 + 3가지 섹션 요청
  1. 핵심 포인트 TOP 3
  2. 멤버별 관점 차이
  3. 종합 요약 (3~5문단)
- 제약: 요약본 2개 이상 필요, 50,000자 초과 시 truncate

## 구현 단계

### 1. 의존성
- `pnpm add @anthropic-ai/sdk`
- `.env.local`에 `ANTHROPIC_API_KEY`

### 2. DB + 타입
- `supabase/migrations/019_weekly_digests.sql`
- `src/lib/types/database.ts`

### 3. AI 레이어
- `src/lib/ai/client.ts` — Anthropic 클라이언트
- `src/lib/ai/prompts.ts` — 프롬프트 템플릿
- `src/lib/ai/generate-digest.ts` — 생성 로직

### 4. 유틸
- `src/lib/utils/hash.ts` — source_hash 계산
- `src/lib/schemas/weekly-digest.ts`

### 5. Server Action
- `src/actions/weekly-digest.ts`
  - `generateDigest` — admin만, 캐시 확인 -> AI 호출 -> 저장
  - `deleteDigest`

### 6. 페이지
- `src/app/(dashboard)/summaries/weekly-digest/page.tsx`

### 7. 컴포넌트
- `src/components/digest/digest-content.tsx` — 마크다운 렌더
- `src/components/digest/generate-digest-button.tsx` — 생성 버튼
- `src/components/digest/digest-meta.tsx` — 모델/토큰/비용 정보

### 8. 네비게이션
- `src/app/(dashboard)/summaries/page.tsx` — "AI 종합" 링크

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/019_weekly_digests.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/ai/**` | 신규 (3개) |
| `src/lib/utils/hash.ts` | 신규 |
| `src/lib/schemas/weekly-digest.ts` | 신규 |
| `src/actions/weekly-digest.ts` | 신규 |
| `src/app/(dashboard)/summaries/weekly-digest/page.tsx` | 신규 |
| `src/components/digest/**` | 신규 (3개) |
| `.env.example` | 수정 |
| `package.json` | 수정 (anthropic sdk) |

## 리스크

| 리스크 | 완화 |
|--------|------|
| LLM API 장애 | 캐시 유지, graceful fail |
| 환각 | 프롬프트에 "원문 기반" 강조, AI 생성 명시 |
| Vercel Timeout (60s) | sonnet 모델 (빠름), 입력 길이 제한 |
| 비용 급증 | admin 전용 + rate limit |

## 검증
1. 관리자 다이제스트 생성 -> 마크다운 결과 확인
2. 일반 멤버 생성 버튼 미노출
3. 동일 상태 재요청 -> 캐시 반환
4. 요약본 변경 후 재생성 -> 새 결과
5. 요약본 1개일 때 에러
6. API 키 클라이언트 미노출
