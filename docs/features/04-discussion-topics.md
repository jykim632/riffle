# 주간 토론 주제

> **이슈:** riffle-t50 | **우선순위:** P2 | **타입:** feature
> **의존성:** riffle-30x (코멘트 기능) 완료 후 진행

## Context
요약 제출과 별도로, 주차별 토론 질문을 통해 가벼운 참여를 유도. 어드민이 주차마다 1~3개 질문을 등록하면 멤버들이 300자 이내 짧은 답변 작성.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 테이블 구조 | 정규화 2테이블 | 개별 질문별 답변 집계, RLS 적용 가능 |
| 질문 개수 제한 | 앱 레벨 (3개) | DB cross-row 검증 불가 |
| 답변 식별 | (question_id, author_id) UNIQUE | 질문당 1답변, 수정으로 대체 |
| 어드민 UI | 별도 `/admin/discussions` | 주차 관리 페이지 이미 복잡 |
| 멤버 UI | `/discussions` + 대시보드 위젯 | 독립 페이지 + 현재 주차 요약 |

## DB 스키마

```sql
-- 토론 질문
CREATE TABLE public.discussions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id text NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  question text NOT NULL,
  display_order smallint NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT discussions_week_order_unique UNIQUE (week_id, display_order),
  CONSTRAINT discussions_question_length CHECK (char_length(question) BETWEEN 1 AND 200)
);

-- 토론 답변
CREATE TABLE public.discussion_replies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT discussion_replies_unique_answer UNIQUE (discussion_id, author_id),
  CONSTRAINT discussion_replies_content_length CHECK (char_length(content) BETWEEN 1 AND 300)
);

-- RLS: discussions — admin CRUD, authenticated SELECT
-- RLS: discussion_replies — author_id CRUD, authenticated SELECT
```

## 구현 단계

### 1. DB + 타입
- `supabase/migrations/016_discussions.sql`
- `src/lib/types/database.ts` — discussions, discussion_replies 타입

### 2. Zod 스키마
- `src/lib/schemas/discussion.ts`

### 3. Server Actions
- `src/lib/actions/admin/discussions.ts` — 질문 CRUD (requireAdmin)
- `src/actions/discussions.ts` — 답변 CRUD (requireUser)

### 4. 쿼리 헬퍼
- `src/lib/queries/discussion.ts`

### 5. 어드민 페이지
- `src/app/admin/discussions/page.tsx`
- `src/components/admin/discussions/discussion-questions-manager.tsx`

### 6. 멤버 페이지
- `src/app/(dashboard)/discussions/page.tsx`
- `src/components/discussions/discussion-card.tsx`
- `src/components/discussions/reply-form.tsx`
- `src/components/discussions/reply-item.tsx`

### 7. 네비게이션
- `src/components/dashboard/header.tsx` — "토론" 링크 추가
- `src/components/admin/sidebar.tsx` — "토론 관리" 메뉴 추가

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/016_discussions.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/schemas/discussion.ts` | 신규 |
| `src/lib/queries/discussion.ts` | 신규 |
| `src/lib/actions/admin/discussions.ts` | 신규 |
| `src/actions/discussions.ts` | 신규 |
| `src/app/admin/discussions/page.tsx` | 신규 |
| `src/app/(dashboard)/discussions/page.tsx` | 신규 |
| `src/components/discussions/*.tsx` | 신규 (3개) |
| `src/components/admin/discussions/*.tsx` | 신규 |
| `src/components/dashboard/header.tsx` | 수정 |
| `src/components/admin/sidebar.tsx` | 수정 |

## 검증
1. 어드민 질문 등록 (3개 제한), 수정, 삭제 (CASCADE)
2. 멤버 답변 작성 (300자), 수정, 삭제
3. 중복 답변 차단 (UNIQUE)
4. 주차 필터 변경 시 해당 주차 토론 로드
5. 비관리자 질문 INSERT RLS 차단
6. 탈퇴 멤버 답변 "탈퇴한 멤버" 표시
