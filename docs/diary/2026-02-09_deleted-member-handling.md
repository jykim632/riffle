# 삭제된 멤버 처리 개선

**날짜**: 2026-02-09
**mode**: log
**난이도**: 낮음

## 작업한 내용

계정 삭제 후 남는 데이터 잔여물 처리를 두 곳에서 개선:

### 1. 대시보드 시즌 배너 - 삭제된 멤버 숨기기
- `season_members`에서 `user_id`가 null인 항목(CASCADE 삭제로 프로필 사라진 멤버) 필터링
- `.filter((m) => m.user_id !== null)` 한 줄 추가로 해결

### 2. 관리자 멤버 페이지 - 유령 계정 표시
- `auth.users`와 `profiles` 테이블을 비교해 프로필 없는 유령 계정 분리
- `MembersList` 컴포넌트에 `orphanUsers` prop 추가
- 멤버 테이블 하단에 별도 섹션으로 표시 (이메일, 로그인 방식, 가입일, 삭제 버튼)
- 기존 `deleteUserAccountAction` 재활용

## 왜 했는지

계정 삭제 기능 구현 후 후처리가 미비했음:
- `profiles`는 CASCADE로 삭제되지만, `season_members.user_id`는 SET NULL 처리됨
- 대시보드 시즌 배너에 삭제된 멤버가 "알 수 없음"으로 표시되는 UX 문제
- auth.users에만 남아있는 유령 계정(가입만 하고 프로필 생성 전 중단, 또는 비정상 상태)을 관리자가 확인/정리할 방법이 없었음

## 결정된 내용

| 결정 | 이유 |
|------|------|
| JS 레벨 필터링 (`filter`) | Supabase 쿼리에 `.not()` 추가보다 간결하고, 이미 가져온 데이터에서 처리 |
| 유령 계정 별도 섹션 분리 | 정상 멤버와 혼재하면 혼란, 성격이 다른 데이터이므로 UI 분리 |
| `deleteUserAccountAction` 재활용 | 새 server action 불필요, 기존 로직이 auth.users 삭제 그대로 수행 |
| Ghost 아이콘 사용 | lucide-react에서 유령 계정 개념에 직관적으로 매칭되는 아이콘 |

## 수정 파일

1. `src/app/(dashboard)/dashboard/page.tsx` — user_id null 필터링 (1줄)
2. `src/app/admin/members/page.tsx` — orphanUsers 분리 로직 (+11줄)
3. `src/components/admin/members/members-list.tsx` — OrphanUser 인터페이스, 유령 계정 섹션 UI (+80줄)

## 남은 것

- 유령 계정이 실제로 존재하는 환경에서 UI 확인 필요 (현재 dev 환경에서는 유령 계정 없을 수 있음)
- `season_members`에 user_id가 null인 row 자체를 정리하는 배치 작업은 미구현 (필요 시 추가)

## 다음 액션

- dev 배포 후 실제 데이터로 동작 확인
