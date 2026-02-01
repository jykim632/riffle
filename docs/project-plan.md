# Riffle - 경제 스터디 요약본 관리 시스템

> 매주 경제 라디오 요약본을 제출하고 관리하는 폐쇄형 스터디 웹 애플리케이션

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [핵심 기능](#핵심-기능)
4. [데이터베이스 설계](#데이터베이스-설계)
5. [프로젝트 구조](#프로젝트-구조)
6. [구현 단계](#구현-단계)
7. [주요 구현 포인트](#주요-구현-포인트)
8. [검증 계획](#검증-계획)

---

## 프로젝트 개요

### 배경
경제 스터디 모임에서 매주 경제 라디오를 듣고 요약본을 제출하는 활동을 진행하고 있습니다. 기존에는 카카오톡으로 요약본을 올렸지만, 누가 제출했는지 관리하기 어려운 문제가 있었습니다.

### 목표
- 로그인 후 요약본을 제출할 수 있는 웹 애플리케이션 제작
- 주차별로 누가 요약본을 제출했는지 자동 관리
- 이번주 제출 현황을 한눈에 확인 가능
- 과거 주차의 요약본을 아카이브로 보관

### 운영 방식
- **폐쇄형 스터디**: 초대 코드를 통해서만 가입 가능
- **주차 자동 전환**: 매주 월요일 00:00에 자동으로 새로운 주차 시작
- **1인 1주 1회**: 한 주에 한 사람당 하나의 요약본만 제출 가능

---

## 기술 스택

### 프론트엔드
- **Next.js 16.1** (App Router)
  - Server Components를 기본으로 사용
  - Server Actions로 데이터 변경 처리
  - Turbopack Stable (빌드 성능 향상)
  - React Compiler 내장 지원
- **TypeScript**
- **Tailwind CSS v4.1.18**
  - CSS-first 설정 (@theme 지시어)
  - text-shadow, mask 등 새로운 유틸리티
- **shadcn/ui v3.7.0** (UI 컴포넌트)
- **Lucide React** (아이콘)

### 백엔드
- **Supabase**
  - PostgreSQL 데이터베이스
  - Supabase Auth (이메일/비밀번호 인증)
  - Row Level Security (RLS)
  - pg_cron (주차 자동 전환)

### 배포
- **Vercel** (프론트엔드 호스팅)
- **Supabase Cloud** (데이터베이스 호스팅)

### 주요 라이브러리
| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| `@supabase/ssr` | Supabase 클라이언트 (Next.js App Router 지원) | ^0.5 |
| `@uiw/react-md-editor` | 마크다운 에디터 | ^4 |
| `react-markdown` | 마크다운 렌더링 | ^9 |
| `remark-gfm` | GitHub Flavored Markdown 지원 | ^4 |
| `react-hook-form` | 폼 관리 | ^7 |
| `zod` | 스키마 검증 | ^3 |
| `nanoid` | 초대 코드 생성 | ^5 |

---

## 핵심 기능

### 1. 인증 시스템
- **회원가입**
  - 초대 코드 입력 필수
  - 닉네임, 이메일, 비밀번호 등록
  - 이메일 인증 비활성화 (스터디 특성상 불필요)
- **로그인**
  - 이메일/비밀번호 방식
  - 세션 유지 (Supabase Auth)
- **로그아웃**

### 2. 요약본 관리
- **작성**
  - 마크다운 에디터 제공
  - 실시간 프리뷰
  - 이번주에 이미 제출한 경우 작성 불가 (1인 1주 1회)
- **수정**
  - 본인이 작성한 요약본만 수정 가능
  - 마크다운 에디터로 편집
- **삭제**
  - 본인이 작성한 요약본만 삭제 가능
- **조회**
  - 모든 사용자의 요약본 조회 가능
  - 주차별 필터링

### 3. 대시보드
- **이번주 요약본 목록**
  - 제출된 요약본 카드 형태로 표시
  - 작성자 닉네임 표시
- **제출 현황**
  - 제출한 멤버 목록 (배지)
  - 미제출 멤버 목록
- **요약본 작성 버튼**
  - 이미 제출한 경우 비활성화

### 4. 주차 관리
- **자동 전환**
  - 매주 월요일 00:00 (한국 시간)에 자동으로 새 주차 생성
  - pg_cron으로 구현
- **아카이브**
  - 과거 주차 목록 조회
  - 주차별 요약본 조회

### 5. 관리자 기능
- **초대 코드 생성**
  - 8자리 랜덤 코드 생성
  - 생성된 코드 목록 확인
  - 사용 여부 확인

---

## 데이터베이스 설계

### ERD

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│ auth.users  │───┐   │  profiles    │   ┌───│ invite_codes │
│ (Supabase)  │   │   │              │   │   │              │
└─────────────┘   │   │ - id (PK,FK) │   │   │ - id (PK)    │
                  └──▶│ - nickname   │◀──┘   │ - code       │
                      │ - role       │       │ - created_by │
                      │              │       │ - used_by    │
                      └──────────────┘       │ - is_used    │
                             │               └──────────────┘
                             │
                             ├──────────────┐
                             │              │
                      ┌──────▼──────┐ ┌─────▼──────┐
                      │   weeks     │ │ summaries  │
                      │             │ │            │
                      │ - id (PK)   │◀┤ - id (PK)  │
                      │ - number    │ │ - week_id  │
                      │ - title     │ │ - author_id│
                      │ - is_current│ │ - content  │
                      └─────────────┘ └────────────┘
```

### 테이블 상세

#### `profiles` - 사용자 프로필
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**역할**
- `admin`: 관리자 (초대 코드 생성 권한)
- `member`: 일반 멤버

#### `invite_codes` - 초대 코드
```sql
CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  used_by UUID REFERENCES public.profiles(id),
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);
```

**특징**
- 8자리 랜덤 코드 (nanoid)
- 한 번 사용하면 재사용 불가
- 누가 생성했고 누가 사용했는지 추적

#### `weeks` - 주차
```sql
CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  title TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**특징**
- `is_current`: 현재 주차 여부 (한 번에 하나만 true)
- `title`: "2024년 1월 1주차" 같은 제목

#### `summaries` - 요약본
```sql
CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(week_id, author_id)  -- 1인 1주 1회 보장
);
```

**특징**
- `content`: 마크다운 형식 텍스트
- UNIQUE 제약으로 1인 1주 1회 제출 보장

### 인덱스
```sql
-- 주차별 요약본 조회 최적화
CREATE INDEX idx_summaries_week_id ON public.summaries(week_id);

-- 사용자별 요약본 조회 최적화
CREATE INDEX idx_summaries_author_id ON public.summaries(author_id);

-- 현재 주차 빠른 조회
CREATE INDEX idx_weeks_is_current ON public.weeks(is_current) WHERE is_current = true;

-- 초대 코드 조회 최적화
CREATE INDEX idx_invite_codes_code ON public.invite_codes(code) WHERE is_used = false;
```

### RLS (Row Level Security) 정책

#### profiles 테이블
```sql
-- 모든 인증 사용자가 프로필 조회 가능
CREATE POLICY "프로필 조회" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- 본인 프로필만 수정 가능
CREATE POLICY "본인 프로필 수정" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
```

#### summaries 테이블
```sql
-- 모든 인증 사용자가 요약본 조회 가능
CREATE POLICY "요약본 조회" ON public.summaries
  FOR SELECT TO authenticated USING (true);

-- 본인 요약본만 작성/수정/삭제 가능
CREATE POLICY "요약본 작성" ON public.summaries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "요약본 수정" ON public.summaries
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "요약본 삭제" ON public.summaries
  FOR DELETE TO authenticated USING (auth.uid() = author_id);
```

### 트리거 - 프로필 자동 생성
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'nickname',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### pg_cron - 주차 자동 전환
```sql
SELECT cron.schedule(
  'auto-advance-week',
  '0 15 * * 0',  -- 일요일 15:00 UTC = 월요일 00:00 KST
  $$
  -- 현재 주차 비활성화
  UPDATE public.weeks SET is_current = false WHERE is_current = true;

  -- 새 주차 생성
  INSERT INTO public.weeks (week_number, title, start_date, end_date, is_current)
  SELECT
    COALESCE(MAX(week_number), 0) + 1,
    TO_CHAR(CURRENT_DATE, 'YYYY"년" MM"월"') || ' ' ||
      CEIL(EXTRACT(DAY FROM CURRENT_DATE) / 7.0)::INT || '주차',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 days',
    true
  FROM public.weeks;
  $$
);
```

---

## 프로젝트 구조

```
riffle/
├── .env.local                    # 환경변수 (Supabase 키)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── docs/                         # 문서
│   └── project-plan.md           # 이 문서
│
├── supabase/                     # Supabase 관련
│   └── schema.sql                # DB 스키마
│
└── src/
    ├── proxy.ts                  # 인증 프록시 (Next.js 16)
    │
    ├── app/
    │   ├── layout.tsx            # 루트 레이아웃
    │   ├── page.tsx              # 홈 (로그인으로 리다이렉트)
    │   │
    │   ├── (auth)/               # 인증 라우트 그룹
    │   │   ├── layout.tsx        # 인증 페이지 레이아웃
    │   │   ├── login/
    │   │   │   └── page.tsx      # 로그인 페이지
    │   │   └── signup/
    │   │       └── page.tsx      # 회원가입 페이지
    │   │
    │   └── (main)/               # 메인 라우트 그룹
    │       ├── layout.tsx        # 메인 레이아웃 (헤더, 인증 가드)
    │       ├── dashboard/
    │       │   └── page.tsx      # 대시보드
    │       ├── summaries/
    │       │   ├── new/
    │       │   │   └── page.tsx  # 요약본 작성
    │       │   ├── [id]/
    │       │   │   ├── page.tsx  # 요약본 상세
    │       │   │   └── edit/
    │       │   │       └── page.tsx  # 요약본 수정
    │       │   └── page.tsx      # 주차별 요약본 목록
    │       ├── weeks/
    │       │   └── page.tsx      # 주차 아카이브
    │       └── admin/
    │           └── invite-codes/
    │               └── page.tsx  # 초대 코드 관리
    │
    ├── components/
    │   ├── ui/                   # shadcn/ui 컴포넌트
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── card.tsx
    │   │   └── ...
    │   ├── auth/
    │   │   ├── login-form.tsx
    │   │   └── signup-form.tsx
    │   ├── summary/
    │   │   ├── summary-card.tsx
    │   │   ├── summary-editor.tsx    # 마크다운 에디터
    │   │   └── summary-viewer.tsx    # 마크다운 렌더링
    │   ├── week/
    │   │   └── week-selector.tsx
    │   └── layout/
    │       ├── header.tsx
    │       └── user-menu.tsx
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts         # 브라우저용 클라이언트
    │   │   └── server.ts         # 서버용 클라이언트
    │   ├── types/
    │   │   └── database.ts       # DB 타입 정의
    │   └── utils.ts              # 유틸리티 함수
    │
    └── actions/                  # Server Actions
        ├── auth.ts               # 로그인, 회원가입
        ├── summaries.ts          # 요약본 CRUD
        ├── weeks.ts              # 주차 조회
        └── invite-codes.ts       # 초대 코드 관리
```

### 라우팅 구조

| 경로 | 접근 권한 | 설명 |
|-----|----------|------|
| `/` | 공개 | 로그인 페이지로 리다이렉트 |
| `/login` | 공개 | 로그인 |
| `/signup` | 공개 | 회원가입 (초대 코드 필요) |
| `/dashboard` | 인증 필요 | 대시보드 (이번주 요약본, 제출 현황) |
| `/summaries` | 인증 필요 | 주차별 요약본 목록 |
| `/summaries/new` | 인증 필요 | 요약본 작성 |
| `/summaries/[id]` | 인증 필요 | 요약본 상세 |
| `/summaries/[id]/edit` | 인증 필요 + 본인 | 요약본 수정 |
| `/weeks` | 인증 필요 | 주차 아카이브 |
| `/admin/invite-codes` | 관리자 | 초대 코드 관리 |

---

## 구현 단계

### Phase 1: 프로젝트 초기화 (1일차)

**목표**: 개발 환경 설정 및 기본 인프라 구축

1. **Next.js 프로젝트 생성**
   ```bash
   npx create-next-app@16.1 . --typescript --tailwind --eslint --app --src-dir --turbopack
   ```

2. **shadcn/ui 초기화**
   ```bash
   npx shadcn@latest init
   npx shadcn@latest add button input card label textarea dropdown-menu badge avatar
   ```

3. **Supabase 프로젝트 생성**
   - Supabase Dashboard에서 새 프로젝트 생성
   - `.env.local` 파일에 키 추가
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **DB 스키마 실행**
   - Supabase SQL Editor에서 `supabase/schema.sql` 실행
   - 테이블, 인덱스, RLS, 트리거 모두 생성

5. **Supabase 클라이언트 설정**
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   ```
   - `src/lib/supabase/client.ts` 생성 (브라우저용)
   - `src/lib/supabase/server.ts` 생성 (서버용)

6. **인증 프록시 작성 (Next.js 16)**
   - `src/proxy.ts` 생성 (**middleware.ts 대체**)
   - Node.js 런타임 사용 (Edge 런타임 미지원)
   - 보호된 라우트 접근 제어
   - config.matcher로 실행 경로 지정

7. **타입 정의**
   - `src/lib/types/database.ts` 생성

### Phase 2: 인증 시스템 (2일차)

**목표**: 로그인, 회원가입, 로그아웃 기능 구현

1. **로그인 페이지**
   - `src/app/(auth)/login/page.tsx`
   - 이메일/비밀번호 폼
   - Server Action으로 `supabase.auth.signInWithPassword` 호출

2. **회원가입 페이지**
   - `src/app/(auth)/signup/page.tsx`
   - 초대 코드 + 닉네임 + 이메일/비밀번호 폼
   - Server Action에서 초대 코드 검증 후 회원가입

3. **초대 코드 검증 로직**
   - `src/actions/auth.ts`에 `signup` 함수 작성
   - `service_role` 키로 초대 코드 확인 (RLS 우회)
   - 사용 처리 (`is_used = true`, `used_by` 업데이트)

4. **로그아웃 기능**
   - 헤더의 사용자 메뉴에 로그아웃 버튼
   - Server Action으로 `supabase.auth.signOut` 호출

**핵심 파일**:
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/actions/auth.ts`

### Phase 3: 메인 레이아웃 및 대시보드 (3일차)

**목표**: 로그인 후 메인 화면 구성

1. **메인 레이아웃**
   - `src/app/(main)/layout.tsx`
   - 헤더 + 콘텐츠 영역
   - 현재 사용자 정보 표시

2. **헤더 컴포넌트**
   - `src/components/layout/header.tsx`
   - 로고, 네비게이션 (대시보드, 주차 목록)
   - 사용자 메뉴 (닉네임, 로그아웃)

3. **대시보드 페이지**
   - `src/app/(main)/dashboard/page.tsx`
   - 이번주 요약본 목록 (카드 형태)
   - 제출 현황 (제출자/미제출자 배지)
   - "요약본 작성" 버튼

**핵심 파일**:
- `src/app/(main)/layout.tsx`
- `src/app/(main)/dashboard/page.tsx`
- `src/components/layout/header.tsx`

### Phase 4: 요약본 CRUD (4-5일차)

**목표**: 요약본 작성, 수정, 삭제, 조회 기능

1. **마크다운 에디터 설치**
   ```bash
   npm install @uiw/react-md-editor react-markdown remark-gfm
   ```

2. **에디터 컴포넌트**
   - `src/components/summary/summary-editor.tsx`
   - `@uiw/react-md-editor` 래핑
   - **중요**: `dynamic import`로 SSR 비활성화 필수
   ```tsx
   const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
   ```

3. **요약본 작성 페이지**
   - `src/app/(main)/summaries/new/page.tsx`
   - 이미 제출한 경우 안내 메시지
   - 에디터 + 제출 버튼

4. **요약본 작성 액션**
   - `src/actions/summaries.ts`에 `createSummary` 함수
   - 중복 제출 체크 (UNIQUE 제약 활용)

5. **요약본 상세 페이지**
   - `src/app/(main)/summaries/[id]/page.tsx`
   - `react-markdown`으로 렌더링
   - 본인 요약본인 경우 수정/삭제 버튼

6. **요약본 수정 페이지**
   - `src/app/(main)/summaries/[id]/edit/page.tsx`
   - 기존 내용 로드 + 에디터

7. **요약본 삭제 액션**
   - `src/actions/summaries.ts`에 `deleteSummary` 함수

**핵심 파일**:
- `src/components/summary/summary-editor.tsx`
- `src/components/summary/summary-viewer.tsx`
- `src/app/(main)/summaries/new/page.tsx`
- `src/app/(main)/summaries/[id]/page.tsx`
- `src/actions/summaries.ts`

### Phase 5: 주차 관리 (5일차)

**목표**: 주차별 요약본 조회 및 아카이브

1. **주차 목록 페이지**
   - `src/app/(main)/weeks/page.tsx`
   - 전체 주차 카드 목록
   - 클릭 시 해당 주차 요약본으로 이동

2. **주차별 요약본 목록**
   - `src/app/(main)/summaries/page.tsx`
   - 쿼리 파라미터로 주차 필터링 (`?week={id}`)

3. **주차 선택 드롭다운**
   - `src/components/week/week-selector.tsx`

4. **초기 주차 데이터 생성**
   - SQL로 첫 주차 수동 생성 또는 시드 스크립트

**핵심 파일**:
- `src/app/(main)/weeks/page.tsx`
- `src/app/(main)/summaries/page.tsx`

### Phase 6: 관리자 기능 (6일차)

**목표**: 초대 코드 생성 및 관리

1. **관리자 권한 확인**
   - 레이아웃 또는 페이지에서 `role === 'admin'` 체크

2. **초대 코드 생성 페이지**
   - `src/app/(main)/admin/invite-codes/page.tsx`
   - 코드 생성 버튼
   - 기존 코드 목록 (생성일, 사용 여부, 사용자)

3. **초대 코드 생성 액션**
   - `src/actions/invite-codes.ts`에 `createInviteCode` 함수
   - `nanoid(8)` 또는 `crypto.randomUUID().slice(0, 8)` 사용

**핵심 파일**:
- `src/app/(main)/admin/invite-codes/page.tsx`
- `src/actions/invite-codes.ts`

### Phase 7: 마무리 및 배포 (7일차)

**목표**: UI 개선 및 배포

1. **UI 다듬기**
   - 반응형 레이아웃
   - 빈 상태 처리 (요약본 없을 때 등)
   - 로딩 상태 (Suspense, loading.tsx)

2. **에러 처리**
   - `error.tsx` (에러 바운더리)
   - `not-found.tsx` (404 페이지)

3. **pg_cron 설정**
   - Supabase SQL Editor에서 크론 등록
   - 시간대 주의 (UTC vs KST)

4. **첫 관리자 설정**
   - SQL로 첫 사용자 role을 'admin'으로 변경
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

5. **Vercel 배포**
   - GitHub 저장소 연동
   - 환경변수 설정
   - 자동 배포

6. **초기 데이터**
   - 첫 주차 생성
   - 초대 코드 몇 개 생성

---

## 주요 구현 포인트

### 0. Next.js 16 주요 변경사항

#### middleware.ts → proxy.ts 마이그레이션

Next.js 16부터 `middleware.ts` 파일명이 `proxy.ts`로 변경되었습니다.

**변경사항:**
- **파일명**: `middleware.ts` → `proxy.ts`
- **함수명**: `middleware()` → `proxy()` (또는 `export default`)
- **런타임**: Node.js 런타임만 지원 (Edge 런타임 미지원)
- **config**: matcher 설정은 동일하게 사용

**마이그레이션 방법:**
```bash
# 파일 이름 변경
mv src/middleware.ts src/proxy.ts
```

```typescript
// Before (Next.js 15)
export function middleware(request: NextRequest) {
  // ...
}

// After (Next.js 16)
export default async function proxy(request: NextRequest) {
  // ...
}
```

### 1. Supabase 클라이언트 구성

Next.js 16 App Router에서는 3가지 Supabase 클라이언트가 필요합니다.

#### 브라우저용 (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### 서버용 (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

#### 프록시용 (`src/proxy.ts` - Next.js 16)

> **중요**: Next.js 16부터 `middleware.ts`가 `proxy.ts`로 변경되었습니다.
> - 함수명: `middleware()` → `proxy()`
> - 런타임: **Node.js 런타임만 지원** (Edge 런타임 미지원)
> - config.matcher는 동일하게 사용

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 인증되지 않은 사용자 → 로그인으로 리다이렉트
  if (!user && !request.nextUrl.pathname.startsWith('/login')
            && !request.nextUrl.pathname.startsWith('/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 인증된 사용자가 로그인/회원가입 페이지 → 대시보드로
  if (user && (request.nextUrl.pathname.startsWith('/login')
            || request.nextUrl.pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### 2. 회원가입 Server Action

```typescript
// src/actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nickname = formData.get('nickname') as string
  const inviteCode = formData.get('inviteCode') as string

  // 1. service_role로 초대 코드 검증 (RLS 우회)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: code } = await adminClient
    .from('invite_codes')
    .select()
    .eq('code', inviteCode)
    .eq('is_used', false)
    .single()

  if (!code) {
    return { error: '유효하지 않은 초대 코드입니다.' }
  }

  // 2. 회원가입 (트리거가 profiles 자동 생성)
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }  // raw_user_meta_data에 저장
    }
  })

  if (error) return { error: error.message }

  // 3. 초대 코드 사용 처리
  await adminClient
    .from('invite_codes')
    .update({
      is_used: true,
      used_by: data.user!.id,
      used_at: new Date().toISOString()
    })
    .eq('id', code.id)

  redirect('/dashboard')
}
```

### 3. 마크다운 에디터 컴포넌트

```typescript
// src/components/summary/summary-editor.tsx
'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

// SSR 비활성화 (에디터는 브라우저에서만 동작)
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface SummaryEditorProps {
  initialContent?: string
  weekId: string
  summaryId?: string  // 수정 시
}

export function SummaryEditor({
  initialContent = '',
  weekId,
  summaryId
}: SummaryEditorProps) {
  const [content, setContent] = useState(initialContent)

  return (
    <form action={summaryId ? updateSummary : createSummary}>
      <input type="hidden" name="weekId" value={weekId} />
      {summaryId && <input type="hidden" name="summaryId" value={summaryId} />}
      <input type="hidden" name="content" value={content} />

      <MDEditor
        value={content}
        onChange={(val) => setContent(val || '')}
        height={400}
        preview="live"
      />

      <button type="submit">
        {summaryId ? '수정하기' : '제출하기'}
      </button>
    </form>
  )
}
```

### 4. 대시보드 서버 컴포넌트

```typescript
// src/app/(main)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 현재 주차 조회
  const { data: currentWeek } = await supabase
    .from('weeks')
    .select('*')
    .eq('is_current', true)
    .single()

  if (!currentWeek) {
    return <div>현재 주차가 설정되지 않았습니다.</div>
  }

  // 이번주 요약본 + 작성자 정보
  const { data: summaries } = await supabase
    .from('summaries')
    .select(`
      *,
      author:profiles(nickname)
    `)
    .eq('week_id', currentWeek.id)
    .order('created_at', { ascending: false })

  // 전체 멤버 목록 (제출 현황용)
  const { data: members } = await supabase
    .from('profiles')
    .select('id, nickname')

  // 현재 사용자
  const { data: { user } } = await supabase.auth.getUser()
  const hasSubmitted = summaries?.some(s => s.author_id === user?.id)

  return (
    <div>
      <h1>{currentWeek.title}</h1>

      {/* 제출 현황 */}
      <section>
        <h2>제출 현황</h2>
        <div>
          {members?.map(member => {
            const submitted = summaries?.some(s => s.author_id === member.id)
            return (
              <Badge key={member.id} variant={submitted ? 'default' : 'secondary'}>
                {member.nickname}
              </Badge>
            )
          })}
        </div>
      </section>

      {/* 요약본 목록 */}
      <section>
        <h2>이번주 요약본</h2>
        {summaries?.map(summary => (
          <SummaryCard key={summary.id} summary={summary} />
        ))}
      </section>

      {/* 작성 버튼 */}
      {!hasSubmitted && (
        <Link href="/summaries/new">
          <Button>요약본 작성하기</Button>
        </Link>
      )}
    </div>
  )
}
```

### 5. 초대 코드 생성

```typescript
// src/actions/invite-codes.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function createInviteCode() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '인증이 필요합니다.' }

  // 관리자 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { error: '권한이 없습니다.' }
  }

  const code = nanoid(8).toUpperCase()  // 예: "A3K9X2M1"

  const { error } = await supabase
    .from('invite_codes')
    .insert({ code, created_by: user.id })

  if (error) return { error: error.message }

  return { code }
}
```

---

## 검증 계획

### 기능 테스트

1. **인증**
   - [ ] 초대 코드로 회원가입 가능
   - [ ] 잘못된 초대 코드는 거부됨
   - [ ] 이메일/비밀번호로 로그인 가능
   - [ ] 로그아웃 후 보호된 페이지 접근 시 로그인으로 리다이렉트

2. **요약본 작성**
   - [ ] 마크다운 에디터로 요약본 작성 가능
   - [ ] 한 주에 한 번만 제출 가능 (중복 제출 시 에러)
   - [ ] 본인 요약본만 수정/삭제 가능
   - [ ] 마크다운이 올바르게 렌더링됨

3. **대시보드**
   - [ ] 이번주 요약본 목록 표시
   - [ ] 제출자/미제출자 배지 표시
   - [ ] 이미 제출한 경우 "작성하기" 버튼 비활성화

4. **주차 관리**
   - [ ] 과거 주차 목록 조회 가능
   - [ ] 주차별 요약본 필터링 동작
   - [ ] pg_cron으로 매주 월요일 주차 자동 전환

5. **관리자**
   - [ ] 관리자만 초대 코드 생성 페이지 접근 가능
   - [ ] 초대 코드 생성 동작
   - [ ] 생성된 코드 목록 및 사용 여부 확인

### 배포 테스트

1. **Vercel**
   - [ ] GitHub 연동 및 자동 배포
   - [ ] 환경변수 올바르게 설정
   - [ ] 프로덕션 빌드 성공

2. **Supabase**
   - [ ] RLS 정책 동작 확인 (다른 사용자 요약본 수정 불가)
   - [ ] 트리거 동작 확인 (회원가입 시 profiles 자동 생성)
   - [ ] pg_cron 로그 확인

---

## 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| pg_cron 주차 자동 생성 실패 | 높음 | 관리자 수동 주차 생성 UI 추가. 대시보드에서 현재 주차 없을 때 안내 메시지 |
| Supabase 이메일 인증 기본 활성화 | 중간 | 대시보드 > Authentication > Settings에서 "Confirm email" 비활성화 |
| 마크다운 에디터 SSR 에러 | 중간 | `dynamic import`로 SSR 비활성화 필수 |
| 초대 코드 무차별 대입 | 낮음 | nanoid 8자리 (36^8 = 2.8조). 필요시 rate limiting 추가 |
| 시간대 이슈 (UTC vs KST) | 중간 | pg_cron은 UTC 기준. KST 월요일 00:00 = UTC 일요일 15:00 |

---

## 패키지 목록

```json
{
  "name": "riffle",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.1",
    "react": "^19",
    "react-dom": "^19",
    "@supabase/supabase-js": "^2",
    "@supabase/ssr": "^0.5",
    "@uiw/react-md-editor": "^4",
    "react-markdown": "^9",
    "remark-gfm": "^4",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "zod": "^3",
    "nanoid": "^5",
    "lucide-react": "^0.460",
    "clsx": "^2",
    "tailwind-merge": "^2",
    "class-variance-authority": "^0.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^4.1.18",
    "eslint": "^8",
    "eslint-config-next": "^15"
  }
}
```

---

## 다음 단계

1. **Phase 1 시작**: Next.js 프로젝트 초기화
2. **Supabase 프로젝트 생성**: 데이터베이스 설정
3. **shadcn/ui 설정**: UI 컴포넌트 준비
4. **순차적 구현**: Phase 2부터 Phase 7까지

---

**문서 작성일**: 2026-02-01
**예상 개발 기간**: 7일
**목표**: 가볍고 심플한 스터디 요약본 관리 시스템
