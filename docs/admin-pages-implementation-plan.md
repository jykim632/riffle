# 관리자 페이지 구현 계획

## 요약
관리자용 시즌/주차/멤버/초대코드 관리 페이지 구현. 사이드바 네비게이션, 시즌 생성 시 주차 자동 생성.

## URL 구조
```
/admin (관리자 대시보드 - 시즌 목록으로 리다이렉트)
├── /admin/seasons          # 시즌 관리 (우선순위 1)
├── /admin/weeks            # 주차 관리
├── /admin/members          # 멤버 관리
└── /admin/invite-codes     # 초대 코드 관리
```

---

## 레이아웃 (사이드바)

### 파일 구조
```
src/app/
└── (admin)/
    ├── layout.tsx           # 관리자 레이아웃 (사이드바 + 권한 체크)
    ├── page.tsx             # /admin → /admin/seasons 리다이렉트
    ├── seasons/
    │   └── page.tsx         # 시즌 목록 + 생성
    ├── weeks/
    │   └── page.tsx         # 주차 목록 + 생성
    ├── members/
    │   └── page.tsx         # 멤버 목록 + 역할 변경
    └── invite-codes/
        └── page.tsx         # 초대 코드 생성 + 목록
```

### 사이드바 컴포넌트
**파일**: `src/components/admin/sidebar.tsx`

```tsx
export function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30">
      <nav>
        <SidebarLink href="/admin/seasons" icon={Calendar}>
          시즌 관리
        </SidebarLink>
        <SidebarLink href="/admin/weeks" icon={List}>
          주차 관리
        </SidebarLink>
        <SidebarLink href="/admin/members" icon={Users}>
          멤버 관리
        </SidebarLink>
        <SidebarLink href="/admin/invite-codes" icon={Key}>
          초대 코드
        </SidebarLink>
      </nav>
    </aside>
  )
}
```

### 관리자 레이아웃
**파일**: `src/app/(admin)/layout.tsx`

```tsx
import { isAdmin } from '@/lib/utils/season-membership'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 관리자 권한 확인
  const admin = await isAdmin(user.id)
  if (!admin) {
    // 404 또는 접근 차단 페이지
    notFound()
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
```

---

## 1. 시즌 관리 (우선순위 1)

### 기능
- ✅ 시즌 목록 (전체 시즌, 활성 시즌 표시)
- ✅ 시즌 생성 (이름, 시작일, 종료일, 주차 자동 생성)
- ✅ 시즌 수정 (기간 변경, 이름 변경)
- ✅ 시즌 활성화/비활성화 (한 번에 하나만 활성)
- ✅ 시즌 멤버 관리 (추가/제거)

### 시즌 생성 로직

**자동 주차 생성**:
- 시작일~종료일 범위를 주 단위로 나눔
- 예: 2026-01-06 ~ 2026-04-05 (13주)
- 각 주차 자동 생성:
  - week_number: 1, 2, 3, ...
  - title: "1주차", "2주차", ... (또는 날짜 범위)
  - start_date: 월요일
  - end_date: 일요일
  - is_current: 첫 주차만 true

**Server Action**: `createSeasonAction()`
```tsx
'use server'

export async function createSeasonAction(data: {
  name: string
  start_date: string
  end_date: string
}) {
  // 1. 시즌 생성
  const seasonId = seasonId() // nanoid(8)
  await supabase.from('seasons').insert({
    id: seasonId,
    name: data.name,
    start_date: data.start_date,
    end_date: data.end_date,
    is_active: false, // 생성 시 비활성
  })

  // 2. 주차 자동 생성
  const weeks = generateWeeks(data.start_date, data.end_date, seasonId)
  await supabase.from('weeks').insert(weeks)

  return { success: true, seasonId }
}

function generateWeeks(startDate: string, endDate: string, seasonId: string) {
  // 시작일~종료일을 주 단위로 나눔
  // 각 주차 객체 생성 { id: weekId(), season_id, week_number, ... }
}
```

### 시즌 활성화 로직
- 기존 활성 시즌을 비활성화 (is_active = false)
- 선택한 시즌을 활성화 (is_active = true)
- DB 제약조건으로 한 번에 하나만 활성 보장

### 시즌 멤버 관리
- 전체 사용자 목록 표시 (체크박스)
- 체크된 사용자를 season_members에 추가
- 체크 해제 시 season_members에서 제거

---

## 2. 주차 관리

### 기능
- ✅ 현재 시즌의 주차 목록
- ✅ 주차 생성 (수동 추가, 시즌 선택)
- ✅ 주차 수정 (제목, 기간)
- ✅ 현재 주차 설정 (is_current 토글)

### 현재 주차 설정
- 기존 is_current = true를 false로
- 선택한 주차를 is_current = true로
- DB 제약조건으로 하나만 보장

---

## 3. 멤버 관리

### 기능
- ✅ 전체 사용자 목록 (닉네임, 이메일, 역할, 가입일)
- ✅ 역할 변경 (admin ↔ member)
- ✅ 시즌 소속 정보 표시
- ✅ 검색/필터

### 역할 변경
```tsx
'use server'

export async function updateUserRoleAction(userId: string, role: 'admin' | 'member') {
  await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  return { success: true }
}
```

---

## 4. 초대 코드 관리

### 기능
- ✅ 초대 코드 생성 (nanoid 8자)
- ✅ 초대 코드 목록 (코드, 생성자, 사용 여부, 사용자, 생성일)
- ✅ 통계 (총 생성/사용/미사용)
- ✅ 사용된 코드는 비활성화 표시

### 초대 코드 생성
```tsx
'use server'

export async function createInviteCodeAction() {
  const code = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8)()

  await supabase.from('invite_codes').insert({
    code,
    created_by: userId, // 현재 사용자
    is_used: false,
  })

  return { success: true, code }
}
```

---

## 데이터베이스 변경 사항

### 필요한 마이그레이션
없음 (기존 스키마로 충분)

### RLS 정책 확인
- `seasons`: 관리자만 INSERT/UPDATE/DELETE
- `season_members`: 관리자만 INSERT/DELETE (이미 구현됨)
- `weeks`: 관리자만 INSERT/UPDATE/DELETE
- `invite_codes`: 관리자만 INSERT (이미 구현됨)
- `profiles`: 관리자만 role UPDATE

**추가 필요 RLS**:
```sql
-- seasons 테이블 관리자 정책
CREATE POLICY "관리자만 시즌 생성"
  ON public.seasons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 시즌 수정"
  ON public.seasons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- weeks 테이블 관리자 정책
CREATE POLICY "관리자만 주차 생성"
  ON public.weeks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 주차 수정"
  ON public.weeks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- profiles 테이블 관리자 정책
CREATE POLICY "관리자만 역할 변경"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
```

---

## 구현 순서

### Phase 1: 레이아웃 & 시즌 관리
1. ✅ 관리자 레이아웃 생성 (`(admin)/layout.tsx`)
2. ✅ 사이드바 컴포넌트 (`AdminSidebar`)
3. ✅ 시즌 목록 페이지 (`/admin/seasons`)
4. ✅ 시즌 생성 폼 + Server Action
5. ✅ 주차 자동 생성 로직
6. ✅ 시즌 활성화 기능
7. ✅ 시즌 멤버 관리 UI
8. ✅ RLS 정책 추가 (마이그레이션)

### Phase 2: 주차 관리
1. ✅ 주차 목록 페이지 (`/admin/weeks`)
2. ✅ 주차 생성/수정 폼
3. ✅ 현재 주차 설정 기능

### Phase 3: 멤버 관리
1. ✅ 멤버 목록 페이지 (`/admin/members`)
2. ✅ 역할 변경 기능
3. ✅ 시즌 소속 정보 표시

### Phase 4: 초대 코드 관리
1. ✅ 초대 코드 생성 페이지 (`/admin/invite-codes`)
2. ✅ 초대 코드 목록 + 통계
3. ✅ 초대 코드 생성 Action

---

## UI 컴포넌트

### 공통 컴포넌트
1. `AdminSidebar` - 사이드바 네비게이션
2. `AdminPageHeader` - 페이지 헤더 (제목 + 액션 버튼)
3. `EmptyState` - 빈 상태 표시

### 시즌 관리 컴포넌트
1. `SeasonList` - 시즌 목록 테이블
2. `SeasonCreateDialog` - 시즌 생성 다이얼로그
3. `SeasonMembersDialog` - 시즌 멤버 관리 다이얼로그

### 주차 관리 컴포넌트
1. `WeekList` - 주차 목록 테이블
2. `WeekCreateDialog` - 주차 생성 다이얼로그

### 멤버 관리 컴포넌트
1. `MemberList` - 멤버 목록 테이블
2. `RoleToggle` - 역할 변경 토글

### 초대 코드 컴포넌트
1. `InviteCodeList` - 초대 코드 목록 테이블
2. `InviteCodeStats` - 통계 카드

---

## Critical Files

### 신규 생성
1. `src/app/(admin)/layout.tsx` - 관리자 레이아웃
2. `src/app/(admin)/page.tsx` - 리다이렉트
3. `src/app/(admin)/seasons/page.tsx` - 시즌 관리
4. `src/app/(admin)/weeks/page.tsx` - 주차 관리
5. `src/app/(admin)/members/page.tsx` - 멤버 관리
6. `src/app/(admin)/invite-codes/page.tsx` - 초대 코드 관리
7. `src/components/admin/sidebar.tsx` - 사이드바
8. `src/lib/actions/admin/seasons.ts` - 시즌 Server Actions
9. `src/lib/actions/admin/weeks.ts` - 주차 Server Actions
10. `src/lib/actions/admin/members.ts` - 멤버 Server Actions
11. `src/lib/actions/admin/invite-codes.ts` - 초대 코드 Server Actions
12. `src/lib/utils/week-generator.ts` - 주차 자동 생성 유틸리티
13. `supabase/migrations/007_admin_rls_policies.sql` - 관리자 RLS 정책

---

## 트레이드오프

### 사이드바 vs 탭
- **선택**: 사이드바
- **장점**: 확장성, 명확한 구조, 네비게이션 용이
- **단점**: 공간 차지

### 주차 자동 생성 vs 수동 생성
- **선택**: 자동 생성 (수동 추가도 가능)
- **장점**: 편의성, 일관성
- **단점**: 유연성 감소 (필요 시 수동 추가/수정으로 보완)

### Dialog vs Page
- **선택**: Dialog (생성/수정)
- **장점**: UX 개선, 컨텍스트 유지
- **단점**: 복잡한 폼은 별도 페이지 필요

---

## 의존성

**선행 작업**:
- ✅ seasons, season_members 테이블
- ✅ isAdmin() 유틸리티
- ✅ nanoid 라이브러리

**후속 작업**:
- ⬜ 시즌 전환 자동화 (pg_cron)
- ⬜ 알림 시스템 (시즌 시작/종료)
