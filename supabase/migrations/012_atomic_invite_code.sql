-- 초대 코드 원자적 사용 처리
-- 문제: 검증(SELECT) → 회원가입(signUp) → 사용처리(UPDATE) 사이 race condition
-- 해결: FOR UPDATE 행 잠금으로 동시 사용 방지

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

  RETURN true;
END;
$$;
