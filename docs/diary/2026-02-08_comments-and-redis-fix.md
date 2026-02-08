# 요약글 댓글 기능 + Upstash Redis 버그 수정

> 2026-02-08 | mode=log

## 작업한 내용

### 1. 요약글 코멘트/피드백 기능 (riffle-30x)
멤버 간 피드백을 위한 댓글 CRUD 전체 구현.

**신규 파일 6개:**
- `supabase/migrations/015_comments.sql` — 테이블 + 인덱스 + RLS 4개
- `src/lib/schemas/comment.ts` — Zod 스키마 (create/update/delete)
- `src/actions/comments.ts` — Server Actions 3개 (revalidatePath 패턴)
- `src/components/comment/comment-form.tsx` — 작성 폼 (Client)
- `src/components/comment/comment-item.tsx` — 인라인 수정/삭제 (Client)
- `src/components/comment/comment-list.tsx` — 목록 렌더링 (Server)

**수정 파일 5개:**
- `supabase/schema.sql` — comments 테이블/인덱스/RLS 추가
- `src/lib/types/database.ts` — comments Row/Insert/Update 타입
- `src/lib/schemas/index.ts` — comment export
- `summaries/[id]/page.tsx` — 댓글 섹션 통합
- `summaries/page.tsx` — 댓글 수 배지 (MessageCircle 아이콘)

### 2. Upstash Redis 클라이언트 토큰 에러 수정
- 환경변수 URL 끝에 개행문자(`\n`) 포함 → SDK reject
- 모듈 레벨 즉시 생성 → 빌드 시점에도 에러 발생

## 왜 했는지

- **댓글**: 요약글 작성만 있고 상호작용이 없어서 참여도가 떨어짐. 간단한 피드백 루프 필요.
- **Redis 수정**: 배포 후 로그인/회원가입 시 rate limiting에서 즉시 크래시.

## 결정된 내용

| 항목 | 결정 | 이유 |
|------|------|------|
| 댓글 구조 | 플랫 (비중첩) | 소규모 스터디, 대댓글 과잉 |
| 댓글 내용 | 플레인 텍스트 | 짧은 피드백이라 마크다운 불필요 |
| 글자 수 | 1~500자 | 간결한 피드백 유도 |
| 페이지 갱신 | revalidatePath | 같은 페이지 유지 (redirect 아님) |
| 정렬 | 오래된 순 (ascending) | 대화 흐름 자연스러움 |
| Redis init | lazy + trim | 빌드 시점 안전 + 환경변수 공백 방어 |

## 고민/발견

- **댓글 수 조회**: `latest_summaries` 뷰에서 comments JOIN이 안 됨. 별도 쿼리로 summary_id 기반 카운트 후 `Record<string, number>` 맵핑. 20개 제한이라 성능 문제 없음.
- **수정됨 표시**: `updated_at !== created_at` 비교로 "(수정됨)" 표시. DB 트리거 없이 Server Action에서 `updated_at` 직접 갱신.
- **Redis 에러**: `cat -e`로 `.env.local` 확인했을 때 깨끗했는데 실제로는 개행 포함. Vercel 대시보드 복붙 시 흔히 발생하는 문제. `.trim()` 방어가 정답.

## 난이도

- 댓글 기능: 중. 설계 문서가 잘 정리되어 있어서 기존 summaries 패턴 따라가면 됐음.
- Redis 수정: 하. 원인 파악이 핵심이었고, 에러 메시지에 `\n`이 그대로 보여서 바로 잡음.

## 남은 것

- [ ] Supabase에 `015_comments.sql` 마이그레이션 직접 실행
- [ ] 배포 후 댓글 CRUD 실제 테스트
- [ ] Vercel env var에서도 URL/TOKEN 값 앞뒤 공백 확인

## 다음 액션

- `bd ready` 기준 P1: 멤버 통계/리더보드 (riffle-91n)
- P2: 비밀번호 재설정 플로우, 경제지표 대시보드 후속 작업
