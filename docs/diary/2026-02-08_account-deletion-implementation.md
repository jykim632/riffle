# 2026-02-08 계정 삭제 프로세스 구현

## 작업 내용

2/7 설계 문서 기반으로 계정 삭제 익명화 보존 정책 전체 구현. DB 마이그레이션 → 타입/프론트엔드 → 서버 액션 → 관리자 UI → 설계 문서 확정까지.

### 변경 파일 (11개)

| 파일 | 변경 |
|---|---|
| `supabase/migrations/013_account_deletion_fk.sql` | FK 정책 변경 마이그레이션 (새 파일) |
| `src/lib/types/database.ts` | author_id, user_id nullable 타입 변경 |
| `src/lib/actions/admin/members.ts` | `deleteUserAccountAction()` 추가 |
| `src/components/admin/members/members-list.tsx` | 삭제 버튼 + 확인 다이얼로그 |
| `src/app/(dashboard)/summaries/page.tsx` | 탈퇴 멤버 표시 |
| `src/app/(dashboard)/summaries/[id]/page.tsx` | 탈퇴 멤버 표시 + 버전 히스토리 비활성 |
| `src/app/(dashboard)/mine/[id]/page.tsx` | author_id null 리다이렉트 |
| `src/app/(dashboard)/mine/page.tsx` | 타입 nullable 반영 |
| `src/app/(dashboard)/dashboard/page.tsx` | author_id select 추가 |
| `src/components/dashboard/current-week-summaries.tsx` | 탈퇴 멤버 표시 |
| `docs/design/ACCOUNT_DELETION.md` | 상태 "확정/구현 완료" |

## 왜 했는지

2/7에 설계만 해두고 season_members 처리를 미결로 남겨뒀었음. 통계 데이터 보존 필요성 관점에서 재검토 후 SET NULL(Option B)로 확정하고, 전체 구현까지 완료.

## 결정된 내용

### season_members: SET NULL (Option B) 최종 확정

기존 3가지 선택지에서 B를 선택한 이유:
- COUNT(*)로 시즌별 참여 인원 보존 — 통계에 충분
- PostgreSQL UNIQUE는 NULL 중복 허용 — 여러 탈퇴자 공존 가능
- display_name 스냅샷(Option C)은 YAGNI

### 계정 삭제 트리거: 관리자 전용

본인 삭제 UI 없음. 관리자 멤버 관리 페이지에서만 실행 가능. 본인 삭제 방지 guard 포함.

### 뷰 수정: COALESCE 패턴

```sql
DISTINCT ON (week_id, COALESCE(author_id, id))
```
- 활성 유저: author_id로 그룹핑 (기존 동일)
- 탈퇴 유저: summary id로 그룹핑 (개별 표시)

## 고민/발견

### invite_codes FK가 NO ACTION이었음
schema.sql에서 `created_by`/`used_by`에 ON DELETE 액션을 명시하지 않아서 기본값 NO ACTION 상태였음. 계정 삭제 시 profiles 삭제가 차단될 수 있는 상황. SET NULL로 명시 전환.

### mine/[id] 페이지의 null 처리
`summary.author_id !== user.id` 비교에서 author_id가 null이면 항상 true라 리다이렉트되긴 하지만, 명시적으로 `!summary.author_id` guard를 앞에 추가. 의도를 코드에서 명확히 드러내는 게 나음.

### 대시보드 페이지에서 author_id 누락
기존에 `first_summaries`에서 `id, content, created_at, profiles(nickname)`만 select하고 있었는데, `author_id`를 빠뜨리면 프론트에서 null 판별이 안 됨. select에 추가하고 컴포넌트 인터페이스도 수정.

## 난이도

중간. 설계가 이미 잡혀 있어서 구현 자체는 수월했지만, nullable 변경의 파급 범위를 정확히 추적하는 게 핵심이었음. 11개 파일에 걸쳐 타입/쿼리/UI를 일관되게 맞춰야 해서 빠뜨리기 쉬운 지점이 많았음.

## 남은 것

1. **마이그레이션 실행**: Supabase에서 `013_account_deletion_fk.sql` 실행 필요
2. **실제 테스트**: 테스트 계정 생성 → 요약본 작성 → 삭제 → 보존 확인
3. **배포 순서**: 마이그레이션 먼저 → 코드 배포 (타입이 nullable 기대하므로)

## 다음 액션

- Supabase Dashboard에서 마이그레이션 실행
- dev 환경 배포 후 테스트 계정으로 삭제 플로우 검증
- 검증 완료 후 main 머지 + prod 배포
