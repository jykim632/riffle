# 로고 & 파비콘 적용

**날짜**: 2026-02-08
**커밋**: `1c3e997` feat: logo.png 기반 파비콘 + 로그인 로고 적용

---

## 작업 내용

`public/logo.png` (원 안에 R, 흑백)를 파비콘과 로그인 로고로 적용.

| 파일 | 작업 |
|------|------|
| `public/logo.jpeg` | 삭제 (png과 중복) |
| `public/icon.svg` | 삭제 (더 이상 미사용) |
| `src/app/favicon.ico` | logo.png → sips 32x32 리사이즈 → ico 변환 |
| `src/app/icon.png` | logo.png 복사 (Next.js App Router 자동 아이콘) |
| `src/app/apple-icon.png` | logo.png 복사 (Apple 디바이스용) |
| `src/app/layout.tsx` | metadata.icons: svg→png, apple 아이콘 추가 |
| `src/components/auth/auth-logo.tsx` | Lucide Radio 아이콘 → `<Image src="/logo.png">` |

## 왜 했는지

- 기존에 Lucide Radio 아이콘 + 파란-보라 그라데이션 SVG를 임시 로고로 사용 중이었음
- 실제 로고 이미지(`logo.png`)가 준비되어서 전면 교체

## 논의/아이디어/고민

- **헤더에도 로고 넣을까?** → 처음엔 대시보드 헤더, 모바일 네비, 관리자 사이드바에도 로고 이미지를 넣으려고 구현했지만, 실제로 적용해보니 텍스트만 있는 게 더 깔끔해서 파비콘 + 로그인 페이지만 적용하기로 결정
- **다크모드 대응**: 흑백 로고라 `dark:invert` 클래스로 간단하게 해결. 별도 다크모드 로고 불필요
- **ico 변환**: macOS `sips`로 32x32 리사이즈 후 ico 포맷 변환. 별도 도구 설치 없이 처리

## 결정된 내용

| 결정 | 이유 |
|------|------|
| 헤더에 로고 미적용 | 텍스트만으로 충분, 로고 넣으면 오히려 산만 |
| `dark:invert`로 다크모드 대응 | 흑백 로고에 가장 간단한 방법 |
| icon.svg 삭제 | png 로고로 대체, SVG 그라데이션 아이콘 불필요 |
| logo.jpeg 삭제 | logo.png과 중복, png만 유지 |

## 느낀 점/난이도/발견

- **난이도**: 낮음. 정적 파일 교체 + 컴포넌트 이미지 교체 수준
- **Turbopack 빌드 에러**: Next.js 16.1.6 Turbopack 내부 panic 발생 (코드 변경 무관). `pnpm dev`는 정상 동작. 빌드 검증은 Vercel 배포로 대체 필요
- **Next.js App Router 아이콘 컨벤션**: `src/app/icon.png`, `src/app/apple-icon.png` 파일명만 맞추면 자동으로 메타태그 생성

## 남은 것

- Turbopack 빌드 에러 모니터링 (Next.js 16 버그 트래킹)
- Vercel 배포 후 실제 파비콘 반영 확인 (브라우저 캐시 주의)
