# 시즌 개념 추가

## 요약
3개월 단위 시즌 개념을 추가하여 멤버 변동과 히스토리 관리를 지원한다.

## 요구사항
- ✅ 시즌 = 3개월 단위 스터디 기간
- ✅ 시즌별 멤버 구성 변경 가능
- ✅ 과거 시즌 데이터 보존 (히스토리)
- ✅ week_number는 시즌별로 리셋 (각 시즌마다 1주차부터)
- ✅ 깔끔한 URL (nanoid 사용)

## 설계 결정

### ID 형식
- **시즌 ID**: nanoid 8자 (`V1StGXR8`) - URL 깔끔, 충돌 확률 0.0000007%
- **주차 ID**: nanoid 8자 (`abc12345`) - URL 간결
- **멤버 관리**: 명시적 season_members 테이블

### URL 구조
```
현재: /summaries?week=550e8400-e29b-41d4-a716-446655440000
변경: /summaries?week=V1StGXR8
```

**중요**: URL은 ID를 사용하지만, 페이지에서는 의미 있는 정보 표시:
- 시즌 이름: "2026년 1분기"
- 주차 정보: "3주차 (2026.02.17 - 2026.02.23)"
- ID는 라우팅/조회용, 사용자는 실제 데이터를 봄

---

## 데이터베이스 스키마

### 1. seasons 테이블 (신규)
```sql
CREATE TABLE public.seasons (
  id TEXT PRIMARY KEY,  -- nanoid
  name TEXT NOT NULL,   -- "2026년 1분기", "2026년 봄 시즌" 등
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_seasons_date_range CHECK (end_date >= start_date)
);

-- 활성 시즌 1개만 보장
CREATE UNIQUE INDEX idx_seasons_single_active
  ON public.seasons (is_active) WHERE is_active = true;

-- RLS
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons FORCE ROW LEVEL SECURITY;

CREATE POLICY "시즌 조회"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);
```

### 2. season_members 테이블 (신규)
```sql
CREATE TABLE public.season_members (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(season_id, user_id)
);

-- 인덱스
CREATE INDEX idx_season_members_season ON public.season_members(season_id);
CREATE INDEX idx_season_members_user ON public.season_members(user_id);

-- RLS
ALTER TABLE public.season_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_members FORCE ROW LEVEL SECURITY;

CREATE POLICY "시즌 멤버 조회"
  ON public.season_members FOR SELECT
  TO authenticated
  USING (true);
```

### 3. weeks 테이블 수정
```sql
-- 기존 테이블 드롭 (CASCADE로 summaries도 함께 삭제됨)
DROP TABLE IF EXISTS public.weeks CASCADE;

-- 새로 생성
CREATE TABLE public.weeks (
  id TEXT PRIMARY KEY,  -- nanoid (UUID에서 변경)
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 시즌별 주차 번호 고유성
  UNIQUE(season_id, week_number),

  CONSTRAINT chk_weeks_date_range CHECK (end_date >= start_date)
);

-- 인덱스
CREATE INDEX idx_weeks_season ON public.weeks(season_id);
CREATE UNIQUE INDEX idx_weeks_single_current
  ON public.weeks (is_current) WHERE is_current = true;

-- RLS (기존과 동일)
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks FORCE ROW LEVEL SECURITY;

CREATE POLICY "주차 조회"
  ON public.weeks FOR SELECT
  TO authenticated
  USING (true);
```

### 4. summaries 테이블 수정
```sql
-- week_id 컬럼 타입 변경 (UUID → TEXT)
ALTER TABLE public.summaries
  ALTER COLUMN week_id TYPE TEXT;
```

### 5. nanoid 함수 추가
```sql
-- PostgreSQL에서 nanoid 생성 (extensions 필요)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION nanoid(size int DEFAULT 8)
RETURNS text AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  id text := '';
  i int;
  random_index int;
BEGIN
  FOR i IN 1..size LOOP
    random_index := floor(random() * length(alphabet) + 1)::int;
    id := id || substring(alphabet from random_index for 1);
  END LOOP;
  RETURN id;
END
$$ LANGUAGE plpgsql VOLATILE;

-- 사용 예시:
-- nanoid()     -> 8자 (기본)
-- nanoid(12)   -> 12자 (범용)
```

---

## 마이그레이션 파일

**파일**: `supabase/migrations/005_add_seasons.sql`

```sql
-- 1. nanoid 함수 생성
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION nanoid(size int DEFAULT 8)
RETURNS text AS $$
DECLARE
  alphabet text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  id text := '';
  i int;
  random_index int;
BEGIN
  FOR i IN 1..size LOOP
    random_index := floor(random() * length(alphabet) + 1)::int;
    id := id || substring(alphabet from random_index for 1);
  END LOOP;
  RETURN id;
END
$$ LANGUAGE plpgsql VOLATILE;

-- 2. seasons 테이블 생성
CREATE TABLE public.seasons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_seasons_date_range CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX idx_seasons_single_active
  ON public.seasons (is_active) WHERE is_active = true;

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons FORCE ROW LEVEL SECURITY;

CREATE POLICY "시즌 조회"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);

-- 3. season_members 테이블 생성
CREATE TABLE public.season_members (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(season_id, user_id)
);

CREATE INDEX idx_season_members_season ON public.season_members(season_id);
CREATE INDEX idx_season_members_user ON public.season_members(user_id);

ALTER TABLE public.season_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.season_members FORCE ROW LEVEL SECURITY;

CREATE POLICY "시즌 멤버 조회"
  ON public.season_members FOR SELECT
  TO authenticated
  USING (true);

-- 4. weeks 테이블 재생성
DROP TABLE IF EXISTS public.weeks CASCADE;

CREATE TABLE public.weeks (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(season_id, week_number),
  CONSTRAINT chk_weeks_date_range CHECK (end_date >= start_date)
);

CREATE INDEX idx_weeks_season ON public.weeks(season_id);
CREATE UNIQUE INDEX idx_weeks_single_current
  ON public.weeks (is_current) WHERE is_current = true;

ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks FORCE ROW LEVEL SECURITY;

CREATE POLICY "주차 조회"
  ON public.weeks FOR SELECT
  TO authenticated
  USING (true);

-- 5. summaries 테이블 재생성 (week_id 타입 변경)
DROP TABLE IF EXISTS public.summaries CASCADE;

CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_summaries_content_not_empty CHECK (length(trim(content)) > 0)
);

CREATE INDEX idx_summaries_week_id ON public.summaries(week_id);
CREATE INDEX idx_summaries_author_id ON public.summaries(author_id);
CREATE INDEX idx_summaries_week_author_created
  ON public.summaries(week_id, author_id, created_at DESC);

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries FORCE ROW LEVEL SECURITY;

CREATE POLICY "요약본 조회"
  ON public.summaries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "요약본 작성"
  ON public.summaries FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "요약본 수정"
  ON public.summaries FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "요약본 삭제"
  ON public.summaries FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

-- 6. 뷰 재생성
CREATE OR REPLACE VIEW public.latest_summaries AS
SELECT DISTINCT ON (week_id, author_id)
  id,
  week_id,
  author_id,
  content,
  created_at,
  updated_at
FROM public.summaries
ORDER BY week_id, author_id, created_at DESC;

ALTER VIEW public.latest_summaries SET (security_invoker = on);

CREATE OR REPLACE VIEW public.first_summaries AS
SELECT DISTINCT ON (week_id, author_id)
  id,
  week_id,
  author_id,
  content,
  created_at,
  updated_at
FROM public.summaries
ORDER BY week_id, author_id, created_at ASC;

ALTER VIEW public.first_summaries SET (security_invoker = on);
```

---

## TypeScript 타입 정의

**파일**: `src/types/database.ts` (신규 또는 기존 수정)

```typescript
export interface Season {
  id: string  // nanoid
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Week {
  id: string  // nanoid (기존 UUID에서 변경)
  season_id: string
  week_number: number
  title: string | null
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
}

export interface SeasonMember {
  id: string
  season_id: string
  user_id: string
  joined_at: string
}
```

---

## 코드 변경 사항

### 1. 주차 조회 시 시즌 포함
**영향 파일**:
- `src/app/(dashboard)/summaries/new/page.tsx`
- `src/app/(dashboard)/mine/[id]/edit/page.tsx`
- `src/app/(dashboard)/summaries/[id]/edit/page.tsx`

**변경**:
```typescript
// 기존
const { data: weeks } = await supabase
  .from('weeks')
  .select('id, week_number, title, start_date, end_date, is_current')
  .order('week_number', { ascending: false })
  .limit(4)

// 변경 후 - 현재 시즌의 주차만 조회
const { data: currentSeason } = await supabase
  .from('seasons')
  .select('id')
  .eq('is_active', true)
  .single()

const { data: weeks } = await supabase
  .from('weeks')
  .select('id, season_id, week_number, title, start_date, end_date, is_current')
  .eq('season_id', currentSeason.id)
  .order('week_number', { ascending: false })
  .limit(4)
```

### 2. 대시보드 - 현재 시즌 정보 표시
**파일**: `src/app/(dashboard)/dashboard/page.tsx`

**추가**:
```typescript
// 현재 시즌 조회
const { data: currentSeason } = await supabase
  .from('seasons')
  .select('*')
  .eq('is_active', true)
  .single()

// UI에 시즌 이름 표시
<Badge>{currentSeason.name}</Badge>
```

### 3. Week 타입 업데이트
**영향 파일**: 모든 Week 인터페이스 사용처

**변경**:
```typescript
// 기존
interface Week {
  id: string  // UUID
  week_number: number
  // ...
}

// 변경
interface Week {
  id: string  // nanoid
  season_id: string  // 추가
  week_number: number
  // ...
}
```

### 4. nanoid 사용 설정
**파일**: `src/lib/nanoid.ts` (신규)

```typescript
import { customAlphabet } from 'nanoid'

// 시즌/주차 ID (8자, 충돌 확률 0.0000007%)
export const seasonId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
)

export const weekId = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  8
)

// 범용 nanoid (12자, 요약본/멤버 등)
export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  12
)
```

**설치**:
```bash
pnpm add nanoid
```

---

## 초기 데이터 (Seed)

**파일**: `supabase/seed.sql` 수정

```sql
-- 1. 시즌 생성 (nanoid 8자)
INSERT INTO public.seasons (id, name, start_date, end_date, is_active)
VALUES (
  'V1StGXR8',  -- nanoid(8)
  '2026년 1분기',
  '2026-01-06',
  '2026-03-31',
  true
);

-- 2. 주차 생성
INSERT INTO public.weeks (id, season_id, week_number, title, start_date, end_date, is_current)
VALUES
  ('abc12345', 'V1StGXR8', 1, '1주차', '2026-02-03', '2026-02-09', true),
  ('def67890', 'V1StGXR8', 2, '2주차', '2026-02-10', '2026-02-16', false);

-- 3. 시즌 멤버 추가 (기존 사용자가 있다면)
-- INSERT INTO public.season_members (id, season_id, user_id)
-- SELECT nanoid(12), 'V1StGXR8', id FROM public.profiles;
```

---

## 검증 방법

### 1. 마이그레이션 실행
```bash
# 로컬 Supabase
supabase db reset

# 또는 원격 (프로덕션 주의!)
supabase db push
```

### 2. 데이터 확인
```sql
-- 시즌 조회
SELECT * FROM public.seasons;

-- 주차 조회 (시즌 포함)
SELECT w.*, s.name as season_name
FROM public.weeks w
JOIN public.seasons s ON w.season_id = s.id
ORDER BY w.week_number;

-- 시즌 멤버 조회
SELECT sm.*, p.nickname, s.name as season_name
FROM public.season_members sm
JOIN public.profiles p ON sm.user_id = p.id
JOIN public.seasons s ON sm.season_id = s.id;
```

### 3. UI 테스트
- [ ] 대시보드에 현재 시즌 이름 표시
- [ ] 주차 선택 시 현재 시즌의 주차만 표시
- [ ] URL에 nanoid 표시 확인 (?week=abc123)
- [ ] 과거 시즌 데이터 조회 가능 (히스토리)

---

## Critical Files

### 신규 생성
1. `supabase/migrations/005_add_seasons.sql` - 마이그레이션 파일
2. `src/lib/nanoid.ts` - nanoid 유틸리티
3. `src/types/database.ts` - Season, Week 타입 정의

### 수정 필요
1. `supabase/schema.sql` - 전체 스키마 업데이트
2. `supabase/seed.sql` - 초기 데이터 업데이트
3. `src/app/(dashboard)/dashboard/page.tsx` - 시즌 정보 표시
4. `src/app/(dashboard)/summaries/new/page.tsx` - 현재 시즌 주차 조회
5. `src/app/(dashboard)/mine/[id]/edit/page.tsx` - 현재 시즌 주차 조회
6. `src/app/(dashboard)/summaries/[id]/edit/page.tsx` - 현재 시즌 주차 조회
7. `src/components/dashboard/header.tsx` - 시즌 정보 추가 고려
8. 모든 Week 인터페이스 사용처 - season_id 추가

---

## 트레이드오프

### nanoid vs UUID
- **선택**: nanoid
- **장점**: URL 깔끔 (21자), 충돌 확률 극히 낮음, 정렬 가능
- **단점**: PostgreSQL 네이티브 아님 (함수 필요)

### 시즌별 멤버 vs 암묵적 참여
- **선택**: season_members 테이블
- **장점**: 명시적 관리, 멤버 추가/제거 추적, 권한 제어 용이
- **단점**: 관리 복잡도 증가, JOIN 필요

### week_number 글로벌 vs 시즌별
- **선택**: 시즌별 리셋
- **장점**: 각 시즌마다 1주차부터 시작, 직관적
- **단점**: 시즌 정보 없이 week_number만으로 조회 불가

---

## 다음 단계

1. ✅ 마이그레이션 파일 작성
2. ✅ TypeScript 타입 정의
3. ⬜ 코드 변경 (주차 조회 로직)
4. ⬜ 시즌 관리 UI 추가 (관리자용)
5. ⬜ 시즌 멤버 관리 UI
6. ⬜ 시즌 전환 시나리오 구현
