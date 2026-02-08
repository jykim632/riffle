-- 경제 지표 테이블
CREATE TABLE public.economic_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code TEXT NOT NULL,
  stat_code TEXT NOT NULL,
  item_code TEXT NOT NULL,
  data_value NUMERIC NOT NULL,
  unit_name TEXT,
  time_label TEXT NOT NULL,
  week_id TEXT REFERENCES public.weeks(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스: 주차별 지표 최신순 조회
CREATE INDEX idx_indicators_week_code_fetched
  ON public.economic_indicators(week_id, indicator_code, fetched_at DESC);

-- RLS: authenticated는 읽기만, 쓰기는 service_role만
ALTER TABLE public.economic_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "경제지표 조회" ON public.economic_indicators
  FOR SELECT TO authenticated USING (true);

-- 주차별 최신 스냅샷 뷰
CREATE VIEW public.indicator_snapshots AS
SELECT DISTINCT ON (week_id, indicator_code)
  id, indicator_code, stat_code, item_code,
  data_value, unit_name, time_label, week_id, fetched_at
FROM public.economic_indicators
ORDER BY week_id, indicator_code, fetched_at DESC;
