-- summaries content 길이 제약 추가 (Zod 스키마 10,000자와 동일)
ALTER TABLE summaries
ADD CONSTRAINT summaries_content_length CHECK (char_length(content) <= 10000);
