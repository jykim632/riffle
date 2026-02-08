# 요약글 코멘트/피드백 기능

> **이슈:** riffle-30x | **우선순위:** P1 | **타입:** feature

## Context
현재 요약글은 작성/조회만 가능하고 멤버 간 상호작용이 없음. 댓글 기능 추가로 피드백 루프를 만들어 참여도 향상.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 댓글 구조 | 플랫 (비중첩) | 소규모 스터디, 대댓글 불필요 |
| 댓글 내용 | 플레인 텍스트 | 짧은 피드백이라 마크다운 과잉 |
| 글자 수 | 1~500자 | 간결한 피드백 유도 |
| 수정/삭제 | 본인만 가능 | summaries와 동일 패턴 |
| 댓글 수 표시 | 요약 목록에 카운트 표시 | 활성도 시각화 |

## DB 스키마

```sql
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

CREATE INDEX idx_comments_summary_id ON public.comments(summary_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments FORCE ROW LEVEL SECURITY;

CREATE POLICY "댓글 조회" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "댓글 작성" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "댓글 수정" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "댓글 삭제" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = author_id);
```

## 구현 단계

### 1. DB 마이그레이션
- `supabase/migrations/014_comments.sql` — 신규
- `supabase/schema.sql` — comments 섹션 추가

### 2. TypeScript 타입
- `src/lib/types/database.ts` — comments Row/Insert/Update 타입 추가

### 3. Zod 스키마
- `src/lib/schemas/comment.ts` (신규)
  - `createCommentSchema` — summaryId (uuid), content (1~500자)
  - `updateCommentSchema` — commentId (uuid), content (1~500자)
  - `deleteCommentSchema` — commentId (uuid)

### 4. Server Actions
- `src/actions/comments.ts` (신규)
  - `createComment(formData)` — 댓글 작성, revalidatePath
  - `updateComment(formData)` — 댓글 수정, revalidatePath
  - `deleteComment(formData)` — 댓글 삭제, revalidatePath
  - redirect 대신 `revalidatePath`로 페이지 갱신 (같은 페이지 유지)

### 5. UI 컴포넌트
- `src/components/comment/comment-list.tsx` — 댓글 목록 (Server Component)
- `src/components/comment/comment-form.tsx` — 댓글 작성 폼 (Client Component)
- `src/components/comment/comment-item.tsx` — 개별 댓글 + 인라인 수정/삭제

### 6. 페이지 통합
- `src/app/(dashboard)/summaries/[id]/page.tsx` — 댓글 섹션 추가
- `src/app/(dashboard)/summaries/page.tsx` — 댓글 수 배지 표시

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/014_comments.sql` | 신규 |
| `supabase/schema.sql` | 수정 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/schemas/comment.ts` | 신규 |
| `src/actions/comments.ts` | 신규 |
| `src/components/comment/comment-list.tsx` | 신규 |
| `src/components/comment/comment-form.tsx` | 신규 |
| `src/components/comment/comment-item.tsx` | 신규 |
| `src/app/(dashboard)/summaries/[id]/page.tsx` | 수정 |
| `src/app/(dashboard)/summaries/page.tsx` | 수정 |

## 검증
1. `pnpm build` 에러 없는지 확인
2. 댓글 작성/수정/삭제 CRUD 테스트
3. 다른 사용자 댓글에 수정/삭제 버튼 미노출 확인
4. 빈 댓글, 500자 초과 검증 에러 확인
5. 요약 삭제 시 CASCADE 삭제 확인
