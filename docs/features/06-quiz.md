# 주간 퀴즈

> **이슈:** riffle-k33 | **우선순위:** P3 | **타입:** feature

## Context
라디오 내용 기반 객관식 퀴즈로 학습 동기 부여. 어드민 출제, 향후 AI 자동 생성 고려.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 퀴즈 PK | TEXT (nanoid 8자) | weeks/seasons 패턴 일관성, 짧은 URL |
| 선택지 저장 | JSONB 컬럼 | 4지선다 고정, 별도 테이블 과잉 |
| 시도 구조 | 전체 1행 (answers JSONB) | 한 번에 제출, 트랜잭션 단순 |
| 퀴즈 상태 | status (draft/published) | 임시저장 가능, 의도 명확 |
| 재시도 | 1회 + 해설 표시 | 학습 목적에 적합 |
| 정답 노출 방지 | 서버 사이드 필터링 | RLS는 행 단위라 컬럼 제어 불가 |

## DB 스키마

```sql
-- quizzes: 주차별 퀴즈 메타
CREATE TABLE public.quizzes (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  week_id TEXT NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT uq_quizzes_week UNIQUE (week_id)
);

-- quiz_questions: 개별 문제
CREATE TABLE public.quiz_questions (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,          -- ["A", "B", "C", "D"]
  correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
  explanation TEXT,
  CONSTRAINT uq_quiz_questions_number UNIQUE (quiz_id, question_number),
  CONSTRAINT chk_options_length CHECK (jsonb_array_length(options) = 4)
);

-- quiz_attempts: 멤버별 풀이 기록
CREATE TABLE public.quiz_attempts (
  id TEXT PRIMARY KEY DEFAULT nanoid(),
  quiz_id TEXT NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,          -- { "q_id": selected_option }
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_quiz_attempts_user UNIQUE (quiz_id, user_id)
);

-- RLS: quizzes/questions — admin CUD, published SELECT for authenticated
-- RLS: attempts — SELECT all, INSERT by author only, no UPDATE/DELETE
```

## 구현 단계

### 1. DB + 타입
- `supabase/migrations/018_quizzes.sql`
- `src/lib/types/database.ts` — quizzes, quiz_questions, quiz_attempts
- `src/lib/nanoid.ts` — quizId 추가

### 2. Zod 스키마
- `src/lib/schemas/quiz.ts`
  - `createQuizSchema` — weekId, title, questions[]
  - `submitQuizSchema` — quizId, answers

### 3. Server Actions
- `src/lib/actions/admin/quizzes.ts` — create, update, publish, delete (requireAdmin)
- `src/actions/quiz.ts` — submitQuiz (서버 사이드 채점)

### 4. 쿼리 헬퍼
- `src/lib/queries/quiz.ts`

### 5. 멤버 페이지
- `src/app/(dashboard)/quiz/page.tsx` — 퀴즈 목록
- `src/app/(dashboard)/quiz/[quizId]/page.tsx` — 풀기/결과

### 6. 멤버 컴포넌트
- `src/components/quiz/quiz-form.tsx` — 풀기 폼 (4지선다 라디오)
- `src/components/quiz/quiz-result.tsx` — 결과 (정답/오답/해설)
- `src/components/quiz/quiz-card.tsx` — 목록 카드

### 7. 어드민
- `src/app/admin/quizzes/page.tsx`
- `src/components/admin/quizzes/quiz-manager.tsx`
- `src/components/admin/quizzes/question-editor.tsx`

### 8. 네비게이션
- `header.tsx` — "퀴즈" 링크
- `sidebar.tsx` — "퀴즈 관리" 메뉴

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/018_quizzes.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/nanoid.ts` | 수정 |
| `src/lib/schemas/quiz.ts` | 신규 |
| `src/lib/queries/quiz.ts` | 신규 |
| `src/lib/actions/admin/quizzes.ts` | 신규 |
| `src/actions/quiz.ts` | 신규 |
| 멤버 페이지/컴포넌트 | 신규 (5개+) |
| 어드민 페이지/컴포넌트 | 신규 (3개+) |
| header.tsx, sidebar.tsx | 수정 |

## 주의사항
- **정답 노출 방지**: 풀기 전 correct_option을 클라이언트에 절대 전달하지 않음
- **서버 사이드 채점**: 점수는 서버에서만 계산
- **트랜잭션 없음**: Supabase JS는 트랜잭션 미지원, 퀴즈+문제 생성 실패 시 수동 롤백

## 검증
1. 어드민 퀴즈 생성 (5문제), publish, 삭제
2. 멤버 풀기 -> 채점 정확, 결과/해설 표시
3. 재시도 차단 (UNIQUE)
4. draft 퀴즈 일반 사용자 미노출
5. 정답이 클라이언트 JS에 노출되지 않음
