# 2026-02-07 Vercel 배포

## 작업한 내용

- DEPLOY.md 검토 및 수정 (3건)
  - `NEXT_PUBLIC_SITE_URL` 환경변수 제거 (코드에서 미사용 확인)
  - Node.js 버전 요구사항 18.x → 20.x 수정
  - Supabase Auth Redirect URL 섹션 필수 단계로 격상
- Vercel CLI로 프로젝트 연결 및 환경변수 9개 설정
- `.vercelignore` 생성 (`.beads/bd.sock` 소켓 파일 배포 차단)
- Preview 배포 → 정상 확인 → Production 배포 완료
- 커스텀 도메인 `web.riffles.cloud` 연결 (Cloudflare CNAME)
- Supabase Auth Redirect URL 설정 (localhost + 커스텀 도메인 + vercel.app)
- GitHub 연동 자동 배포 확인 (main push → Production 자동 트리거)

## 왜 했는지

첫 프로덕션 배포. 보안 감사 수정 끝나고 실서비스 올리는 단계.

## 논의/고민

- **`NEXT_PUBLIC_SITE_URL` 필요 여부**: 코드 전체 grep 결과 사용처 없음. OAuth redirect는 `window.location.origin`으로 동적 처리되고 있어서 환경변수 불필요 판단
- **localhost와 프로덕션 동시 사용**: Supabase Redirect URLs에 둘 다 등록하면 `window.location.origin` 기반으로 각 환경에 맞게 작동
- **Cloudflare 프록시 vs DNS Only**: 프록시(주황색 구름) 켜면 Vercel SSL 인증서 발급에 문제 생길 수 있어서 DNS Only로 전환. 525 에러 해결

## 결정된 내용

- 커스텀 도메인: `web.riffles.cloud`
- Cloudflare DNS Only 모드 사용
- Supabase 프로젝트는 개발/프로덕션 동일하게 사용
- GitHub 연동: main → Production, develop → Preview

## 느낀 점/난이도/발견

- 난이도: 낮음 (삽질 포인트는 `.beads/bd.sock` 소켓 파일과 Cloudflare DNS 캐시 정도)
- `.beads/` 디렉토리의 소켓 파일이 Vercel 업로드 시 에러 유발 → `.vercelignore`로 해결
- Cloudflare DNS 변경 후 로컬 DNS 캐시가 남아서 525 에러 지속 → `--resolve` 플래그로 우회 확인
- Next.js 16의 `proxy.ts` (구 middleware.ts) Vercel 자동 인식 확인

## 남은 것

- [ ] Cloudflare 프록시(주황색 구름) 다시 켤지 결정 (CDN 캐싱 이점 vs SSL 복잡도)
- [ ] DEPLOY.md에 커스텀 도메인 `web.riffles.cloud` 반영
- [ ] CI/CD 파이프라인 정리 (CLAUDE.md에 언급된 자동 롤백 등)

## 다음 액션

- 실사용 테스트 (회원가입 → 로그인 → 요약본 작성 플로우)
- develop 브랜치 push 및 main 머지 정리
