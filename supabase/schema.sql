-- Riffle Database Schema
-- 경제 스터디 요약본 관리 시스템

-- ============================================================================
-- 1. 테이블 생성
-- ============================================================================

-- profiles: 사용자 프로필 (auth.users 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 빈 닉네임 방지
  CONSTRAINT chk_profiles_nickname_not_empty CHECK (length(trim(nickname)) > 0)
);

-- invite_codes: 초대 코드
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  used_by UUID REFERENCES public.profiles(id),
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,

  -- 상태 일관성 보장: is_used, used_by, used_at 동기화
  CONSTRAINT chk_invite_used_consistency CHECK (
    (is_used = true AND used_by IS NOT NULL AND used_at IS NOT NULL)
    OR
    (is_used = false AND used_by IS NULL AND used_at IS NULL)
  )
);

-- weeks: 주차
CREATE TABLE IF NOT EXISTS public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 날짜 범위 검증
  CONSTRAINT chk_weeks_date_range CHECK (end_date >= start_date)
);

-- summaries: 요약본
CREATE TABLE IF NOT EXISTS public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 빈 요약본 제출 방지
  CONSTRAINT chk_summaries_content_not_empty CHECK (length(trim(content)) > 0)
);

-- ============================================================================
-- 2. 인덱스
-- ============================================================================

-- 주차별 요약본 조회 최적화
CREATE INDEX IF NOT EXISTS idx_summaries_week_id ON public.summaries(week_id);

-- 사용자별 요약본 조회 최적화
CREATE INDEX IF NOT EXISTS idx_summaries_author_id ON public.summaries(author_id);

-- 주차별 사용자별 최신 요약 조회 최적화
CREATE INDEX IF NOT EXISTS idx_summaries_week_author_created
  ON public.summaries(week_id, author_id, created_at DESC);

-- 현재 주차 빠른 조회 + 단일 행 보장 (UNIQUE partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weeks_single_current
  ON public.weeks (is_current) WHERE is_current = true;

-- 초대 코드 조회 최적화 (미사용 코드만)
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code) WHERE is_used = false;

-- ============================================================================
-- 3. RLS (Row Level Security) 정책
-- ============================================================================

-- RLS 활성화 (FORCE: 테이블 소유자도 정책 적용)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks FORCE ROW LEVEL SECURITY;

ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.summaries FORCE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "프로필 조회"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "본인 프로필 수정"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

-- invite_codes 정책
-- 의도적으로 정책 없음: service_role (Server Actions)을 통해서만 접근
-- authenticated 사용자의 직접 접근 차단됨

-- weeks 정책
CREATE POLICY "주차 조회"
  ON public.weeks FOR SELECT
  TO authenticated
  USING (true);

-- summaries 정책
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

-- ============================================================================
-- 4. 트리거 - 프로필 자동 생성
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'User_' || LEFT(NEW.id::text, 8)),
    'member'  -- 항상 member로 강제. admin은 DB에서 직접 부여
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. pg_cron - 주차 자동 전환 (Supabase Dashboard에서 수동 실행 필요)
-- ============================================================================

-- 매주 월요일 00:00 KST (일요일 15:00 UTC)에 실행
-- Supabase Dashboard > Database > Cron Jobs에서 아래 SQL 실행:
--
-- SELECT cron.schedule(
--   'auto-advance-week',
--   '0 15 * * 0',
--   $$
--   -- 주차 전환 (원자적 실행)
--   WITH deactivate AS (
--     UPDATE public.weeks SET is_current = false WHERE is_current = true
--     RETURNING week_number
--   )
--   INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
--   SELECT
--     COALESCE((SELECT MAX(week_number) FROM public.weeks), 0) + 1,
--     TO_CHAR((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date, 'YYYY"년" MM"월"') || ' ' ||
--       CEIL(EXTRACT(DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date) / 7.0)::INT || '주차',
--     (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,
--     (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date + INTERVAL '6 days',
--     true;
--   $$
-- );

-- ============================================================================
-- 6. 뷰 (View)
-- ============================================================================

-- latest_summaries: 각 사용자의 주차별 최신 요약만 조회
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

-- latest_summaries에도 RLS 적용
ALTER VIEW public.latest_summaries SET (security_invoker = on);

-- ============================================================================
-- 7. 초기 데이터 (선택 사항)
-- ============================================================================

-- 첫 주차 생성 (수동으로 실행 필요)
-- INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
-- VALUES (
--   1,
--   '2026년 2월 1주차',
--   '2026-02-03',
--   '2026-02-09',
--   true
-- );
