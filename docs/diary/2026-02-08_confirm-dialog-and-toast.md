# 2026-02-08 공통 ConfirmDialog + Sonner Toast 도입

## 작업한 내용

### 1. 공통 ConfirmDialog 컴포넌트 생성
- `src/components/confirm-dialog.tsx` 신규 생성
- AlertDialog(shadcn/ui) 기반 재사용 가능한 확인 모달
- trigger 모드(uncontrolled) + open/onOpenChange 모드(controlled) 지원
- `variant="destructive"` → 빨간 확인 버튼
- `loading` 상태 시 자동으로 `"X 중..."` 텍스트 표시

### 2. 모든 삭제 동작에 ConfirmDialog 적용
| 위치 | 이전 상태 | 변경 |
|------|-----------|------|
| 댓글 삭제 (comment-item.tsx) | 확인 없이 즉시 삭제 | ConfirmDialog 추가 |
| 요약본 삭제 (summary-actions.tsx) | 인라인 AlertDialog | ConfirmDialog로 교체 |
| 초대코드 삭제 (invite-codes-list.tsx) | 브라우저 `confirm()` | ConfirmDialog로 교체 |
| 계정 삭제 (members-list.tsx) | 인라인 AlertDialog | ConfirmDialog로 교체 |
| 비밀번호 초기화 (members-list.tsx) | 인라인 AlertDialog | ConfirmDialog로 교체 |

### 3. Sonner Toast 도입
- sonner 패키지 설치 (`npx shadcn@latest add sonner`)
- root layout에 `<Toaster />` 추가
- 9개 파일 21개 `alert()` 호출 → `toast.success()` / `toast.error()` 전면 교체
- sonner.tsx에서 불필요한 `next-themes` (useTheme) 의존성 제거

## 왜 했는지 (맥락)
- 삭제 동작의 UX가 파일마다 제각각이었음 (확인 없음 / browser confirm / 인라인 AlertDialog)
- `alert()`는 브라우저 네이티브 다이얼로그라 디자인 통일이 안 됨 + 스레드 블로킹
- 공통 컴포넌트 없이 각 파일에서 AlertDialog를 20줄씩 복붙하는 패턴이 반복되고 있었음

## 논의/아이디어/고민
- **ConfirmDialog API 설계**: trigger 기반(uncontrolled) vs open/onOpenChange(controlled) → 둘 다 지원하기로 함. 대부분은 trigger 모드로 충분하고, summary-actions처럼 외부 상태 제어가 필요한 경우만 controlled 사용
- **Toast 라이브러리 선택**: sonner vs shadcn/ui Toast → sonner 선택. API가 `toast('메시지')` 한 줄로 단순하고, shadcn 공식 추천
- **manage-members-dialog 제외**: 시즌 멤버 제거는 체크박스 토글 + 저장 방식이라 개별 삭제 확인이 부자연스러움. 의도적으로 제외
- **next-themes 의존성**: shadcn이 생성한 sonner.tsx가 `useTheme`을 쓰는데 프로젝트에 ThemeProvider가 없음 → theme을 "light"로 하드코딩

## 결정된 내용
- 모든 파괴적 동작(삭제, 초기화 등)은 반드시 ConfirmDialog 경유
- 사용자 피드백은 toast로 통일 (성공: `toast.success`, 에러: `toast.error`)
- `alert()` 사용 금지 (코드베이스에서 완전 제거됨)

## 느낀 점/난이도/발견
- **난이도**: 낮음. 패턴이 반복적이라 기계적 교체 작업
- **발견**: shadcn의 AlertDialogAction이 이미 `variant` prop을 지원해서 className으로 destructive 스타일링할 필요 없었음
- loading 텍스트 패턴이 한국어에서 `"X 중..."`으로 일관적이라 자동화 가능했음

## 남은 것/미정
- 다크모드 도입 시 sonner.tsx의 theme 하드코딩을 useTheme으로 복원 필요
- toast duration 커스터마이즈 (현재 기본값 사용)

## 다음 액션
- 새로운 기능 추가 시 alert() 대신 toast 사용
- 삭제/파괴적 동작 추가 시 ConfirmDialog 사용

## 커밋
- `c1628ea` feat: 공통 ConfirmDialog 컴포넌트 + 모든 삭제 동작에 확인 모달 적용
- `acd2222` feat: sonner toast 도입 + 전체 alert() → toast 교체
