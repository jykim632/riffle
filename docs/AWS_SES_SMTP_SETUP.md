# AWS SES SMTP 설정 가이드

## 배경

비밀번호 리셋 코드는 이미 구현 완료(`src/actions/password.ts`). 현재 Supabase 기본 이메일 사용 중인데 **시간당 2통 제한**(값은 변경될 수 있음) + 조직 멤버 주소로만 발송 가능 + 스팸함 위험 있음. AWS SES를 SMTP로 연결하여 안정적인 이메일 발송 확보.

나중에 요약본 제출 알림 기능 추가 시에도 SES를 사용할 예정.

---

## 1단계: AWS SES 리전 선택

- AWS Console 접속 → 리전 선택
- **서울 리전(ap-northeast-2)** 에 SES가 있으면 서울 사용, 없으면 가까운 리전(도쿄 `ap-northeast-1` 또는 오레곤 `us-west-2`)
- SMTP 엔드포인트가 리전별로 다르므로 여기서 선택한 리전 기억해둘 것
- SES의 인증 상태(Verified identities), 발송 한도, SMTP 크레덴셜은 **리전별로 분리**됨. 리전 바꾸면 다시 설정 필요

> 확인: AWS Console > SES 로 진입 시 해당 리전에서 SES 서비스가 활성화되어 있는지 확인

---

## 2단계: 도메인 인증 (AWS SES 콘솔)

### 2-1. Identity 생성

1. AWS Console > **Amazon SES** > 좌측 메뉴 **Verified identities**
2. **Create identity** 클릭
3. Identity type: **Domain** 선택
4. Domain 입력란에 도메인 입력 (예: `example.com`)

### 2-2. DKIM 설정

같은 생성 화면에서:

5. **Easy DKIM** 선택
6. DKIM signing key length: **RSA_2048_BIT** 선택 (보안 강화)
7. **Publish DNS records in Route 53** → Route53 사용 중이면 체크 (자동 등록), 아니면 체크 해제
8. **Create identity** 클릭

### 2-3. DNS 레코드 추가

생성 후 화면에서 DKIM용 **CNAME 레코드 3개**가 표시됨:

| Type | Name | Value |
|------|------|-------|
| CNAME | `{selector1}._domainkey.example.com` | `{selector1}.dkim.amazonses.com` |
| CNAME | `{selector2}._domainkey.example.com` | `{selector2}.dkim.amazonses.com` |
| CNAME | `{selector3}._domainkey.example.com` | `{selector3}.dkim.amazonses.com` |

**DNS 관리 사이트**(Cloudflare, Route53, 가비아 등)에서 이 3개 CNAME 추가.

### 2-4. 인증 완료 대기

- DNS 전파 후 SES가 자동 확인 (보통 수분~최대 72시간, 대부분 1시간 이내)
- Verified identities 목록에서 Status가 **Verified** 로 바뀌면 완료
- DKIM configuration 상태도 **Successful** 인지 확인

### 2-5. (선택) SPF/DMARC 추가

이메일 전달률 높이려면 DNS에 추가:

```
# SPF (TXT 레코드)
Name: example.com
Value: "v=spf1 include:amazonses.com ~all"

# DMARC (TXT 레코드)
Name: _dmarc.example.com
Value: "v=DMARC1; p=none; rua=mailto:admin@example.com"
```

> SPF/DMARC는 필수는 아니지만, 스팸 방지에 큰 도움이 됨
> 이미 SPF TXT가 있으면 새 레코드를 추가하지 말고 기존 SPF 값에 `include:amazonses.com`을 병합해야 함 (도메인당 SPF TXT는 하나만 유효)

---

## 3단계: SMTP 크레덴셜 생성 (AWS SES 콘솔)

1. AWS Console > **Amazon SES** > 좌측 메뉴 **SMTP settings**
2. 페이지 상단에 SMTP 엔드포인트 표시됨 — **메모해둘 것**:
   - 예: `email-smtp.ap-northeast-2.amazonaws.com`
   - Port: **587** (STARTTLS 권장, 대안: `465`/`2465`/`2587`)
3. **Create SMTP credentials** 클릭
4. IAM User Name 지정 (기본값 그대로 또는 `ses-smtp-riffle` 같은 이름)
5. **Create user** 클릭
6. SMTP username과 password가 표시됨

> 참고: SMTP 크레덴셜 생성은 IAM 권한(`iam:ListUsers`, `iam:CreateUser`, `iam:CreateAccessKey`, `iam:PutUserPolicy`)이 필요할 수 있음

> **⚠️ 중요: 이 화면에서 반드시 credentials를 복사/다운로드. 이 화면을 닫으면 password는 다시 확인 불가!**

저장해야 할 값 4개:
- **SMTP endpoint**: `email-smtp.{region}.amazonaws.com`
- **Port**: `587`
- **SMTP username**: `AKIA...` 형태
- **SMTP password**: 긴 문자열

---

## 4단계: Supabase Custom SMTP 설정 (Supabase 대시보드)

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택 > **Project Settings** (좌측 하단 톱니바퀴)
3. **Authentication** 탭 클릭
4. 아래로 스크롤하여 **SMTP Settings** 섹션 찾기
5. **Enable Custom SMTP** 토글 ON

입력할 값:

| 필드 | 값 | 예시 |
|------|-----|------|
| **Sender email** | SES에서 인증한 도메인의 이메일 | `noreply@example.com` |
| **Sender name** | 수신자에게 보이는 이름 | `리플` |
| **Host** | 3단계에서 메모한 SMTP endpoint | `email-smtp.ap-northeast-2.amazonaws.com` |
| **Port number** | 587 | `587` |
| **Minimum interval** | 기본값 유지 (60초) | `60` |
| **Username** | 3단계에서 발급받은 SMTP username | `AKIA...` |
| **Password** | 3단계에서 발급받은 SMTP password | (긴 문자열) |

6. **Save** 클릭

> 주의: Supabase Custom SMTP 설정 후 기본 rate limit이 **시간당 30통**으로 설정됨. 스터디 규모면 충분하지만, 필요 시 Rate Limits 페이지에서 조정.

---

## 5단계: 이메일 템플릿 수정 (Supabase 대시보드)

1. Supabase Dashboard > **Authentication** > **Email Templates**
2. **Reset Password** 템플릿 선택
3. 링크 부분을 아래로 변경:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/update
```

4. (선택) 본문을 한국어로 수정:

```html
<h2>비밀번호 초기화</h2>
<p>아래 링크를 클릭하여 비밀번호를 재설정하세요.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password/update">비밀번호 재설정하기</a></p>
```

5. **Save** 클릭

> 주의: SMTP 서비스에서 link tracking이 활성화되어 있으면 링크가 덮어씌워질 수 있음. SES는 기본적으로 link tracking 비활성이라 괜찮지만, 문제 발생 시 확인할 것.

---

## 6단계: Sandbox 처리

### 현재 상태

AWS SES 신규 계정은 **sandbox 모드**:
- **verified 이메일/도메인으로만 발송 가능**
- 하루 200통, 초당 1통 제한
- (예외) SES mailbox simulator 주소는 검증 없이 테스트 가능

> 참고: 위 한도는 "메시지 수"가 아니라 "수신자 수" 기준으로 차감됨

### Sandbox에서 비밀번호 리셋 작동시키기

Sandbox에서도 **수신자 이메일이 SES에서 verify되어 있으면** 발송 가능.

**방법 A — 멤버 이메일 개별 인증** (당장 권장):

1. AWS Console > SES > Verified identities > Create identity
2. Identity type: **Email address** 선택
3. 멤버 이메일 입력
4. 해당 멤버가 확인 이메일의 링크 클릭
5. 모든 멤버에 대해 반복

→ 스터디 멤버가 소수면 이걸로 충분. 새 멤버 추가 시마다 verify 필요.

**방법 B — Production 전환 신청** (알림 기능 추가 시 권장):

1. AWS Console > SES > Account dashboard
2. **Request production access** 클릭
3. 양식 작성:
   - **Mail type**: Transactional
   - **Website URL**: 서비스 URL
   - **Use case description** 예시:
     > We operate a small private study group web application. We need to send transactional emails for password reset functionality. Expected volume is less than 50 emails per month.
4. 제출 → 보통 24시간 내 승인

→ Production 전환되면 도메인 인증만으로 아무 주소에나 발송 가능.

---

## 코드 변경

**없음.** 비밀번호 리셋 코드(`src/actions/password.ts`)는 Supabase Auth의 `resetPasswordForEmail()`을 호출하고, Supabase가 SMTP를 통해 이메일을 보내는 구조. SMTP 백엔드만 바꾸면 코드 변경 없이 동작.

---

## 검증 체크리스트

1. [ ] SES Verified identities에서 도메인 Status = **Verified** 확인
2. [ ] SES Verified identities에서 DKIM = **Successful** 확인
3. [ ] (Sandbox인 경우) 테스트할 수신 이메일 주소 SES에서 verify 완료
4. [ ] Supabase SMTP 설정 저장 완료
5. [ ] Supabase Email Template의 Reset Password 링크 수정 완료
6. [ ] `/reset-password` 페이지에서 실제 이메일로 비밀번호 리셋 요청
7. [ ] 이메일 수신 확인 — **받은편지함**에 도착하는지 (스팸함 아닌지)
8. [ ] 이메일 발신자가 `noreply@{도메인}` 으로 표시되는지
9. [ ] 이메일 내 링크 클릭 → `/reset-password/update` 정상 이동
10. [ ] 새 비밀번호 설정 → 로그아웃 → 새 비밀번호로 로그인 성공

---

## 다음 단계

- SES sandbox → production 전환 (알림 기능 추가 시)
- 요약본 제출 알림 기능 구현 (`@aws-sdk/client-sesv2` 사용, 기존 `docs/email-notification-plan.md`의 Resend → SES로 교체)
