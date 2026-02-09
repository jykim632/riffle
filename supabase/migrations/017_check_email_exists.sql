-- 이메일 존재 여부 확인 함수 (비밀번호 초기화 validation용)
-- SECURITY DEFINER로 auth.users 접근, boolean만 반환하여 정보 노출 최소화

CREATE OR REPLACE FUNCTION public.check_email_exists(email_input TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(email_input)
  );
$$;

-- service_role만 호출 가능 (일반 사용자 이메일 열거 방지)
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.check_email_exists(TEXT) FROM anon;
