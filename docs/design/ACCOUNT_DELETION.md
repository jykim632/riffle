# 계정 삭제 - 설계 문서

> 상태: **확정 / 구현 완료**
> 최종 업데이트: 2026-02-08

## 핵심 구분: "시즌 탈퇴" vs "계정 삭제"

| | 시즌 탈퇴 | 계정 삭제 |
|---|---|---|
| **트리거** | 관리자가 시즌에서 멤버 제거 | 관리자가 계정 삭제 실행 |
| **의미** | "이번 시즌 안 해" | "서비스 나갈게" |
| **season_members** | 행 삭제 (DELETE) | 익명화 (SET NULL) |
| **summaries** | 보존 (영향 없음) | 보존 + author_id NULL |
| **profiles** | 유지 | 삭제 |
| **계정 상태** | 활성 (다른 시즌 참여 가능) | 완전 삭제 |

---

## 테이블별 삭제 처리

| 리소스 | 이전 | 현재 | 이유 |
|---|---|---|---|
| `auth.users` | -- | **삭제** (Admin API) | 인증 데이터 완전 제거 |
| `profiles` | CASCADE | **CASCADE 유지** | auth.users 삭제 시 자동 |
| `summaries.author_id` | CASCADE (내용까지 삭제) | **SET NULL** | 내용 보존, 작성자만 익명화 |
| `season_members.user_id` | CASCADE (행 삭제) | **SET NULL** | 참여 기록 보존 (통계용) |
| `invite_codes` | NO ACTION | **SET NULL** | 이미 nullable, 일관성 |

### season_members: SET NULL (Option B) 선택 이유

1. `COUNT(*)` → 시즌별 총 참여 인원 정확히 보존
2. PostgreSQL에서 UNIQUE(season_id, user_id)는 NULL 중복 허용 → 여러 탈퇴자 공존 가능
3. 통계에서 필요한 건 "몇 명이 참여했냐"지, "탈퇴한 누가 참여했냐"가 아님
4. display_name 스냅샷은 YAGNI

---

## 마이그레이션: `013_account_deletion_fk.sql`

### summaries.author_id
- NOT NULL 제거 + FK를 `ON DELETE SET NULL`로 변경

### season_members.user_id
- NOT NULL 제거 + FK를 `ON DELETE SET NULL`로 변경

### invite_codes
- `created_by`, `used_by` FK를 `ON DELETE SET NULL`로 변경
- `chk_invite_used_consistency` 수정: `used_by`가 NULL이어도 `is_used=true` 허용

### latest_summaries / first_summaries 뷰
- `DISTINCT ON (week_id, COALESCE(author_id, id))` 로 변경
- 탈퇴 멤버 요약본이 같은 주차에 여러 개 있어도 개별 표시

---

## 구현 요약

### 서버 액션
- `deleteUserAccountAction()` in `src/lib/actions/admin/members.ts`
- Supabase Admin API `deleteUser()` 호출
- `requireAdmin()` 가드 + 본인 삭제 방지

### 프론트엔드
- `author_id: string | null` 타입 변경 (`database.ts`, 뷰 포함)
- `author_id === null` → "탈퇴한 멤버" 텍스트 표시
- `/mine/[id]`: author_id가 null이면 `/summaries/[id]`로 리다이렉트
- 관리자 멤버 목록에 계정 삭제 버튼 + 확인 다이얼로그 추가

### 영향 없는 부분
- RLS 정책: 변경 불필요. `NULL != any UUID`
- `acquire_invite_code` 함수: `is_used = false`만 대상
- 시즌 탈퇴 로직: 그대로 DELETE FROM season_members

---

## 통계 데이터와 익명화

- Raw 데이터 (summaries, season_members): 삭제 시점에 즉시 SET NULL
- 향후 집계 통계: 태생적으로 익명 (집계 테이블에 user_id 넣지 않으면 됨)
- pre-aggregation은 현재 규모(시즌당 ~50명)에서 불필요

---

## 검증 체크리스트

- [ ] 테스트 계정 생성 + 요약본 작성 + 시즌 멤버 등록
- [ ] 관리자 페이지에서 계정 삭제 실행
- [ ] 요약본 내용 보존, author_id=NULL 확인
- [ ] season_members 행 보존, user_id=NULL 확인
- [ ] 뷰에서 탈퇴 멤버 요약본 개별 표시 확인
- [ ] UI에서 "탈퇴한 멤버" 텍스트 표시 확인
