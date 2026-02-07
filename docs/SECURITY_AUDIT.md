# Riffle 보안 검수 리포트

**검수일:** 2026-02-07
**검수 범위:** 프로젝트 전체 (프론트엔드, 백엔드, 인프라)
**검수 방법:** 3개 전문 에이전트 병렬 투입 (Backend Risk Guard, Code Security Reviewer, Architecture Reviewer)

---

## 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| **Critical** | 5 | 배포 전 필수 수정 |
| **High** | 4 | 가능한 빨리 수정 |
| **Medium** | 6 | 이번 달 내 수정 |
| **Low** | 3 | 개선 권장 |

### 긍정적 평가

- `getUser()` 일관 사용 (`getSession` 대신) — 서버 사이드 토큰 검증
- `FORCE ROW LEVEL SECURITY` 전체 테이블 적용
- Service Role Key 사용이 2곳으로 제한적
- `.gitignore`에 `.env*` 패턴 설정 완료
- `react-markdown`에서 `rehype-raw` 미사용 — XSS 기본 방어
- 프로젝트 전반에서 innerHTML 직접 삽입 미사용
- OAuth callback에서 `requestUrl.origin` 고정 리다이렉트
- cookie 기반 세션 관리가 `@supabase/ssr` 패턴을 올바르게 따름

---

## CRITICAL — 즉시 수정 필수

### C-1. 사용자가 스스로 admin으로 권한 상승 가능

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/004_add_display_name.sql`, `006_add_admin_role.sql` |
| **심각도** | Critical |
| **카테고리** | 권한 상승 (Privilege Escalation) |

**현재 상태:**

```sql
-- 004_add_display_name.sql
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- 006_add_admin_role.sql
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin'));
```

**문제:** `profiles` UPDATE RLS 정책이 `id = auth.uid()`만 확인하고 `role` 컬럼 변경을 제한하지 않음. 아무 인증된 사용자가 자신의 role을 admin으로 변경 가능:

```javascript
supabase.from('profiles').update({ role: 'admin' }).eq('id', myUserId)
```

`is_admin()` 함수에 의존하는 모든 admin RLS 정책(009_add_admin_rls_policies.sql)이 무력화됨. **이 시스템의 가장 치명적인 취약점.**

**수정 방안:** 트리거로 role 변경 차단

```sql
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- admin이 변경하는 경우는 별도 함수(SECURITY DEFINER)로 처리
    RAISE EXCEPTION 'Role cannot be changed directly';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_self_role_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();
```

---

### C-2. 초대 코드 전량 노출 (SELECT USING (true))

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/003_add_invite_code.sql:17-18` |
| **심각도** | Critical |
| **카테고리** | 데이터 유출 (Data Exposure) |

**현재 상태:**

```sql
CREATE POLICY "Anyone can verify invite codes" ON invite_codes
  FOR SELECT USING (true);
```

**문제:** `FOR SELECT USING (true)`는 모든 행을 누구에게나 노출. anon key만 있으면 미사용 활성 코드 포함 전체 초대 코드 목록을 조회 가능. 폐쇄형 가입 시스템의 의미가 사라짐.

**수정 방안:** admin에게만 전체 조회 허용. 코드 검증은 service role로 수행하므로 일반 사용자에게 SELECT 불필요.

```sql
DROP POLICY "Anyone can verify invite codes" ON invite_codes;

-- admin만 조회 가능
CREATE POLICY "Admins can view invite codes" ON invite_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );
```

---

### C-3. 초대 코드 임의 조작 가능 (UPDATE 정책 과도)

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/003_add_invite_code.sql:21-22` |
| **심각도** | Critical |
| **카테고리** | 인가 우회 (Authorization Bypass) |

**현재 상태:**

```sql
CREATE POLICY "Authenticated users can use invite codes" ON invite_codes
  FOR UPDATE USING (auth.uid() IS NOT NULL);
```

**문제:** 인증된 사용자라면 누구나 어떤 초대 코드든 수정 가능. 이미 사용된 코드를 `is_used: false, used_by: null`로 되돌리거나 다른 사용자의 코드를 조작할 수 있음. 하나의 코드를 무한 재활성화하여 무제한 가입 가능.

**수정 방안:** UPDATE 정책 삭제. 코드 사용 처리는 이미 service role로 수행 중이므로 일반 사용자에게 UPDATE 권한 불필요.

```sql
DROP POLICY "Authenticated users can use invite codes" ON invite_codes;
```

---

### C-4. 초대 코드 없이 시즌 직접 가입 가능

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/003_add_invite_code.sql:25-26` |
| **심각도** | Critical |
| **카테고리** | 인가 우회 (Authorization Bypass) |

**현재 상태:**

```sql
CREATE POLICY "Users can join seasons" ON season_members
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

**문제:** `user_id = auth.uid()`만 확인하고 초대 코드 검증이 없음. 클라이언트에서 직접 `supabase.from('season_members').insert(...)` 호출하면 초대 코드 없이 아무 시즌에 가입 가능.

**수정 방안:** INSERT 정책 삭제. 멤버 추가는 service role로 처리.

```sql
DROP POLICY "Users can join seasons" ON season_members;
```

---

### C-5. Admin Server Actions 인가 검사 없음

| 항목 | 내용 |
|------|------|
| **파일** | `src/lib/actions/admin/invite-codes.ts`, `members.ts`, `weeks.ts`, `seasons.ts` |
| **심각도** | Critical |
| **카테고리** | 권한 상승 (Privilege Escalation) |

**현재 상태:** 4개 admin action 파일의 모든 함수에서 `isAdmin()` 검사를 하지 않음. Server Action은 클라이언트에서 직접 호출 가능한 HTTP 엔드포인트.

**영향:** RLS가 현재 차단하지만:
- C-1과 결합하면 완전히 뚫림
- DB 정책 변경 시 즉시 권한 상승 취약점
- 에러 없이 `{ success: true }` 반환할 수 있음 (0행 업데이트)

**수정 방안:** 모든 admin action 시작부에 인증+인가 체크 추가

```typescript
export async function someAdminAction(...) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '로그인이 필요합니다.' }

  const admin = await isAdmin(user.id)
  if (!admin) return { success: false, error: '권한이 없습니다.' }

  // ... 이후 로직
}
```

**수정 필요한 함수 목록:**
- `createInviteCodeAction`
- `deleteInviteCodeAction`
- `updateMemberRoleAction`
- `toggleWeekCurrentAction`
- `updateWeekAction`
- `createSeasonAction`
- `updateSeasonAction`
- `toggleSeasonActiveAction`
- `addSeasonMembersAction`
- `removeSeasonMemberAction`

---

## 연계 공격 시나리오 (C-1 + C-2 + C-3 + C-4 + C-5)

```
1. 공격자가 정상적으로 초대 코드 사용하여 가입
2. anon key로 invite_codes 전량 조회 (C-2)
3. 미사용 코드로 추가 계정 생성 또는 사용 코드 재활성화 (C-3)
4. 또는 season_members에 직접 INSERT로 초대 코드 우회 (C-4)
5. profiles.role을 'admin'으로 변경하여 권한 상승 (C-1)
6. admin Server Action 자유롭게 호출 (C-5)

→ 폐쇄형 시스템의 모든 보안 계층이 무력화됨
```

---

## HIGH — 빠른 조치 필요

### H-1. 보안 헤더 전무

| 항목 | 내용 |
|------|------|
| **파일** | `next.config.ts` |
| **심각도** | High |
| **카테고리** | 헤더 보안 (Security Headers) |

**현재 상태:** `next.config.ts`에 보안 헤더 설정이 전혀 없음.

**누락된 헤더:**
- `X-Frame-Options: DENY` — clickjacking 방지
- `X-Content-Type-Options: nosniff` — MIME 타입 스니핑 방지
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` — XSS 방지
- `Strict-Transport-Security` — HTTPS 강제
- `Permissions-Policy` — 불필요한 브라우저 기능 차단

**수정 방안:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

---

### H-2. Middleware 보호 범위 불완전

| 항목 | 내용 |
|------|------|
| **파일** | `src/proxy.ts:38-42` |
| **심각도** | High |
| **카테고리** | 인증 (Authentication) |

**현재 상태:**

```typescript
// proxy.ts
if (request.nextUrl.pathname.startsWith('/dashboard')) {
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

**문제:** `/dashboard`만 보호. `/mine/*`, `/summaries/*`, `/admin/*` 경로가 middleware에서 미보호. Server Component에서 개별 보호하고 있어 즉각적 데이터 유출은 없지만, 방어 심층(Defense in Depth) 원칙 위반.

**수정 방안:**

```typescript
const protectedPaths = ['/dashboard', '/mine', '/summaries', '/admin']
if (protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

---

### H-3. 초대 코드 Race Condition

| 항목 | 내용 |
|------|------|
| **파일** | `src/actions/auth.ts:41-76`, `src/app/auth/callback/route.ts:63-84` |
| **심각도** | High |
| **카테고리** | 동시성 (Concurrency) |

**현재 상태:** 초대 코드 검증(1단계) → 회원가입(2단계) → 코드 사용 처리(3단계) 사이에 시간 갭 존재. 두 명이 동시에 같은 코드로 가입하면 둘 다 성공.

현재 optimistic locking(`eq('is_used', false)`)을 시도하지만, 실패 시 계정이 이미 생성된 상태에서 로그만 남기고 진행.

**수정 방안:** PostgreSQL Function으로 원자적 처리

```sql
CREATE OR REPLACE FUNCTION public.acquire_invite_code(
  code_input TEXT,
  user_id_input UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record RECORD;
BEGIN
  SELECT * INTO code_record
  FROM invite_codes
  WHERE code = UPPER(code_input)
    AND is_used = false
  FOR UPDATE;  -- 행 잠금으로 race condition 방지

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE invite_codes
  SET is_used = true,
      used_by = user_id_input,
      used_at = NOW()
  WHERE id = code_record.id;

  RETURN true;
END;
$$;
```

---

### H-4. Open Redirect 취약점

| 항목 | 내용 |
|------|------|
| **파일** | `src/app/auth/callback/route.ts:7,13` |
| **심각도** | High |
| **카테고리** | 리다이렉트 (Open Redirect) |

**현재 상태:**

```typescript
const next = searchParams.get("next") ?? "/"
return NextResponse.redirect(`${origin}${next}`)
```

**문제:** `next` 파라미터 검증 없음. `next=//evil.com` → `https://evil.com`으로 리다이렉트. 피싱 공격 진입점.

**수정 방안:**

```typescript
const next = searchParams.get("next") ?? "/"
// 상대 경로만 허용, 프로토콜 상대 URL 차단
const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/'
return NextResponse.redirect(`${origin}${safePath}`)
```

---

## MEDIUM

### M-1. signUp 에러 메시지 직접 노출

| 항목 | 내용 |
|------|------|
| **파일** | `src/actions/auth.ts:96` |
| **심각도** | Medium |

```typescript
if (signUpError) {
  return { error: signUpError.message } // "User already registered" 등
}
```

Supabase 에러 메시지를 그대로 반환하여 이메일 열거 공격(email enumeration)에 이용 가능. 일반화된 메시지로 교체 권장.

---

### M-2. Rate Limiting 부재

| 항목 | 내용 |
|------|------|
| **파일** | 전체 Server Actions |
| **심각도** | Medium |

로그인, 회원가입, 초대 코드 검증에 rate limiting이 없음. Supabase Auth 기본 rate limiting은 있지만 앱 레벨 제한 없음.

---

### M-3. 외부 CDN 스크립트 SRI 미적용

| 항목 | 내용 |
|------|------|
| **파일** | `src/app/(dashboard)/layout.tsx:66-69` |
| **심각도** | Medium |

```typescript
<Script
  src="https://cdn.sori.life/widget.js"
  data-project-id="cml769a4xOAUXRQwhpic"
  strategy="afterInteractive"
/>
```

외부 CDN에서 서드파티 스크립트를 로드. SRI(Subresource Integrity) 미적용으로 CDN 해킹 시 모든 인증된 사용자 세션 위험.

---

### M-4. 에러 메시지에 DB 정보 노출

| 항목 | 내용 |
|------|------|
| **파일** | `src/app/error.tsx:14`, `src/lib/actions/admin/*.ts` |
| **심각도** | Medium |

```typescript
// error.tsx
<p>{error.message}</p>

// admin actions
if (error) throw error  // Supabase 에러를 그대로 throw
```

Supabase 에러에 테이블명, 컬럼명, 제약조건 등 DB 스키마 정보 포함 가능.

---

### M-5. 비밀번호 정책 미흡

| 항목 | 내용 |
|------|------|
| **파일** | `src/schemas/auth.ts:6` |
| **심각도** | Medium |

```typescript
password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다.")
```

6자 최소 길이는 현대 보안 기준에서 부족. 최소 8자 + 복잡도 요구 권장.

---

### M-6. 초대 코드 생성 count 상한 없음

| 항목 | 내용 |
|------|------|
| **파일** | `src/lib/actions/admin/invite-codes.ts:10` |
| **심각도** | Medium |

```typescript
export async function createInviteCodeAction(count: number = 1) {
  const codes = Array.from({ length: count }, () => ({...}))
```

count에 상한 없음. 관리자 계정 탈취 시 대량 생성 가능. 합리적인 상한(예: 50) 추가 권장.

---

## LOW

### L-1. 클라이언트 콘솔에 에러 정보 노출

| 항목 | 내용 |
|------|------|
| **파일** | 여러 클라이언트 컴포넌트 |
| **심각도** | Low |

`console.error`로 Supabase 에러 객체가 브라우저 콘솔에 그대로 출력됨.

### L-2. signout route CSRF 토큰 없음

| 항목 | 내용 |
|------|------|
| **파일** | `src/app/auth/signout/route.ts` |
| **심각도** | Low |

POST만 처리하여 기본적으로 안전하지만, CSRF 토큰이 없음. 로그아웃이므로 실질 피해 제한적.

### L-3. N+1 쿼리 (간접적 보안 영향)

| 항목 | 내용 |
|------|------|
| **파일** | `src/app/admin/invite-codes/page.tsx:16-45` |
| **심각도** | Low |

각 초대 코드마다 2개의 추가 쿼리 발생 (100개 코드 → 201개 쿼리). DoS 공격 시 DB 부하 증폭.

---

## RLS 정책 현황표

| 테이블 | RLS | FORCE | SELECT | INSERT | UPDATE | DELETE | 비고 |
|--------|-----|-------|--------|--------|--------|--------|------|
| profiles | O | O | authenticated | trigger | 본인(+admin) | - | **role 변경 방지 필요** |
| invite_codes | O | O | **USING(true)** | admin | **auth 전체** | admin | **SELECT/UPDATE 수정 필요** |
| seasons | O | O | authenticated | admin | admin | admin | 양호 |
| season_members | O | O | authenticated | **auth.uid()** | - | admin | **INSERT 삭제 필요** |
| weeks | O | O | authenticated | admin | admin | admin | 양호 |
| summaries | O | O | authenticated | 본인+멤버/admin | 본인+멤버/admin | 본인+멤버/admin | 양호 |

---

## 수정 우선순위

### 1순위 — 오늘 당장 (예상 2시간)

| ID | 작업 | 예상 시간 |
|----|------|-----------|
| C-1 | `profiles` role 변경 방지 트리거 추가 | 15분 |
| C-2 | `invite_codes` SELECT 정책 수정 (admin만) | 15분 |
| C-3 | `invite_codes` UPDATE 정책 삭제 | 10분 |
| C-4 | `season_members` INSERT 정책 삭제 | 10분 |
| C-5 | admin Server Actions에 isAdmin() 체크 추가 (10개 함수) | 1시간 |

### 2순위 — 이번 주 (예상 4시간)

| ID | 작업 | 예상 시간 |
|----|------|-----------|
| H-1 | `next.config.ts` 보안 헤더 추가 | 30분 |
| H-2 | middleware 보호 범위 확대 | 30분 |
| H-3 | 초대 코드 원자적 처리 (DB Function) | 2시간 |
| H-4 | auth callback `next` 파라미터 검증 | 30분 |

### 3순위 — 이번 달 (예상 3시간)

| ID | 작업 | 예상 시간 |
|----|------|-----------|
| M-1 | signUp 에러 메시지 일반화 | 15분 |
| M-2 | Rate limiting 검토 | 1시간 |
| M-3 | 외부 스크립트 SRI 적용 | 30분 |
| M-4 | 에러 메시지 sanitization | 30분 |
| M-5 | 비밀번호 정책 강화 | 15분 |
| M-6 | 초대 코드 count 상한 추가 | 15분 |

---

## 검증 체크리스트

수정 후 반드시 확인할 항목:

```
[ ] profiles.role 직접 업데이트 시도 -> 에러 발생하는지
[ ] anon key로 invite_codes 조회 시도 -> 차단되는지
[ ] 인증된 사용자가 invite_codes UPDATE 시도 -> 차단되는지
[ ] season_members 직접 INSERT 시도 -> 차단되는지
[ ] 일반 사용자가 admin action 호출 -> 권한 에러 반환되는지
[ ] 보안 헤더가 응답에 포함되는지 (curl -I)
[ ] /admin 경로 비인가 접근 -> 리다이렉트되는지
[ ] auth callback next=//evil.com -> / 로 리다이렉트되는지
[ ] 동시 초대 코드 사용 -> 1건만 성공하는지
```

---

## 참고

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10 (2025)](https://owasp.org/www-project-top-ten/)
