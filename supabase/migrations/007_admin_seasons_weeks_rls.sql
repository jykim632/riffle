-- season_members 테이블 RLS: 관리자만 INSERT/DELETE 가능 (006 미적용 시 대비)

DROP POLICY IF EXISTS "관리자만 멤버 추가" ON public.season_members;
CREATE POLICY "관리자만 멤버 추가"
  ON public.season_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "관리자만 멤버 제거" ON public.season_members;
CREATE POLICY "관리자만 멤버 제거"
  ON public.season_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- seasons 테이블 RLS: 관리자만 INSERT/UPDATE/DELETE 가능

CREATE POLICY "관리자만 시즌 생성"
  ON public.seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 시즌 수정"
  ON public.seasons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 시즌 삭제"
  ON public.seasons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- weeks 테이블 RLS: 관리자만 INSERT/UPDATE/DELETE 가능

CREATE POLICY "관리자만 주차 생성"
  ON public.weeks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 주차 수정"
  ON public.weeks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 주차 삭제"
  ON public.weeks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
