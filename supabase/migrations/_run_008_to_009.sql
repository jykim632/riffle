-- ============================================================================
-- 관리자 RLS 정책 마이그레이션 (008 ~ 009)
-- Supabase Dashboard > SQL Editor에서 실행
-- ============================================================================

-- ============================================================================
-- 008: profiles 관리자 역할 변경 RLS 정책
-- ============================================================================

DROP POLICY IF EXISTS "관리자만 역할 변경" ON public.profiles;
CREATE POLICY "관리자만 역할 변경"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 009: invite_codes 관리자 RLS 정책
-- ============================================================================

DROP POLICY IF EXISTS "관리자만 초대 코드 조회" ON public.invite_codes;
CREATE POLICY "관리자만 초대 코드 조회"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "관리자만 초대 코드 생성" ON public.invite_codes;
CREATE POLICY "관리자만 초대 코드 생성"
  ON public.invite_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "관리자만 초대 코드 삭제" ON public.invite_codes;
CREATE POLICY "관리자만 초대 코드 삭제"
  ON public.invite_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- ============================================================================
-- 완료
-- ============================================================================
