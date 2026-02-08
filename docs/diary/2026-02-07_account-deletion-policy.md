# 2026-02-07 계정 삭제 익명화 정책 설계

## 작업 내용

계정 삭제 시 요약본이 CASCADE로 전부 날아가는 문제를 해결하기 위한 **익명화 후 보존 정책** 문서화 및 구현 설계.

### 변경 파일
- `docs/DATA_POLICY.md` — 계정 삭제 섹션을 익명화 정책으로 업데이트
- `src/app/(dashboard)/guide/security/page.tsx` — 인앱 보안 안내 페이지 동일 반영
- `docs/design/ACCOUNT_DELETION.md` — DB 마이그레이션 + 구현 설계 문서 신규 작성

### 추가 커밋 (미커밋 잔여분 정리)
- 가이드 인덱스/사용자 가이드 페이지
- 헤더 가이드 링크 버튼 + tooltip 컴포넌트
- weekId 검증 수정 (uuid → nanoid 대응)
- 서비스 소개/멤버 가이드/개발 일지 문서들

## 왜 했는지

요약본은 스터디 공유 자산인데, 현재 DB 구조에서는 `profiles ON DELETE CASCADE` → `summaries ON DELETE CASCADE` 체인으로 계정 삭제 시 전부 사라짐. 멤버가 탈퇴해도 작성한 요약본은 남아있어야 다른 멤버들이 참고 가능.

## 결정된 내용

| 리소스 | 처리 | 메커니즘 |
|--------|------|----------|
| auth.users / profiles | 삭제 | Admin API + CASCADE |
| summaries | 보존 (author_id=NULL) | SET NULL |
| season_members | 삭제 | CASCADE |
| invite_codes | 익명화 (FK=NULL) | SET NULL |

- 탈퇴한 멤버의 요약본은 "탈퇴한 멤버"로 표시
- RLS 변경 불필요 (NULL ≠ any UUID라 수정/삭제 자동 차단)

## 고민/발견

### chk_invite_used_consistency 함정
`is_used = true AND used_by IS NOT NULL` 제약조건 때문에 SET NULL이 차단됨. 마이그레이션에서 이 constraint를 수정해야 함. `used_at`은 NOT NULL 유지하되 `used_by`만 NULL 허용하는 방향으로.

### latest_summaries 뷰의 DISTINCT ON 이슈
`DISTINCT ON (week_id, author_id)`에서 author_id=NULL인 행들이 하나로 합쳐질 수 있음. 소규모라 실질적 영향 낮지만, 구현 시 뷰 수정 검토 필요.

### acquire_invite_code 함수
영향 없음 확인. `is_used = false`인 코드만 대상이라 탈퇴로 NULL 된 코드(이미 is_used=true)와 무관.

## 남은 것

1. **DB 마이그레이션 실행** (013_account_deletion_fk.sql) — 설계 문서에 SQL 완성됨
2. **프론트엔드 처리** — author_id=NULL일 때 "탈퇴한 멤버" 표시 + 수정/삭제 버튼 숨김
3. **관리자 계정 삭제 기능** — Admin API 호출하는 서버 액션 구현
4. **테스트** — 삭제 후 요약본 보존 확인

## 난이도

설계/문서화만이라 구현 난이도는 낮았음. 다만 FK chain, constraint, 뷰의 DISTINCT ON 등 DB 레벨 영향 분석이 핵심이었고, 이 부분은 꼼꼼하게 봐야 했음.

## 다음 액션

- 구현 우선순위 결정 후 beads 이슈로 등록
- 마이그레이션 먼저 적용 → 프론트엔드 → 관리자 기능 순서
