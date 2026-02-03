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
