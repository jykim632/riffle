# Google OAuth 설정 가이드

Riffle에서 Google 로그인을 사용하려면 다음 단계를 따라 설정하세요.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성 (기존 프로젝트가 있다면 건너뛰기)
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 드롭다운 클릭 → "새 프로젝트" 클릭
3. 프로젝트 이름 입력 (예: "Riffle") → "만들기"

### 1.2 OAuth 동의 화면 구성
1. 좌측 메뉴 → "APIs & Services" → "OAuth consent screen"
2. User Type 선택: **External** (Google Workspace 조직이 아니라면)
3. "만들기" 클릭
4. 앱 정보 입력:
   - 앱 이름: `Riffle`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
5. "저장 후 계속" 클릭
6. 범위 단계: 기본값 그대로 "저장 후 계속"
7. 테스트 사용자 단계: 필요 시 테스트 사용자 추가 → "저장 후 계속"

### 1.3 OAuth 클라이언트 ID 생성
1. 좌측 메뉴 → "APIs & Services" → "Credentials"
2. 상단 "+ CREATE CREDENTIALS" → "OAuth client ID" 클릭
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `Riffle Web Client` (또는 원하는 이름)
5. 승인된 리디렉션 URI 추가:
   ```
   https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
   ```
   - `<YOUR_SUPABASE_PROJECT_REF>`는 Supabase 프로젝트 URL에서 확인
   - 예: `https://brqxgsgvcpatlafydqdn.supabase.co/auth/v1/callback`

6. "만들기" 클릭
7. **클라이언트 ID**와 **클라이언트 보안 비밀** 복사 (나중에 사용)

## 2. Supabase Dashboard 설정

### 2.1 Google 프로바이더 활성화
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 좌측 메뉴 → "Authentication" → "Providers"
4. "Google" 찾아서 클릭
5. "Enable Sign in with Google" 토글 활성화
6. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: 위에서 복사한 클라이언트 ID
   - **Client Secret**: 위에서 복사한 클라이언트 보안 비밀
7. "Save" 클릭

### 2.2 Redirect URL 확인
- Supabase에서 제공하는 Callback URL 확인:
  ```
  https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
  ```
- 이 URL이 Google Cloud Console의 승인된 리디렉션 URI와 정확히 일치해야 함

## 3. 데이터베이스 마이그레이션 실행

트리거 업데이트를 위해 마이그레이션 실행:

```bash
# Supabase CLI 설치 (필요 시)
npm install -g supabase

# 마이그레이션 실행
npx supabase db push
```

또는 Supabase Dashboard에서 직접 SQL 실행:
1. Dashboard → "SQL Editor"
2. `supabase/migrations/002_improve_oauth_nickname.sql` 내용 복사
3. 실행

## 4. 환경변수 확인

`.env.local` 파일에 다음 변수가 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 개발 환경
# NEXT_PUBLIC_SITE_URL=https://your-domain.com  # 프로덕션
```

프로덕션 배포 시 Vercel 환경변수에 설정:
```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 5. 테스트

1. 개발 서버 실행:
   ```bash
   pnpm dev
   ```

2. 브라우저에서 접속: `http://localhost:3000/login`

3. "Google로 로그인" 버튼 클릭

4. 초대 코드 입력 후 Google 계정 선택

5. 대시보드로 리다이렉트 확인

## 문제 해결

### "redirect_uri_mismatch" 에러
- Google Cloud Console의 리디렉션 URI와 Supabase 콜백 URL이 정확히 일치하는지 확인
- 후행 슬래시(`/`) 유무도 정확히 일치해야 함

### "초대 코드가 필요합니다" 에러
- URL에 `invite_code` 파라미터가 전달되는지 확인
- `/google` 페이지에서 초대 코드를 입력했는지 확인

### profiles 테이블에 닉네임이 "User_xxxxx"로 생성됨
- 마이그레이션 `002_improve_oauth_nickname.sql`이 실행되었는지 확인
- Google OAuth가 `full_name` 정보를 제공하는지 확인

### 로그인 후 바로 로그아웃됨
- Supabase Auth 세션 쿠키가 제대로 설정되는지 확인
- 브라우저 쿠키 차단 설정 확인

## 프로덕션 배포 시 추가 설정

### Vercel 환경변수
```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

### Google Cloud Console
승인된 리디렉션 URI에 프로덕션 URL 추가:
```
https://your-production-domain.com/auth/callback
```

### Supabase Redirect URLs
Supabase Dashboard → Authentication → URL Configuration에서:
- **Site URL**: `https://your-production-domain.com`
- **Redirect URLs**: `https://your-production-domain.com/**` 추가
