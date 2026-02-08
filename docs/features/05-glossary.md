# 경제 용어 사전/위키

> **이슈:** riffle-ctz | **우선순위:** P3 | **타입:** feature

## Context
스터디 중 등장하는 경제 용어를 정리하고 공유하는 위키. 시간이 지나면 스터디 자산이 됨.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| DB 구조 | 단일 테이블 (glossary_terms) | 1인 운영, updated_by로 마지막 수정자 기록이면 충분 |
| 검색 | PostgreSQL ILIKE | 용어 수백 개 수준, 충분 |
| 정렬 | 서버 ORDER BY term | Supabase `.order('term')` 한 줄 |
| 편집 권한 | 모든 멤버 (위키 스타일) | 요구사항 충족 |
| 삭제 권한 | 관리자만 | 위키 특성상 함부로 삭제 방지 |
| 라우트 | `/glossary` + `/glossary/[id]` + new/edit | summaries 패턴 일관성 |
| 용어 중복 | UNIQUE (case-insensitive) | 혼란 방지 |

## DB 스키마

```sql
CREATE TABLE public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_glossary_term_not_empty CHECK (length(trim(term)) > 0),
  CONSTRAINT chk_glossary_definition_not_empty CHECK (length(trim(definition)) > 0)
);

CREATE UNIQUE INDEX idx_glossary_terms_term_unique
  ON public.glossary_terms (lower(trim(term)));

-- RLS: SELECT/INSERT/UPDATE = authenticated, DELETE = admin only
-- updated_at 자동 갱신 트리거 포함
```

## 구현 단계

### 1. DB + 타입
- `supabase/migrations/017_glossary.sql`
- `src/lib/types/database.ts` — glossary_terms 타입

### 2. Zod 스키마
- `src/lib/schemas/glossary.ts`
  - `createGlossaryTermSchema` — term (100자), definition (5~10000자, 마크다운)
  - `updateGlossaryTermSchema`, `deleteGlossaryTermSchema`

### 3. Server Actions
- `src/actions/glossary.ts`
  - `createGlossaryTerm` — created_by + updated_by 설정, 중복 용어 에러 처리
  - `updateGlossaryTerm` — updated_by만 현재 사용자로 (위키 스타일)
  - `deleteGlossaryTerm` — admin 체크

### 4. 페이지
- `src/app/(dashboard)/glossary/page.tsx` — 목록 + 검색
- `src/app/(dashboard)/glossary/[id]/page.tsx` — 상세 (마크다운 렌더)
- `src/app/(dashboard)/glossary/new/page.tsx` — 추가
- `src/app/(dashboard)/glossary/[id]/edit/page.tsx` — 수정

### 5. 컴포넌트
- `src/components/glossary/glossary-form.tsx` — 용어명 Input + MarkdownEditor
- `src/components/glossary/glossary-search.tsx` — 검색 (debounce)
- `src/components/glossary/glossary-actions.tsx` — 편집(모두)/삭제(admin)

### 6. 네비게이션
- `src/components/dashboard/header.tsx` — "용어사전" 링크

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/017_glossary.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/schemas/glossary.ts` | 신규 |
| `src/actions/glossary.ts` | 신규 |
| `src/app/(dashboard)/glossary/**` | 신규 (4개 페이지) |
| `src/components/glossary/**` | 신규 (3개) |
| `src/components/dashboard/header.tsx` | 수정 |

## 검증
1. 용어 추가 (마크다운), 편집 (다른 멤버), 삭제 (admin만)
2. 중복 용어 에러 메시지
3. 검색 (부분 문자열 매칭)
4. 가나다순 정렬
5. 빈 용어/설명 거부 (Zod + DB CHECK)
6. 탈퇴 멤버 created_by/updated_by -> "탈퇴한 멤버"
