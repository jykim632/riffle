# 2026-02-07 보안 감사 리포트 대응

## 작업한 내용

SECURITY_AUDIT.md 리포트 기반으로 Critical~Low 전 항목(18건) 검토 및 수정.

### Critical (5건)

| ID | 내용 | 처리 |
|----|------|------|
| C-1 | profiles role 자기 변경으로 admin 권한 상승 | `011_prevent_role_escalation.sql` — BEFORE UPDATE 트리거로 비admin의 role 변경 차단 |
| C-2 | invite_codes SELECT USING(true) 전량 노출 | 이전 009 마이그레이션에서 이미 수정됨 확인 |
| C-3 | invite_codes UPDATE 정책 과도 | 이전 010 마이그레이션에서 이미 수정됨 확인 |
| C-4 | season_members 직접 INSERT 가능 | 원래 public INSERT 정책 없었음 + 006/007에서 admin-only 확인 |
| C-5 | admin Server Actions 인가 검사 없음 | `auth-guard.ts` 공통 헬퍼 + 10개 함수 전부 `requireAdmin()` 적용 |

### High (4건)

| ID | 내용 | 처리 |
|----|------|------|
| H-1 | 보안 헤더 불완전 | `Permissions-Policy`, `X-DNS-Prefetch-Control` 추가 |
| H-2 | middleware /dashboard만 보호 | `/admin`, `/mine`, `/summaries` 경로 추가 |
| H-3 | 초대 코드 race condition | `012_atomic_invite_code.sql` — FOR UPDATE 행 잠금. auth.ts/callback 연동 |
| H-4 | Open redirect | 현재 코드에 `next` 파라미터 미사용 — 해당 없음 |

### Medium (6건)

| ID | 내용 | 처리 |
|----|------|------|
| M-1 | signUp 에러 메시지 직접 노출 | 일반화 메시지로 교체 |
| M-2 | Rate limiting 부재 | signup에 5회/분 IP 기반 제한 (로그인은 Supabase Auth 기본 제한으로 충분) |
| M-3 | 외부 CDN 스크립트 SRI 미적용 | sha384 해시 + crossOrigin 적용 |
| M-4 | 에러 메시지에 DB 정보 노출 | admin actions 에러 메시지 전부 일반화 (C-5 수정 시 함께 처리) |
| M-5 | 비밀번호 최소 6자 | 8자로 상향 |
| M-6 | 초대 코드 count 상한 없음 | 50개 제한 추가 |

### Low (3건)

| ID | 내용 | 처리 |
|----|------|------|
| L-1 | 클라이언트 console.error | 클라이언트 컴포넌트에 없음 확인. 서버 사이드만 2건 (안전) |
| L-2 | signout CSRF 토큰 없음 | Server Action이라 Next.js 내장 CSRF 보호됨 |
| L-3 | invite-codes N+1 쿼리 | 2N+1 → 2 쿼리 (일괄 프로필 조회) |

## 왜 했는지

프로덕션 배포 전 보안 검수. 3개 에이전트(Backend Risk Guard, Code Security Reviewer, Architecture Reviewer) 병렬 투입으로 작성된 감사 리포트 기반.

가장 치명적인 건 C-1 + C-5 연쇄 공격 시나리오 — 일반 사용자가 자기 role을 admin으로 변경 후 모든 admin action을 호출할 수 있는 상태였음.

## 논의/고민

- **로그인 rate limiting**: 처음엔 10회/분 제한을 넣었는데, 소규모 폐쇄형 앱에서 비밀번호 틀려서 재시도하는 일반 사용자가 걸릴 수 있어 제거. Supabase Auth 기본 제한으로 충분.
- **C-1 해결 방식**: RLS 정책 수정 vs 트리거. 트리거가 더 방어적 — RLS 정책이 나중에 바뀌어도 트리거가 마지막 방어선 역할.
- **SRI 적용 시 트레이드오프**: CDN 스크립트가 업데이트되면 해시 불일치로 로딩 실패. 하지만 보안이 우선이고, 위젯 로딩 실패는 서비스 핵심 기능에 영향 없음.

## 결정된 내용

- admin action 인가 패턴: `requireAdmin()` 공통 헬퍼 → `{ authorized, supabase, user }` 반환
- rate limiting은 signup만 적용 (login은 Supabase에 위임)
- 에러 메시지는 전부 일반화 (DB 스키마 정보 노출 방지)

## 느낀 점/난이도/발견

- 난이도: 중. 대부분 패턴화된 수정이라 시간 대비 효과 좋았음.
- 리포트의 C-2~C-4는 이전 마이그레이션(009, 010)에서 이미 수정된 상태였음. 감사 리포트가 이전 상태 기준으로 작성된 것.
- H-4(Open redirect)도 현재 코드에 해당 없음 — callback에 `next` 파라미터 자체를 안 쓰고 있었음.
- PostgreSQL의 OR 결합 RLS 정책이 생각보다 위험. 정책 추가만으로는 기존 허용 정책을 제한할 수 없음.

## 남은 것

없음. 리포트 전 항목 처리 완료.

마이그레이션 011, 012는 Supabase에 수동 실행 완료.

## 다음 액션

- 프로덕션 배포
- SRI 해시가 위젯 업데이트 시 깨지지 않는지 모니터링

## 커밋

- `ccef6ae` fix: 보안 취약점 수정 (Critical/High/Medium)
- `4ce5ce9` fix: 보안 취약점 수정 (Medium/Low)
