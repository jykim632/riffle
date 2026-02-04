# Riffle 🎙️

> 경제 라디오 청취 스터디를 위한 요약본 제출 및 관리 플랫폼

Riffle은 매주 경제 라디오를 듣고 요약본을 제출하는 폐쇄형 스터디 그룹을 위한 웹 애플리케이션입니다. 시즌 단위로 멤버를 관리하고, 주차별 요약본 제출 현황을 한눈에 확인할 수 있습니다.

## ✨ 주요 기능

### 📅 시즌 시스템
- 3개월 단위 시즌으로 스터디 운영
- 시즌별 멤버 관리 및 히스토리 보존
- 자동 주차 생성 (ISO 8601 기준 월요일~일요일)
- 활성 시즌 전환 및 과거 시즌 아카이브

### 📝 요약본 제출
- 주차별 요약본 작성 (마크다운 에디터)
- 제출 현황 실시간 확인
- 멤버별 제출 히스토리 조회
- 시즌 멤버만 제출/수정 가능 (접근 제어)

### 👥 멤버 관리
- Google OAuth 기반 회원가입/로그인
- 초대 코드 시스템 (폐쇄형 운영)
- 시즌별 멤버 추가/제거
- 관리자/멤버 역할 구분

### 🛠️ 관리자 페이지
- 시즌 생성 및 관리
- 주차 설정 (현재 주차 지정)
- 멤버 관리 (역할 변경, 시즌 멤버십)
- 초대 코드 생성

## 🚀 기술 스택

### Frontend
- **Next.js 16.1** - App Router, Server Components, Server Actions
- **React 19** - with React Compiler
- **TypeScript** - 타입 안전성
- **Tailwind CSS v4.1** - CSS-first configuration
- **shadcn/ui v3.7** - UI 컴포넌트 라이브러리

### Backend
- **Supabase** - PostgreSQL Database + Auth
- **Row Level Security (RLS)** - 데이터베이스 레벨 보안
- **Server Actions** - API 없는 서버 함수 호출

### DevOps
- **Vercel** - 자동 배포 (develop → dev, main → prod)
- **pnpm** - 빠른 패키지 관리
- **ESLint** + **Prettier** - 코드 품질 관리

## 📦 시작하기

### 1. 사전 요구사항
- Node.js 18.17 이상
- pnpm 9.0 이상
- Supabase 프로젝트

### 2. 저장소 클론
```bash
git clone https://github.com/jykim632/riffle.git
cd riffle
```

### 3. 의존성 설치
```bash
pnpm install
```

### 4. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 5. 데이터베이스 마이그레이션
Supabase SQL Editor에서 `supabase/migrations/` 폴더의 마이그레이션 파일을 순서대로 실행하세요.

### 6. 개발 서버 실행
```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
riffle/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 페이지 (로그인, 회원가입)
│   │   ├── (dashboard)/       # 메인 대시보드 및 요약본 페이지
│   │   └── admin/             # 관리자 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── admin/             # 관리자 전용 컴포넌트
│   │   └── dashboard/         # 대시보드 컴포넌트
│   └── lib/
│       ├── actions/           # Server Actions
│       ├── supabase/          # Supabase 클라이언트
│       ├── types/             # TypeScript 타입
│       └── utils/             # 유틸리티 함수
├── supabase/
│   └── migrations/            # 데이터베이스 마이그레이션
└── docs/
    ├── diary/                 # 개발 일지
    └── *.md                   # 설계 문서
```

## 🎯 주요 개념

### 시즌 (Season)
- 스터디의 기간 단위 (기본 3개월, 수정 가능)
- 각 시즌마다 독립적인 주차 번호 (1주차부터 시작)
- 시즌별 멤버 관리 (명시적 참여 필요)
- 한 번에 하나의 시즌만 활성화 가능

### 주차 (Week)
- 시즌 내 1주 단위 (월요일~일요일, ISO 8601)
- 시즌 생성 시 자동 생성
- 현재 주차 지정 (관리자)
- 주차별 요약본 제출 현황 추적

### 접근 제어
- 현재 시즌 멤버만 요약본 제출/수정 가능
- 과거 시즌 멤버는 과거 데이터 조회만 가능
- 관리자는 모든 제약 없음
- RLS 정책으로 DB 레벨 보안 보장

## 🔐 보안

- **Row Level Security (RLS)**: 데이터베이스 레벨 접근 제어
- **Server Components**: 민감한 로직 서버에서만 실행
- **Server Actions**: CSRF 보호 내장
- **초대 코드**: 폐쇄형 회원가입 (무분별한 가입 방지)

## 🚢 배포

### Vercel 자동 배포
- `develop` 브랜치 → dev 환경 자동 배포
- `main` 브랜치 → prod 환경 자동 배포
- UI 배포 후 CORS preflight 테스트 자동 수행
- prod 배포 실패 시 자동 롤백 (최근 5개 백업 유지)

### 수동 배포
```bash
pnpm build
```

빌드 결과물을 Vercel 또는 다른 호스팅 서비스에 배포하세요.

## 🤝 기여

1. 이 저장소를 Fork 하세요
2. 새 브랜치를 생성하세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'feat: add amazing feature'`)
4. 브랜치에 푸시하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성하세요

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👨‍💻 개발자

- **jykim632** - [GitHub](https://github.com/jykim632)

## 📚 참고 문서

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

Made with ❤️ for economic study group
