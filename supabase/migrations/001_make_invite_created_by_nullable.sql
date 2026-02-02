-- Migration: Make invite_codes.created_by nullable
-- Allows creation of first invite code without an admin

-- Drop the NOT NULL constraint on created_by
ALTER TABLE public.invite_codes
  ALTER COLUMN created_by DROP NOT NULL;

-- Verify migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'invite_codes'
      AND column_name = 'created_by'
      AND is_nullable = 'YES'
  ) THEN
    RAISE NOTICE 'Migration successful: created_by is now nullable';
  ELSE
    RAISE EXCEPTION 'Migration failed: created_by is still NOT NULL';
  END IF;
END $$;
