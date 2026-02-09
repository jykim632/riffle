-- 초대코드에 시즌 연결: 가입 시 자동 시즌 참여
-- invite_codes.season_id 추가 + acquire_invite_code 함수 업데이트

-- 1. season_id 컬럼 추가
ALTER TABLE public.invite_codes
  ADD COLUMN season_id TEXT REFERENCES public.seasons(id) ON DELETE SET NULL;

-- 2. acquire_invite_code 함수 업데이트 (시즌 멤버 자동 등록)
CREATE OR REPLACE FUNCTION public.acquire_invite_code(
  code_input TEXT,
  user_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  -- 행 잠금으로 race condition 방지
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = UPPER(code_input)
    AND is_used = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE invite_codes
  SET is_used = true,
      used_by = user_id_input,
      used_at = NOW()
  WHERE id = code_record.id;

  -- 시즌 연결된 코드면 자동으로 시즌 멤버 등록
  IF code_record.season_id IS NOT NULL THEN
    INSERT INTO season_members (season_id, user_id)
    VALUES (code_record.season_id, user_id_input)
    ON CONFLICT (season_id, user_id) DO NOTHING;
  END IF;

  RETURN true;
END;
$$;
