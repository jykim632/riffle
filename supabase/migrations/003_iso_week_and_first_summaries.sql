-- ============================================================================
-- Migration: ISO Week Number & First Summaries View
-- Description: 
--   1. Update weeks table to use ISO 8601 week numbers (1-53)
--   2. Add first_summaries view (first submission per user per week)
--   3. Update pg_cron to generate ISO week numbers
-- ============================================================================

-- 1. Update existing weeks table to use ISO week numbers
-- NOTE: This assumes start_date is the reference date for week number
UPDATE public.weeks
SET week_number = EXTRACT(WEEK FROM start_date)
WHERE week_number IS NOT NULL;

-- 2. Create first_summaries view (first submission per user per week)
CREATE OR REPLACE VIEW public.first_summaries AS
SELECT DISTINCT ON (week_id, author_id)
  id,
  week_id,
  author_id,
  content,
  created_at,
  updated_at
FROM public.summaries
ORDER BY week_id, author_id, created_at ASC;  -- First submission (ASC)

-- Apply RLS to first_summaries view
ALTER VIEW public.first_summaries SET (security_invoker = on);

-- 3. Update pg_cron to use ISO week numbers (commented out, manual activation required)
-- NOTE: Uncomment and run in Supabase Dashboard after enabling pg_cron extension
-- 
-- SELECT cron.schedule(
--   'create-new-week',
--   '0 0 * * 1',
--   $$
--   WITH deactivate AS (
--     UPDATE public.weeks SET is_current = false WHERE is_current = true
--     RETURNING week_number
--   )
--   INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
--   SELECT
--     EXTRACT(WEEK FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date),
--     TO_CHAR((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date, 'YYYY"년" MM"월"') || ' ' ||
--       CEIL(EXTRACT(DAY FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date) / 7.0)::INT || '주차',
--     (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date,
--     (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date + INTERVAL '6 days',
--     true;
--   $$
-- );
