# 경제 지표 대시보드

> **이슈:** riffle-8wx | **우선순위:** P3 | **타입:** feature

## Context

스터디 멤버들이 매주 경제 라디오 요약을 작성할 때, 해당 주의 주요 경제지표를 참고 자료로 바로 볼 수 있게 하려는 것. 현재는 외부 사이트를 직접 찾아봐야 해서 불편함. 한국은행 ECOS API로 데이터를 자동 수집하고, 주차별 스냅샷으로 보존.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 데이터 소스 | 한국은행 ECOS API | 환율/금리/물가/GDP 등 거시지표 통합 제공, 무료 API 키 |
| 갱신 방식 | Vercel Cron (매일 KST 09:00) | ECOS 데이터가 실시간 아님. 하루 1회면 충분. pg_cron과 관심사 분리 |
| 저장 방식 | Supabase `economic_indicators` 테이블 + `indicator_snapshots` 뷰 | 주차별 스냅샷 보존. week_id FK로 스터디 주차와 1:1 매핑 |
| 차트 | 커스텀 SVG 스파크라인 | 외부 의존성 0. 대시보드 위젯에는 미니 차트면 충분 |
| ECOS 클라이언트 | `src/lib/ecos/` 디렉토리 | 12개 지표 상수 + 타입 + 클라이언트 분리 필요 |

## 지표 목록 (12개)

| 코드 | 지표 | ECOS stat_code | 주기 | 카테고리 |
|------|------|----------------|------|----------|
| USD_KRW | USD/KRW 환율 | 731Y001 | 일간 | 환율 |
| JPY_KRW | 원/엔 환율 (100엔) | 731Y001 | 일간 | 환율 |
| BASE_RATE | 한은 기준금리 | 722Y001 | 일간 | 금리 |
| FED_RATE | 미국 기준금리 | 902Y003 | 월간 | 금리 |
| GOV_BOND_3Y | 국고채 3년 | 817Y002 | 일간 | 채권 |
| KOSPI | 코스피 | 802Y001 | 일간 | 주가 |
| KOSDAQ | 코스닥 | 802Y001 | 일간 | 주가 |
| CPI | 소비자물가지수 | 901Y009 | 월간 | 물가 |
| GDP_GROWTH | GDP 성장률 | 200Y002 | 분기 | 성장 |
| UNEMPLOYMENT | 실업률 | 901Y027 | 월간 | 고용 |
| TRADE_BALANCE | 무역수지 | 301Y013 | 월간 | 무역 |
| OIL_DUBAI | 국제유가 (두바이) | 902Y004 | 일간 | 원자재 |

## DB 스키마

```sql
CREATE TABLE public.economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code TEXT NOT NULL,
  stat_code TEXT NOT NULL,
  item_code TEXT NOT NULL,
  data_value NUMERIC NOT NULL,
  unit_name TEXT,
  time_label TEXT NOT NULL,
  week_id UUID REFERENCES public.weeks(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_indicators_week_code_fetched
  ON public.economic_indicators(week_id, indicator_code, fetched_at DESC);

-- RLS: authenticated는 읽기만, 쓰기는 service_role만
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "경제지표 조회" ON public.economic_indicators
  FOR SELECT TO authenticated USING (true);

-- 주차별 최신 스냅샷 뷰
CREATE VIEW public.indicator_snapshots AS
SELECT DISTINCT ON (week_id, indicator_code)
  id, indicator_code, stat_code, item_code,
  data_value, unit_name, time_label, week_id, fetched_at
FROM public.economic_indicators
ORDER BY week_id, indicator_code, fetched_at DESC;
```

## 구현 단계

### Phase 1: DB + ECOS 클라이언트

**1. Migration** — `supabase/migrations/014_economic_indicators.sql`
- 위 DB 스키마 그대로

**2. 타입 업데이트** — `src/lib/types/database.ts`
- `economic_indicators` 테이블 Row/Insert 타입 추가

**3. ECOS 클라이언트** — `src/lib/ecos/`

| 파일 | 내용 |
|------|------|
| `constants.ts` | 12개 지표 정의 (statCode, itemCode, cycle, unit, label, category) |
| `types.ts` | ECOS 응답 Zod 스키마 + NormalizedIndicator 타입 |
| `client.ts` | `fetchIndicator()`, `fetchAllIndicators()` — 순차 호출 + 100ms 딜레이 |
| `index.ts` | re-export |

**4. 환경 변수**
- `ECOS_API_KEY` — ECOS API 인증 키
- `CRON_SECRET` — Vercel Cron 보호용

### Phase 2: 데이터 파이프라인

**5. Cron Route Handler** — `src/app/api/cron/indicators/route.ts`
- `CRON_SECRET` Bearer 토큰 검증
- 현재 주차(`is_current=true`) 조회
- `fetchAllIndicators()` → Supabase `economic_indicators`에 bulk insert
- `revalidatePath('/dashboard')`, `revalidatePath('/indicators')` 캐시 무효화

**6. vercel.json** (신규)
```json
{
  "crons": [{ "path": "/api/cron/indicators", "schedule": "0 0 * * *" }]
}
```
매일 UTC 00:00 (KST 09:00) 실행

**7. CSP 업데이트** — `next.config.ts`
- `connect-src`에 `https://ecos.bok.or.kr` 추가

**8. 관리자 수동 갱신** — `src/lib/actions/admin/indicators.ts`
- `refreshIndicatorsAction()`: requireAdmin() 후 fetch+save 로직 실행

### Phase 3: 쿼리 + 스키마

**9. 쿼리 함수** — `src/lib/queries/indicators.ts`
- `getCurrentIndicators(supabase, weekId)` — 위젯용
- `getIndicatorsByWeek(supabase, weekId)` — 상세 페이지용
- `getIndicatorHistory(supabase, indicatorCode, weekIds)` — 스파크라인용

**10. Zod 스키마** — `src/lib/schemas/indicator.ts`

### Phase 4: UI

**11. 공통 컴포넌트** — `src/components/indicators/`

| 컴포넌트 | 파일 | 설명 |
|----------|------|------|
| `Sparkline` | `sparkline.tsx` | SVG polyline 기반 미니 차트 (80x24px) |
| `ChangeBadge` | `change-badge.tsx` | 변동률 Badge (TrendingUp/Down 아이콘, 색상 구분) |
| `IndicatorCard` | `indicator-card.tsx` | 개별 지표 카드 (값 + 단위 + 변동률 + 스파크라인) |
| `IndicatorsGrid` | `indicators-grid.tsx` | 카테고리별 섹션 헤더 + 반응형 그리드 |

**12. 대시보드 위젯** — `src/components/dashboard/indicators-widget.tsx`
- Card 컴포넌트로 핵심 4개 지표 표시 (환율, 코스피, 기준금리, CPI)
- `/indicators` 링크
- `src/app/(dashboard)/dashboard/page.tsx`에 기존 2칸 그리드 아래에 추가

**13. 상세 페이지** — `src/app/(dashboard)/indicators/page.tsx`
- Server Component, `requireUser()` 보호
- 주차 선택 필터 (기존 `Select` 드롭다운 패턴)
- `IndicatorsGrid`로 12개 지표 카테고리별 표시
- `loading.tsx` 스켈레톤

**14. 네비게이션** — `src/components/dashboard/header.tsx` 수정
- nav에 "경제지표" 링크 추가

## 수정 대상 파일 요약

| 파일 | 작업 |
|------|------|
| `supabase/migrations/014_economic_indicators.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/ecos/constants.ts` | 신규 |
| `src/lib/ecos/types.ts` | 신규 |
| `src/lib/ecos/client.ts` | 신규 |
| `src/lib/ecos/index.ts` | 신규 |
| `src/app/api/cron/indicators/route.ts` | 신규 |
| `vercel.json` | 신규 |
| `next.config.ts` | 수정 (CSP) |
| `src/lib/actions/admin/indicators.ts` | 신규 |
| `src/lib/queries/indicators.ts` | 신규 |
| `src/lib/schemas/indicator.ts` | 신규 |
| `src/components/indicators/sparkline.tsx` | 신규 |
| `src/components/indicators/change-badge.tsx` | 신규 |
| `src/components/indicators/indicator-card.tsx` | 신규 |
| `src/components/indicators/indicators-grid.tsx` | 신규 |
| `src/components/dashboard/indicators-widget.tsx` | 신규 |
| `src/app/(dashboard)/dashboard/page.tsx` | 수정 |
| `src/app/(dashboard)/indicators/page.tsx` | 신규 |
| `src/app/(dashboard)/indicators/loading.tsx` | 신규 |
| `src/components/dashboard/header.tsx` | 수정 |

## 리스크

1. **ECOS API stat_code/item_code 정확성**: 실제 호출 테스트 필수. 한국은행 문서가 때때로 부정확
2. **ECOS rate limit**: 미명시. 순차 호출 + 100ms 딜레이로 보수적 접근
3. **월간/분기 지표**: 일간 크론에서 호출해도 새 값이 없으면 마지막 값 반환 — 중복 저장 가능. `DISTINCT ON` 뷰가 해결

## 검증 방법

1. ECOS API 호출 테스트 — 각 지표별 `fetchIndicator()` 직접 실행
2. Cron Route Handler — `curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/cron/indicators`
3. DB 확인 — Supabase Studio에서 `economic_indicators` 테이블 데이터 확인
4. `/dashboard` — 위젯 카드에 4개 지표 표시 확인
5. `/indicators` — 12개 지표 카테고리별 그리드 표시 확인
6. 데이터 없는 상태 — 빈 DB에서 EmptyState 표시, 에러 없음
7. 비로그인 — `/login` 리다이렉트 확인
8. Cron 보안 — 시크릿 없이 호출 시 401 확인
