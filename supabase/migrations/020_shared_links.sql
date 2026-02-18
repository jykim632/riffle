-- 독서/아티클 공유 게시판
-- Purpose: 경제 관련 기사, 책, 유튜브 링크 공유

CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'article',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_shared_links_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT chk_shared_links_url_not_empty CHECK (length(trim(url)) > 0),
  CONSTRAINT chk_shared_links_category CHECK (category IN ('article', 'book', 'video'))
);

-- 인덱스
CREATE INDEX idx_shared_links_season ON public.shared_links(season_id);
CREATE INDEX idx_shared_links_author ON public.shared_links(author_id);
CREATE INDEX idx_shared_links_season_created
  ON public.shared_links(season_id, created_at DESC);

-- RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links FORCE ROW LEVEL SECURITY;

CREATE POLICY "링크 조회"
  ON public.shared_links FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "링크 작성"
  ON public.shared_links FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "링크 삭제"
  ON public.shared_links FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);
