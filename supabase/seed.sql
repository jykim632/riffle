-- Riffle Seed Data
-- 개발 환경용 초기 데이터

-- ============================================================================
-- 1. 첫 주차 생성
-- ============================================================================

INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
VALUES (
  1,
  '2026년 2월 1주차',
  '2026-02-03',
  '2026-02-09',
  true
)
ON CONFLICT (week_number) DO NOTHING;

-- ============================================================================
-- 2. 테스트 사용자 프로필 (auth.users는 Supabase Auth에서 관리)
-- ============================================================================

-- 참고: 실제 사용자는 Supabase Auth의 signUp API로 생성해야 함
-- 아래는 직접 생성 시 예시 (로컬 개발용)

-- 테스트 관리자 프로필
-- INSERT INTO public.profiles (id, nickname, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001'::uuid,
--   '관리자',
--   'admin'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- 테스트 멤버 프로필
-- INSERT INTO public.profiles (id, nickname, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000002'::uuid,
--   '김철수',
--   'member'
-- ),
-- (
--   '00000000-0000-0000-0000-000000000003'::uuid,
--   '이영희',
--   'member'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. 초대 코드 (테스트용)
-- ============================================================================

-- 참고: 실제 초대 코드는 애플리케이션에서 nanoid로 생성
-- 아래는 테스트용 고정 코드

-- INSERT INTO public.invite_codes (code, created_by, is_used)
-- VALUES (
--   'TEST1234',
--   '00000000-0000-0000-0000-000000000001'::uuid,  -- 관리자가 생성
--   false
-- )
-- ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 4. 샘플 요약본 (테스트용)
-- ============================================================================

-- INSERT INTO public.summaries (week_id, author_id, content)
-- SELECT
--   w.id,
--   '00000000-0000-0000-0000-000000000002'::uuid,  -- 김철수
--   '# 이번 주 경제 뉴스 요약
--
-- ## 주요 내용
-- - 금리 동결
-- - 환율 급등
--
-- ## 분석
-- 중앙은행의 금리 동결 결정은...'
-- FROM public.weeks w
-- WHERE w.week_number = 1
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. 개발 환경 확인
-- ============================================================================

-- 데이터 확인 쿼리
-- SELECT * FROM public.weeks;
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.invite_codes;
-- SELECT * FROM public.summaries;
-- SELECT * FROM public.latest_summaries;
