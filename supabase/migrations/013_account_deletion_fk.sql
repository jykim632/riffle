-- 계정 삭제 시 데이터 보존을 위한 FK 정책 변경
-- 기존: CASCADE (계정 삭제 → 요약본/시즌멤버 전부 삭제)
-- 변경: SET NULL (계정 삭제 → 작성자 익명화, 데이터 보존)

-- ============================================================================
-- 1. summaries.author_id: NOT NULL 제거 + ON DELETE SET NULL
-- ============================================================================

-- NOT NULL 제약 제거
ALTER TABLE public.summaries ALTER COLUMN author_id DROP NOT NULL;

-- FK 재설정: CASCADE → SET NULL
ALTER TABLE public.summaries DROP CONSTRAINT summaries_author_id_fkey;
ALTER TABLE public.summaries
  ADD CONSTRAINT summaries_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. season_members.user_id: NOT NULL 제거 + ON DELETE SET NULL
-- ============================================================================

-- NOT NULL 제약 제거
ALTER TABLE public.season_members ALTER COLUMN user_id DROP NOT NULL;

-- FK 재설정: CASCADE → SET NULL
ALTER TABLE public.season_members DROP CONSTRAINT season_members_user_id_fkey;
ALTER TABLE public.season_members
  ADD CONSTRAINT season_members_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- UNIQUE(season_id, user_id) 유지 — PostgreSQL에서 NULL은 UNIQUE 중복 허용

-- ============================================================================
-- 3. invite_codes FK: ON DELETE SET NULL 명시
-- ============================================================================

-- created_by FK 재설정
ALTER TABLE public.invite_codes DROP CONSTRAINT invite_codes_created_by_fkey;
ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- used_by FK 재설정
ALTER TABLE public.invite_codes DROP CONSTRAINT invite_codes_used_by_fkey;
ALTER TABLE public.invite_codes
  ADD CONSTRAINT invite_codes_used_by_fkey
  FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- chk_invite_used_consistency 수정: used_by가 NULL이어도 is_used=true 허용
-- (계정 삭제 시 used_by가 SET NULL되지만, 코드가 사용된 사실은 유지)
ALTER TABLE public.invite_codes DROP CONSTRAINT chk_invite_used_consistency;
ALTER TABLE public.invite_codes
  ADD CONSTRAINT chk_invite_used_consistency CHECK (
    (is_used = true AND used_at IS NOT NULL)
    OR
    (is_used = false AND used_by IS NULL AND used_at IS NULL)
  );

-- ============================================================================
-- 4. 뷰 수정: COALESCE로 NULL author_id 대응
-- ============================================================================

-- 문제: DISTINCT ON (week_id, author_id)에서 author_id=NULL인 요약본이
--       같은 주차에 여러 개 있으면 하나로 합쳐짐
-- 해결: NULL일 때 summary 자체 id를 대체키로 사용

CREATE OR REPLACE VIEW public.latest_summaries AS
SELECT DISTINCT ON (week_id, COALESCE(author_id, id))
  id,
  week_id,
  author_id,
  content,
  created_at,
  updated_at
FROM public.summaries
ORDER BY week_id, COALESCE(author_id, id), created_at DESC;

ALTER VIEW public.latest_summaries SET (security_invoker = on);

CREATE OR REPLACE VIEW public.first_summaries AS
SELECT DISTINCT ON (week_id, COALESCE(author_id, id))
  id,
  week_id,
  author_id,
  content,
  created_at,
  updated_at
FROM public.summaries
ORDER BY week_id, COALESCE(author_id, id), created_at ASC;

ALTER VIEW public.first_summaries SET (security_invoker = on);
