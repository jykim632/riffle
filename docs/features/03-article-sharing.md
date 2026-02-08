# 독서/아티클 공유 게시판

> **이슈:** riffle-2qk | **우선순위:** P2 | **타입:** feature

## Context
라디오 요약 외에 경제 관련 기사/책/유튜브 링크를 자유롭게 공유할 수 있는 게시판. 주차 종속 없이 시즌 단위로 관리.

## 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 라우트 | `/shared` | "공유" 의미 명확, 링크/책/영상 포괄 |
| 테이블명 | `shared_links` | 핵심 데이터가 URL |
| 주차 연동 | 독립 (season_id만) | 링크 공유는 주차와 무관한 자유 활동 |
| 작성 UX | 목록 상단 인라인 폼 | 필드 2개뿐, 별도 페이지 과잉 |
| 링크 타입 | enum (article/book/youtube) | 아이콘/필터링 활용 |
| 수정 UX | Dialog | 필드 적어서 충분 |

## DB 스키마

```sql
CREATE TYPE public.link_type AS ENUM ('article', 'book', 'youtube');

CREATE TABLE public.shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  season_id TEXT NOT NULL REFERENCES public.seasons(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  link_type public.link_type NOT NULL DEFAULT 'article',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_shared_links_url_not_empty CHECK (length(trim(url)) > 0),
  CONSTRAINT chk_shared_links_url_length CHECK (length(url) <= 2048)
);

CREATE INDEX idx_shared_links_season ON public.shared_links(season_id);
CREATE INDEX idx_shared_links_author ON public.shared_links(author_id);
CREATE INDEX idx_shared_links_created ON public.shared_links(created_at DESC);

ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links FORCE ROW LEVEL SECURITY;

-- RLS: authenticated SELECT all, INSERT/UPDATE/DELETE by author + season member
```

## 구현 단계

### 1. DB 마이그레이션 + 타입
- `supabase/migrations/015_shared_links.sql`
- `src/lib/types/database.ts` — shared_links + link_type enum

### 2. Zod 스키마
- `src/lib/schemas/shared-link.ts`
  - `createSharedLinkSchema` — url (URL 검증), comment (200자), linkType
  - `updateSharedLinkSchema`, `deleteSharedLinkSchema`

### 3. Server Actions
- `src/actions/shared-links.ts`
  - `createSharedLink` — 현재 시즌 자동 조회, revalidatePath
  - `updateSharedLink`, `deleteSharedLink`

### 4. UI 컴포넌트
- `src/components/shared/shared-link-form.tsx` — 인라인 작성 폼
- `src/components/shared/shared-link-card.tsx` — 링크 카드 + 수정 Dialog + 삭제 AlertDialog
- `src/components/shared/type-filter.tsx` — 타입 필터 Select

### 5. 페이지
- `src/app/(dashboard)/shared/page.tsx` — 목록 + 인라인 폼 + 필터

### 6. 네비게이션
- `src/components/dashboard/header.tsx` — "공유" 링크 추가

## 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `supabase/migrations/015_shared_links.sql` | 신규 |
| `src/lib/types/database.ts` | 수정 |
| `src/lib/schemas/shared-link.ts` | 신규 |
| `src/actions/shared-links.ts` | 신규 |
| `src/app/(dashboard)/shared/page.tsx` | 신규 |
| `src/components/shared/shared-link-form.tsx` | 신규 |
| `src/components/shared/shared-link-card.tsx` | 신규 |
| `src/components/shared/type-filter.tsx` | 신규 |
| `src/components/dashboard/header.tsx` | 수정 |

## 검증
1. URL + 타입 + 코멘트 작성 -> 목록 즉시 반영
2. 타입별 필터, 내 글만 필터 동작
3. 본인만 수정/삭제, 타인 글에 액션 버튼 미노출
4. 빈 URL, 2048자 초과, 잘못된 URL 형식 거부
5. 외부 링크 새 탭 열림
6. 탈퇴 멤버 글 "탈퇴한 멤버" 표시
