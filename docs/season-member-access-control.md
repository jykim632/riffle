# 시즌 멤버 접근 제어

## 요약
현재 시즌 멤버가 아닌 사용자의 접근을 페이지별로 차별화하여 제어한다.

## 요구사항
- ✅ 로그인한 사용자 중 현재 시즌 멤버가 아닌 경우 처리
- ✅ 과거 시즌 멤버는 자신의 히스토리를 볼 수 있어야 함
- ✅ 현재 시즌 제출/수정은 차단
- ✅ 명확한 UX 메시지 제공

## 시나리오

### 사용자 유형
1. **현재 시즌 멤버**: 모든 기능 사용 가능
2. **과거 시즌 멤버**: 읽기만 가능, 제출 불가
3. **비멤버**: 읽기만 가능, 제출 불가
4. **관리자**: 항상 모든 기능 사용 가능

---

## 접근 제어 정책

### ✅ 허용 (읽기 전용)
| 페이지 | 접근 | 제한사항 |
|--------|------|----------|
| `/dashboard` | ✅ 허용 | 경고 배너 표시 |
| `/summaries` | ✅ 허용 | 게시판 읽기만 가능 |
| `/mine` | ✅ 허용 | 내 과거 제출 이력 조회 |
| `/mine/[id]` | ✅ 허용 | 과거 시즌 요약본 조회 |

### ❌ 차단 (제출/수정)
| 페이지 | 접근 | 대체 UI |
|--------|------|---------|
| `/summaries/new` | ❌ 차단 | "시즌 참여 필요" 페이지 |
| `/mine/[id]/edit` | ⚠️ 조건부 | 현재 시즌 요약본만 차단 |
| `/summaries/[id]/edit` | ⚠️ 조건부 | 현재 시즌 요약본만 차단 |

---

## 구현 방법

### 1. 멤버십 확인 유틸리티

**파일**: `src/lib/utils/season-membership.ts` (신규)

```typescript
import { createClient } from '@/lib/supabase/server'

/**
 * 현재 시즌의 멤버인지 확인
 */
export async function isCurrentSeasonMember(userId: string): Promise<boolean> {
  const supabase = await createClient()

  // 현재 활성 시즌 조회
  const { data: currentSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  if (!currentSeason) return false

  // 멤버십 확인
  const { data: membership } = await supabase
    .from('season_members')
    .select('id')
    .eq('season_id', currentSeason.id)
    .eq('user_id', userId)
    .maybeSingle()

  return !!membership
}

/**
 * 특정 시즌의 멤버인지 확인
 */
export async function isSeasonMember(
  userId: string,
  seasonId: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data: membership } = await supabase
    .from('season_members')
    .select('id')
    .eq('season_id', seasonId)
    .eq('user_id', userId)
    .maybeSingle()

  return !!membership
}

/**
 * 관리자인지 확인
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  return profile?.role === 'admin'
}
```

---

### 2. 제출 페이지 차단

**파일**: `src/app/(dashboard)/summaries/new/page.tsx`

```typescript
export default async function NewSummaryPage() {
  const supabase = await createClient()

  // 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 관리자는 항상 허용
  const admin = await isAdmin(user.id)

  // 현재 시즌 멤버 확인
  const member = await isCurrentSeasonMember(user.id)

  if (!admin && !member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">시즌 참여 필요</h1>
          <p className="mt-2 text-muted-foreground">
            현재 시즌에 참여하지 않았습니다.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            시즌에 참여하려면 관리자에게 문의하세요.
          </p>
          <div className="mt-6 flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/dashboard">대시보드로</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 기존 로직 계속...
}
```

---

### 3. 수정 페이지 조건부 차단

**파일**: `src/app/(dashboard)/mine/[id]/edit/page.tsx`

```typescript
export default async function EditMySummaryPage(props: { params: Promise<Params> }) {
  const params = await props.params
  const supabase = await createClient()

  // 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 요약본 조회 (시즌 정보 포함)
  const { data: summary } = await supabase
    .from('summaries')
    .select(`
      *,
      weeks!inner(season_id)
    `)
    .eq('id', params.id)
    .single()

  if (!summary) notFound()
  if (summary.author_id !== user.id) redirect(`/mine/${params.id}`)

  // 관리자는 항상 허용
  const admin = await isAdmin(user.id)

  // 해당 시즌의 멤버인지 확인
  const weekSeasonId = summary.weeks.season_id
  const member = await isSeasonMember(user.id, weekSeasonId)

  if (!admin && !member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-2xl font-bold">수정 권한 없음</h1>
          <p className="mt-2 text-muted-foreground">
            해당 시즌의 참여자만 수정할 수 있습니다.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline">
              <Link href={`/mine/${params.id}`}>요약본 보기</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 기존 로직 계속...
}
```

---

### 4. 대시보드 경고 배너

**파일**: `src/app/(dashboard)/dashboard/page.tsx`

```typescript
export default async function DashboardPage() {
  const supabase = await createClient()

  // 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 멤버십 확인
  const member = await isCurrentSeasonMember(user.id)
  const admin = await isAdmin(user.id)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* 비멤버 경고 배너 */}
      {!admin && !member && (
        <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle>시즌 참여자가 아닙니다</AlertTitle>
          <AlertDescription>
            현재 시즌에 참여하지 않았습니다. 요약본을 제출하려면 관리자에게 문의하세요.
          </AlertDescription>
        </Alert>
      )}

      {/* 기존 대시보드 콘텐츠 */}
    </div>
  )
}
```

---

### 5. 제출 버튼 조건부 렌더링

**파일**: `src/components/dashboard/week-overview.tsx`

```typescript
interface WeekOverviewProps {
  week: Week
  mySubmission: Summary | null
  isCurrentSeasonMember: boolean  // 추가
}

export function WeekOverview({
  week,
  mySubmission,
  isCurrentSeasonMember
}: WeekOverviewProps) {
  return (
    <Card>
      {/* ... 기존 내용 ... */}

      {/* 제출 버튼 */}
      {!mySubmission && (
        <>
          {isCurrentSeasonMember ? (
            <Button asChild>
              <Link href="/summaries/new">
                <Pencil className="mr-2 h-4 w-4" />
                요약본 작성하기
              </Link>
            </Button>
          ) : (
            <Button disabled>
              <Lock className="mr-2 h-4 w-4" />
              시즌 참여자만 제출 가능
            </Button>
          )}
        </>
      )}
    </Card>
  )
}
```

---

## RLS 정책 추가

DB 레벨에서도 보안 강화:

```sql
-- season_members: 관리자만 INSERT/DELETE 가능
CREATE POLICY "관리자만 멤버 추가"
  ON public.season_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

CREATE POLICY "관리자만 멤버 제거"
  ON public.season_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- summaries: 현재 시즌 멤버만 작성 가능
CREATE OR REPLACE POLICY "요약본 작성"
  ON public.summaries FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND
    (
      -- 관리자는 항상 허용
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
      )
      OR
      -- 해당 주차의 시즌 멤버만 허용
      EXISTS (
        SELECT 1 FROM public.season_members sm
        JOIN public.weeks w ON sm.season_id = w.season_id
        WHERE sm.user_id = (SELECT auth.uid())
        AND w.id = week_id
      )
    )
  );

-- summaries: 해당 시즌 멤버만 수정 가능
CREATE OR REPLACE POLICY "요약본 수정"
  ON public.summaries FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = author_id
    AND
    (
      -- 관리자는 항상 허용
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid())
        AND role = 'admin'
      )
      OR
      -- 해당 주차의 시즌 멤버만 허용
      EXISTS (
        SELECT 1 FROM public.season_members sm
        JOIN public.weeks w ON sm.season_id = w.season_id
        WHERE sm.user_id = (SELECT auth.uid())
        AND w.id = week_id
      )
    )
  );
```

---

## 검증 방법

### 1. 테스트 시나리오

**시나리오 A: 현재 시즌 멤버**
- [ ] 대시보드 접근 → 경고 없음
- [ ] `/summaries/new` 접근 → 정상 작성 가능
- [ ] 자신의 요약본 수정 → 정상 수정 가능

**시나리오 B: 과거 시즌 멤버**
- [ ] 대시보드 접근 → 경고 배너 표시
- [ ] `/summaries/new` 접근 → "시즌 참여 필요" 페이지
- [ ] `/mine` 접근 → 과거 제출 이력 조회 가능
- [ ] 과거 시즌 요약본 조회 → 가능
- [ ] 과거 시즌 요약본 수정 → "수정 권한 없음" 페이지

**시나리오 C: 비멤버**
- [ ] 대시보드 접근 → 경고 배너 표시
- [ ] `/summaries/new` 접근 → "시즌 참여 필요" 페이지
- [ ] 게시판 읽기 → 가능

**시나리오 D: 관리자**
- [ ] 모든 페이지 접근 → 제한 없음
- [ ] 모든 요약본 수정 → 가능

### 2. RLS 테스트

```sql
-- 비멤버가 현재 시즌 주차에 제출 시도
-- 예상: 실패
INSERT INTO public.summaries (week_id, author_id, content)
VALUES ('current_week_id', 'non_member_user_id', 'test content');

-- 과거 시즌 멤버가 과거 시즌 주차 수정 시도
-- 예상: 실패
UPDATE public.summaries
SET content = 'updated'
WHERE id = 'old_summary_id'
AND author_id = 'past_member_user_id';
```

---

## UI 컴포넌트

### NonMemberAlert

**파일**: `src/components/season/non-member-alert.tsx` (신규)

```typescript
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function NonMemberAlert() {
  return (
    <Alert className="border-yellow-500/50 bg-yellow-500/10">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle>시즌 참여자가 아닙니다</AlertTitle>
      <AlertDescription>
        현재 시즌에 참여하지 않았습니다. 요약본을 제출하려면 관리자에게 문의하세요.
      </AlertDescription>
    </Alert>
  )
}
```

### AccessDeniedPage

**파일**: `src/components/season/access-denied-page.tsx` (신규)

```typescript
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AccessDeniedPageProps {
  title: string
  message: string
  backHref?: string
  backLabel?: string
}

export function AccessDeniedPage({
  title,
  message,
  backHref = '/dashboard',
  backLabel = '대시보드로',
}: AccessDeniedPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{message}</p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

---

## Critical Files

### 신규 생성
1. `src/lib/utils/season-membership.ts` - 멤버십 확인 유틸리티
2. `src/components/season/non-member-alert.tsx` - 경고 배너
3. `src/components/season/access-denied-page.tsx` - 접근 차단 페이지

### 수정 필요
1. `src/app/(dashboard)/summaries/new/page.tsx` - 제출 페이지 차단
2. `src/app/(dashboard)/mine/[id]/edit/page.tsx` - 수정 페이지 조건부 차단
3. `src/app/(dashboard)/summaries/[id]/edit/page.tsx` - 수정 페이지 조건부 차단
4. `src/app/(dashboard)/dashboard/page.tsx` - 경고 배너 표시
5. `src/components/dashboard/week-overview.tsx` - 제출 버튼 조건부 렌더링
6. `supabase/schema.sql` - RLS 정책 추가/수정

---

## 트레이드오프

### 페이지 차단 vs UI 비활성화
- **선택**: 페이지 차단 + 명확한 메시지
- **장점**: 보안 명확, UX 명확
- **단점**: 코드 중복 (각 페이지에서 체크)

### Server Component vs Middleware
- **선택**: Server Component에서 체크
- **장점**: 페이지별 세밀한 제어
- **단점**: Middleware보다 느림 (각 페이지마다 DB 조회)

### DB RLS vs 애플리케이션 레벨
- **선택**: 둘 다 구현
- **이유**: 심층 방어 (Defense in Depth)
- DB 레벨: 마지막 보안 라인
- 애플리케이션: UX 개선

---

## 의존성

**선행 작업**:
- ✅ seasons 테이블 구현
- ✅ season_members 테이블 구현
- ✅ profiles.role 컬럼 (이미 존재)

**후속 작업**:
- ⬜ 관리자 UI (시즌 멤버 관리)
- ⬜ 멤버 초대 시스템
