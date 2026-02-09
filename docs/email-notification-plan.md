# 이메일 알림 기능 구현 계획

## 배경

멤버가 요약본을 제출하면 같은 시즌 멤버들에게 알림을 보내고 싶음. 카카오톡 오픈채팅방은 봇/웹훅 API가 없어서 이메일 알림으로 결정.

## 핵심 결정사항

| 항목 | 결정 | 이유 |
|------|------|------|
| 이메일 서비스 | Resend | 도메인 인증만으로 바로 발송 가능 (SES sandbox 불필요), SDK 가벼움, SMTP/API 동일 API Key |
| 기본값 | 꺼짐 (opt-in) | 스팸 느낌 방지, 원하는 사람만 켜도록 |
| 알림 대상 | 같은 시즌 멤버 전원 | 제출자 본인 제외, 알림 켠 사람만 |
| 발송 시점 | `createSummary()` 성공 후 | redirect 전에 동기 호출, 실패해도 제출은 성공 |
| UI | 유저 메뉴 드롭다운 내 토글 | 별도 설정 페이지 불필요 |

### 전제조건

- Resend 도메인 인증 완료 (riffles.cloud)
- Supabase custom SMTP에 Resend SMTP 설정 완료

---

## 아키텍처

```
[멤버 제출] → createSummary()
                ├─ summaries 테이블 INSERT
                ├─ sendSummaryNotification() ← try-catch (실패해도 무시)
                │   ├─ week 정보 조회
                │   ├─ 같은 시즌 멤버 중 email_enabled=true 조회
                │   ├─ service_role로 auth.users에서 이메일 조회
                │   └─ Resend API로 개별 발송
                └─ redirect(/mine/{id})
```

---

## 구현 단계

### 1. DB 마이그레이션

**파일**: `supabase/migrations/013_notification_preferences.sql`

```sql
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences FORCE ROW LEVEL SECURITY;

CREATE POLICY "본인 알림설정 조회"
  ON public.notification_preferences FOR SELECT
  TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "본인 알림설정 수정"
  ON public.notification_preferences FOR UPDATE
  TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "본인 알림설정 생성"
  ON public.notification_preferences FOR INSERT
  TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
```

### 2. Resend 클라이언트 (완료)

- `pnpm add resend` ✅
- `.env.example`에 추가 ✅:
  ```
  # Resend
  RESEND_API_KEY=your_resend_api_key
  RESEND_FROM_EMAIL=noreply@your-domain.com
  ```
- `src/lib/email/resend.ts` ✅:
  ```typescript
  import { Resend } from 'resend'

  export const resend = new Resend(process.env.RESEND_API_KEY)
  export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@riffles.cloud'
  ```

### 3. 알림 발송 로직

**파일**: `src/lib/email/send-summary-notification.ts`

1. week 정보 조회 (week_number, title, season_id)
2. `season_members` JOIN `notification_preferences`로 알림 대상 필터링
3. `service_role` 클라이언트로 `auth.users`에서 이메일 주소 조회
4. Resend API로 개별 이메일 발송
5. 에러 시 Sentry 리포트, 사용자 흐름 차단하지 않음

```typescript
import { resend, FROM_EMAIL } from './resend'

await resend.emails.send({
  from: `Riffle <${FROM_EMAIL}>`,
  to: recipientEmail,
  subject: `[Riffle] ${nickname}님이 ${weekNumber}주차 요약을 제출했습니다`,
  html: htmlContent,
})
```

### 4. createSummary 수정

**파일**: `src/actions/summaries.ts`

insert 성공 → `sendSummaryNotification()` 호출 (try-catch) → redirect

### 5. 타입 업데이트

**파일**: `src/lib/types/database.ts`에 `notification_preferences` 테이블 타입 추가

### 6. 알림 설정 Server Action

**파일**: `src/actions/notifications.ts`

- `getNotificationPreference()` - 현재 사용자 알림 설정 조회
- `toggleEmailNotification()` - on/off 토글 (없으면 INSERT, 있으면 UPDATE)

### 7. UI - 유저 메뉴에 알림 토글

**파일**: `src/components/dashboard/user-menu.tsx`

기존 드롭다운 메뉴에 "이메일 알림" Switch 추가. shadcn/ui Switch 컴포넌트 사용.

### 8. schema.sql 업데이트

`supabase/schema.sql`에 notification_preferences 테이블 반영

---

## 수정 파일 목록

| 파일 | 작업 |
|------|------|
| `supabase/migrations/013_notification_preferences.sql` | 신규 |
| `supabase/schema.sql` | 테이블 추가 |
| `src/lib/types/database.ts` | 타입 추가 |
| `src/lib/email/resend.ts` | ✅ 완료 — Resend 클라이언트 |
| `src/lib/email/send-summary-notification.ts` | 신규 — 알림 발송 |
| `src/actions/notifications.ts` | 신규 — 설정 Server Action |
| `src/actions/summaries.ts` | 수정 — 알림 호출 추가 |
| `src/components/dashboard/user-menu.tsx` | 수정 — 토글 UI |
| `.env.example` | ✅ 완료 — Resend 환경변수 추가 |

## 주의사항

- 이메일 주소는 `auth.users`에만 있으므로 `service_role` 필요
- 발송 실패가 제출 실패로 이어지면 안 됨 (반드시 try-catch)
- Resend 무료 플랜: 월 3,000건, 일 100건, 초당 2건
- Vercel 환경변수에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 등록 필요

## 검증

1. `pnpm build` 성공 확인
2. DB 마이그레이션 적용
3. 알림 토글 ON/OFF UI 동작 확인
4. 요약본 제출 후 이메일 수신 확인
5. 발송 실패 시 제출 자체는 성공하는지 확인 (try-catch 동작)
