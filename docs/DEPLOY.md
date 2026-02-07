# Vercel 배포 가이드 (Riffle)

## 사전 준비

### 1. Vercel 계정 및 CLI 설치

```bash
# Vercel CLI 설치
pnpm add -g vercel

# 로그인
vercel login
```

### 2. Supabase 프로젝트 설정

Supabase 대시보드에서 다음 값들 확인:
- **Project URL**: `Settings > API > Project URL`
- **Anon Key**: `Settings > API > anon public`
- **Service Role Key**: `Settings > API > service_role` (비공개 유지)

---

## 배포 단계

### Step 1: Vercel 프로젝트 연결

```bash
vercel link
```

프롬프트에서:
- Scope 선택 (개인/팀)
- 기존 프로젝트 연결 또는 새로 생성

### Step 2: 환경 변수 설정

Vercel 대시보드 또는 CLI로 설정:

```bash
# CLI로 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

| 변수 | 값 | 환경 |
|------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Production, Preview, Development |

> `NEXT_PUBLIC_SITE_URL`은 설정 불필요. OAuth redirect URL은 `window.location.origin`으로 동적 처리됨.

### Step 3: 빌드 설정 확인

Vercel이 자동 감지하지만, 필요시 대시보드에서 확인:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`
- **Output Directory**: `.next`

### Step 4: 배포 실행

```bash
# Preview 배포 (develop 브랜치)
vercel

# Production 배포 (main 브랜치)
vercel --prod
```

---

## Supabase 설정 (필수 - 배포 직후 수행)

### Auth Redirect URL 설정

> ⚠️ **이 설정 없이는 Google OAuth 로그인이 작동하지 않음**

Supabase 대시보드 > `Authentication > URL Configuration`:

```
Site URL: https://your-domain.vercel.app
Redirect URLs:
  - https://your-domain.vercel.app/**
  - https://*.vercel.app/** (Preview 배포용)
```

Preview 배포 후 OAuth 로그인이 되는지 반드시 확인할 것.

---

## Git 연동 자동 배포

Vercel 대시보드에서 GitHub 연동 시:

| 브랜치 | 배포 환경 |
|--------|----------|
| `main` | Production |
| `develop` | Preview |
| 기타 브랜치 | Preview |

---

## 트러블슈팅

### 빌드 실패: pnpm not found / 호환성 에러
Vercel 대시보드 > Settings > General > Node.js Version에서 **20.x 이상** 확인 (Next.js 16 + React 19는 Node 20+ 필수)

### Auth 리다이렉트 에러
Supabase Redirect URLs에 Vercel 도메인 추가 확인

### 환경 변수 미적용
재배포 필요: `vercel --prod --force`

---

## 유용한 명령어

```bash
vercel env ls          # 환경 변수 목록
vercel logs            # 실시간 로그
vercel inspect <url>   # 배포 상세 정보
vercel rollback        # 이전 버전 롤백
```
