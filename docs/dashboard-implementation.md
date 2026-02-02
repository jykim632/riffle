# Riffle - 대시보드 구현 계획

## 목표
헤더 + 메인 컨텐츠 구조의 대시보드 구현

## 사용자 요구사항

**레이아웃:**
- 헤더 + 컨텐츠 구조 (사이드바 없음)

**헤더 요소:**
- 로고/서비스명 (Riffle)
- 네비게이션 (대시보드, 요약본, 주차 관리)
- 현재 주차 표시 (배지)
- 사용자 메뉴 (닉네임, 로그아웃)

**대시보드 메인:**
- 현재 주차 정보 (주차 번호, 제목, 날짜 범위)
- 내 제출 현황 (이번 주 제출 여부, 제출일시)
- 전체 제출 현황 (멤버들 제출 현황 배지)
- 최근 요약본 (내가 작성한 최근 5개)

**디자인 철학:**
- 일반 사용자용 (admin 대시보드 느낌 X)
- 깔끔하고 예쁜 UI
- 투박하지 않고 세련됨

---

## 디자인 가이드라인

### 전체 느낌
- **부드럽고 모던한** 디자인
- **카드 중심** 레이아웃 (섹션별 카드로 구분)
- **적절한 여백과 간격** (답답하지 않게)
- **아이콘 활용** (lucide-react로 직관적인 아이콘)

### 색상
- **Primary**: 브랜드 컬러 (accent 또는 primary)
- **배경**:
  - 라이트 모드: 밝은 회색 (`bg-muted/30`)
  - 다크 모드: 어두운 회색 (`bg-background`)
- **카드**:
  - 흰색/다크 카드 (`bg-card`)
  - 미세한 그림자 (`shadow-sm`)
  - 호버 시 살짝 올라오는 효과 (`hover:shadow-md transition-shadow`)
- **배지**:
  - 제출 완료: 부드러운 초록 (`variant="default"` 또는 `success`)
  - 미제출: 중성 회색 (`variant="secondary"`)
  - 현재 주차: accent 색상 (`variant="outline"`)

### 타이포그래피
- **헤더 로고**: `text-xl font-bold`
- **섹션 제목**: `text-lg font-semibold`
- **카드 제목**: `text-base font-medium`
- **본문**: `text-sm text-muted-foreground`
- **강조**: `text-foreground font-medium`

### 간격 & 여백
- **헤더 패딩**: `px-6 py-4`
- **메인 컨텐츠**: `max-w-7xl mx-auto px-6 py-8`
- **카드 간격**: `gap-6` (그리드)
- **카드 패딩**: `p-6`
- **섹션 간격**: `space-y-6`

### 카드 스타일
```tsx
// 기본 카드
<Card className="shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      제목
    </CardTitle>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>
```

### 라운딩
- **카드**: `rounded-lg` (기본)
- **배지**: `rounded-full` (부드러운 알약 모양)
- **버튼**: `rounded-md`
- **아바타**: `rounded-full`

### 인터랙션
- **버튼 호버**:
  - `hover:bg-primary/90`
  - `transition-colors`
- **링크 호버**:
  - `hover:text-primary`
  - `hover:underline`
- **카드 호버**:
  - `hover:shadow-md`
  - `transition-shadow`

### 아이콘 사용
- **현재 주차**: Calendar 아이콘
- **제출 현황**: CheckCircle2 / Circle 아이콘
- **요약본**: FileText 아이콘
- **사용자 메뉴**: User 아이콘
- **로그아웃**: LogOut 아이콘

### 빈 상태 디자인
- **아이콘**: 큰 아이콘 (`h-12 w-12 text-muted-foreground`)
- **메시지**: 친근한 문구
- **액션 버튼**: Primary 버튼

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold mb-2">아직 작성한 요약본이 없어요</h3>
  <p className="text-sm text-muted-foreground mb-4">
    첫 번째 요약본을 작성해보세요!
  </p>
  <Button>요약본 작성하기</Button>
</div>
```

---

## 파일 구조

### 생성할 파일

**Route & Layout:**
- `src/middleware.ts` - 인증 보호 라우트
- `src/app/(dashboard)/layout.tsx` - 대시보드 레이아웃 (헤더 포함)
- `src/app/(dashboard)/dashboard/page.tsx` - 대시보드 메인 페이지

**Components:**
- `src/components/dashboard/header.tsx` - 헤더
- `src/components/dashboard/user-menu.tsx` - 사용자 드롭다운
- `src/components/dashboard/current-week-info.tsx` - 현재 주차 섹션
- `src/components/dashboard/my-submission-status.tsx` - 내 제출 현황
- `src/components/dashboard/all-submissions-status.tsx` - 전체 제출 현황
- `src/components/dashboard/recent-summaries.tsx` - 최근 요약본

**Utilities:**
- `src/lib/utils/date.ts` - 날짜 포맷팅

### 수정할 파일
- `src/app/page.tsx` - 루트 → `/dashboard` 리다이렉트

---

## 구현 순서

### Phase 1: 인프라 (30분)
1. **middleware.ts**
   - `/dashboard/*` 경로 인증 체크
   - 미인증: `/login` 리다이렉트
   - 인증됨 + `/login|/signup`: `/dashboard` 리다이렉트
   - Supabase SSR 쿠키 동기화

2. **src/app/page.tsx**
   - 루트 접근 시 `/dashboard` 리다이렉트

3. **src/lib/utils/date.ts**
   - `formatDateRange(start, end)` - "YYYY.MM.DD - MM.DD" 형식

### Phase 2: 레이아웃 & 헤더 (45분)
4. **user-menu.tsx**
   - Avatar + DropdownMenu
   - props: `nickname`
   - 로그아웃 form + Server Action
   - 아이콘: User, LogOut

5. **header.tsx**
   - 로고 (좌측): 텍스트 + 아이콘 (선택)
   - 네비게이션 링크 (중앙): 호버 효과
   - 현재 주차 배지 (우측): outline variant + Calendar 아이콘
   - UserMenu (우측 끝)
   - props: `currentWeek`, `user`

6. **dashboard/layout.tsx**
   - Header 컴포넌트 포함
   - 현재 주차 + 사용자 fetch
   - `sticky` 헤더 + 메인 컨텐츠
   - 배경: `bg-muted/30` (밝은 회색)

### Phase 3: 대시보드 섹션 (1시간)
7. **current-week-info.tsx**
   - Card: shadow-sm + hover 효과
   - Calendar 아이콘
   - 주차 번호, 제목, 날짜 범위
   - props: `week`

8. **my-submission-status.tsx**
   - Card: shadow-sm + hover 효과
   - CheckCircle2 / Circle 아이콘
   - 제출 여부, 제출일시
   - 미제출 시 Primary 버튼
   - props: `submission`, `weekId`

9. **all-submissions-status.tsx**
   - Card: 멤버 배지 리스트
   - Badge: 제출(초록) / 미제출(회색)
   - 아이콘: CheckCircle2 / Circle
   - props: `submissions`

10. **recent-summaries.tsx**
    - Card 목록: shadow-sm + hover 효과
    - FileText 아이콘
    - 주차, 날짜, 내용 미리보기 (100자)
    - 빈 상태: 친근한 메시지 + 아이콘
    - props: `summaries`

### Phase 4: 대시보드 페이지 (30분)
11. **dashboard/page.tsx**
    - Server Component
    - 모든 데이터 fetch
    - 섹션 컴포넌트 조립
    - 그리드 레이아웃: `grid grid-cols-1 lg:grid-cols-2 gap-6`

---

## 데이터 페칭 전략

### Server Component 직접 Fetch
```tsx
// dashboard/page.tsx
const supabase = await createClient()

// 1. 현재 사용자
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase
  .from('profiles')
  .select('nickname')
  .eq('id', user.id)
  .single()

// 2. 현재 주차
const { data: currentWeek } = await supabase
  .from('weeks')
  .select('*')
  .eq('is_current', true)
  .maybeSingle()

// 3. 내 제출 현황
const { data: mySubmission } = await supabase
  .from('summaries')
  .select('created_at')
  .eq('week_id', currentWeek.id)
  .eq('author_id', user.id)
  .maybeSingle()

// 4. 전체 제출 현황
const { data: allProfiles } = await supabase
  .from('profiles')
  .select('id, nickname')

const { data: allSubmissions } = await supabase
  .from('summaries')
  .select('author_id')
  .eq('week_id', currentWeek.id)

const submissionsStatus = allProfiles.map(profile => ({
  nickname: profile.nickname,
  has_submitted: allSubmissions.some(s => s.author_id === profile.id)
}))

// 5. 최근 요약본 (JOIN으로 주차 정보 포함)
const { data: recentSummaries } = await supabase
  .from('summaries')
  .select('id, content, created_at, weeks(week_number, title)')
  .eq('author_id', user.id)
  .order('created_at', { ascending: false })
  .limit(5)
```

**장점:**
- Server Component 활용 (SEO 친화적)
- RLS 자동 권한 체크
- 간결함

---

## Middleware 패턴

```tsx
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 보호된 라우트
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 인증된 사용자 auth 페이지 접근 시 대시보드로
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 스타일링 상세

### 헤더
```tsx
<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div className="container flex h-16 items-center">
    {/* 로고 */}
    <div className="mr-8 flex items-center gap-2">
      <span className="text-xl font-bold">Riffle</span>
    </div>

    {/* 네비게이션 */}
    <nav className="flex items-center gap-6 text-sm font-medium">
      <Link href="/dashboard" className="transition-colors hover:text-primary">
        대시보드
      </Link>
      <Link href="/summaries" className="transition-colors hover:text-primary">
        요약본
      </Link>
    </nav>

    {/* 우측 영역 */}
    <div className="ml-auto flex items-center gap-4">
      {/* 현재 주차 배지 */}
      <Badge variant="outline" className="gap-1">
        <Calendar className="h-3 w-3" />
        {week_number}주차
      </Badge>

      {/* 사용자 메뉴 */}
      <UserMenu nickname={nickname} />
    </div>
  </div>
</header>
```

### 메인 컨텐츠
```tsx
<main className="min-h-screen bg-muted/30">
  <div className="container max-w-7xl py-8">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 섹션 컴포넌트들 */}
    </div>
  </div>
</main>
```

### 카드 예시
```tsx
<Card className="shadow-sm hover:shadow-md transition-shadow">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-lg">
      <Calendar className="h-5 w-5 text-primary" />
      현재 주차
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <div className="text-3xl font-bold">{week_number}주차</div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </div>
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Calendar className="h-4 w-4" />
      {formatDateRange(start_date, end_date)}
    </div>
  </CardContent>
</Card>
```

### 배지 예시
```tsx
// 제출 완료
<Badge variant="default" className="gap-1">
  <CheckCircle2 className="h-3 w-3" />
  {nickname}
</Badge>

// 미제출
<Badge variant="secondary" className="gap-1">
  <Circle className="h-3 w-3" />
  {nickname}
</Badge>
```

---

## 리스크 & 대응

### 리스크 1: 현재 주차 없음
**대응:** `.maybeSingle()` 사용 + 빈 상태 UI

```tsx
if (!currentWeek) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">현재 주차가 없어요</h3>
      <p className="text-sm text-muted-foreground">
        관리자에게 문의하세요.
      </p>
    </div>
  )
}
```

### 리스크 2: Middleware 쿠키 동기화
**대응:** 공식 문서 패턴 그대로 사용

### 리스크 3: 전체 제출 현황 쿼리 복잡도
**대응:** 두 쿼리 후 클라이언트 매칭 (멤버 적어서 OK)

### 리스크 4: 최근 요약본에 주차 정보 필요
**대응:** JOIN으로 weeks 테이블 포함

```tsx
.select('*, weeks(week_number, title)')
```

---

## 검증 계획

### 수동 테스트
1. 로그인 → 대시보드 접근 확인
2. 미인증 → `/login` 리다이렉트 확인
3. 현재 주차 정보 표시 확인
4. 제출 현황 정확성 확인
5. 로그아웃 → 리다이렉트 확인
6. **디자인 QA**:
   - 카드 호버 효과 확인
   - 여백과 간격 적절한지 확인
   - 아이콘 렌더링 확인
   - 다크 모드 전환 확인

### E2E 테스트 (추후)
- dashboard.spec.ts 추가
- 헤더 네비게이션 테스트
- 제출 현황 렌더링 테스트

---

## Critical Files

- **src/middleware.ts** - 전체 보안의 기초
- **src/app/(dashboard)/layout.tsx** - 대시보드 공통 구조
- **src/app/(dashboard)/dashboard/page.tsx** - 메인 페이지, 데이터 페칭
- **src/components/dashboard/header.tsx** - 네비게이션 + 사용자 메뉴

---

## 예상 소요 시간
- Phase 1: 30분
- Phase 2: 45분
- Phase 3: 1시간
- Phase 4: 30분
- **총 2시간 45분**
