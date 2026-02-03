-- Migration: Study-based Week Number System
--
-- Changes:
-- - Remove ISO 8601 week number system
-- - Use study start date (2026-01-12) as week 1
-- - Sequential increment for subsequent weeks
--
-- Rationale:
-- ISO week numbers (1-53) are confusing for study context.
-- Simple sequential numbering (1, 2, 3, ...) matches study progression.

-- 1. Backup existing weeks table
CREATE TABLE IF NOT EXISTS public.weeks_backup_iso AS
SELECT * FROM public.weeks;

-- 2. Recalculate week_number based on study start date (2026-01-12)
-- Formula: (days since 2026-01-12) / 7 + 1
UPDATE public.weeks
SET week_number = ((start_date - '2026-01-12'::date) / 7) + 1
WHERE start_date >= '2026-01-12';

-- 3. Delete weeks before study start date
-- Safe because summaries count is 0
DELETE FROM public.weeks
WHERE start_date < '2026-01-12';

-- 4. Reset is_current flag
-- Deactivate all weeks first
UPDATE public.weeks
SET is_current = false
WHERE is_current = true;

-- Activate current week (week containing today)
UPDATE public.weeks
SET is_current = true
WHERE start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE;

-- 5. Validation queries (run these manually after migration)
--
-- Check week_number sequence:
-- SELECT week_number, start_date, end_date, is_current
-- FROM public.weeks
-- ORDER BY week_number;
--
-- Verify 2026-01-12 is week 1:
-- SELECT * FROM public.weeks WHERE week_number = 1;
-- Expected: start_date = 2026-01-12
--
-- Check is_current uniqueness:
-- SELECT COUNT(*) FROM public.weeks WHERE is_current = true;
-- Expected: 1
--
-- Check summaries integrity (should be 0 for now):
-- SELECT COUNT(*) FROM public.summaries s
-- LEFT JOIN public.weeks w ON s.week_id = w.id
-- WHERE w.id IS NULL;
-- Expected: 0
