-- season_members RLS 정책: 관리자만 INSERT/DELETE 가능

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

-- summaries RLS 정책: 현재 시즌 멤버만 작성 가능

-- 기존 "요약본 작성" 정책 삭제 후 재생성
DROP POLICY IF EXISTS "요약본 작성" ON public.summaries;

CREATE POLICY "요약본 작성"
  ON public.summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND
    (
      -- 관리자는 항상 허용
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
      )
      OR
      -- 해당 주차의 시즌 멤버만 허용
      EXISTS (
        SELECT 1 FROM public.season_members sm
        JOIN public.weeks w ON sm.season_id = w.season_id
        WHERE sm.user_id = (SELECT auth.uid())
        AND w.id = week_id
      )
    )
  );

-- summaries RLS 정책: 해당 시즌 멤버만 수정 가능

-- 기존 "요약본 수정" 정책 삭제 후 재생성
DROP POLICY IF EXISTS "요약본 수정" ON public.summaries;

CREATE POLICY "요약본 수정"
  ON public.summaries FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = author_id
    AND
    (
      -- 관리자는 항상 허용
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
      )
      OR
      -- 해당 주차의 시즌 멤버만 허용
      EXISTS (
        SELECT 1 FROM public.season_members sm
        JOIN public.weeks w ON sm.season_id = w.season_id
        WHERE sm.user_id = (SELECT auth.uid())
        AND w.id = week_id
      )
    )
  );

-- summaries RLS 정책: 해당 시즌 멤버만 삭제 가능

-- 기존 "요약본 삭제" 정책 삭제 후 재생성
DROP POLICY IF EXISTS "요약본 삭제" ON public.summaries;

CREATE POLICY "요약본 삭제"
  ON public.summaries FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = author_id
    AND
    (
      -- 관리자는 항상 허용
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
      )
      OR
      -- 해당 주차의 시즌 멤버만 허용
      EXISTS (
        SELECT 1 FROM public.season_members sm
        JOIN public.weeks w ON sm.season_id = w.season_id
        WHERE sm.user_id = (SELECT auth.uid())
        AND w.id = week_id
      )
    )
  );
