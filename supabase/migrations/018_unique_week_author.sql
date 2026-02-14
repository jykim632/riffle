-- summaries 테이블에 (week_id, author_id) 유니크 제약 추가
-- 동일 주차에 동일 사용자가 중복 요약본 생성 방지
ALTER TABLE summaries
ADD CONSTRAINT unique_week_author UNIQUE (week_id, author_id);
