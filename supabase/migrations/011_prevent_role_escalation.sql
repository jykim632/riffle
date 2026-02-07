-- profiles.role 자기 변경 방지 트리거
-- 문제: "본인 프로필 수정" UPDATE 정책이 role 컬럼 변경을 허용
-- 해결: DB 트리거로 is_admin()이 아닌 사용자의 role 변경 차단

-- is_admin 헬퍼 함수 (RLS에서도 재사용 가능)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  );
$$;

-- role 변경 방지 트리거 함수
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  -- role이 변경되지 않으면 통과
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- admin만 role 변경 가능
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'role 변경 권한이 없습니다.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();
