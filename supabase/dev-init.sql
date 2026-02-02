-- Development environment initialization script
-- Run this ONCE on first setup to create initial data

-- =============================================================================
-- 1. Create first week
-- =============================================================================
INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
VALUES (
  1,
  '2026년 2월 1주차',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '6 days',
  true
)
ON CONFLICT (week_number) DO NOTHING;

-- =============================================================================
-- 2. Create temporary invite code for first admin
-- =============================================================================
-- created_by is NULL since we don't have an admin yet.
-- After signup, the first admin can create codes normally with their ID.

INSERT INTO public.invite_codes (code, created_by, is_used)
VALUES (
  'ADMIN001',
  NULL,
  false
)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- INSTRUCTIONS FOR FIRST ADMIN SETUP
-- =============================================================================
-- 1. Run this script in Supabase Dashboard > SQL Editor
-- 2. Start the app: pnpm dev
-- 3. Go to /signup and use invite code: ADMIN001
-- 4. After signup, run the following to make the user an admin:
--
--    UPDATE public.profiles
--    SET role = 'admin'
--    WHERE email = 'your-email@example.com';
--
-- 5. Login again and you can now create more invite codes via the UI

-- =============================================================================
-- Optional: Create test invite code for E2E tests
-- =============================================================================
-- Run this AFTER creating the first admin
-- Replace 'ADMIN_USER_UUID' with the actual admin's UUID

-- INSERT INTO public.invite_codes (code, created_by, is_used)
-- VALUES (
--   'TEST1234',
--   'ADMIN_USER_UUID'::uuid,
--   false
-- );
