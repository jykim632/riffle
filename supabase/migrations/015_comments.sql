-- 요약글 댓글 기능 추가
-- Purpose: 멤버 간 피드백을 위한 댓글 테이블

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES public.summaries(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_comments_content_not_empty CHECK (length(trim(content)) > 0),
  CONSTRAINT chk_comments_content_max_length CHECK (length(content) <= 500)
);

-- 인덱스
CREATE INDEX idx_comments_summary_id ON public.comments(summary_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_comments_summary_created
  ON public.comments(summary_id, created_at DESC);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;

CREATE POLICY "댓글 조회"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "댓글 작성"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "댓글 수정"
  ON public.comments FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "댓글 삭제"
  ON public.comments FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = author_id);
