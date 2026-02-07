-- invite_codes 테이블에 UPDATE RLS 정책 추가
-- 현재 service_role로만 update 가능한 상태 → 관리자 명시적 정책 추가

CREATE POLICY "관리자만 초대 코드 수정"
  ON public.invite_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
