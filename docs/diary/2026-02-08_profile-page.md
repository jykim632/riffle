# 2026-02-08 내 정보(프로필) 페이지 추가

## 작업 내용

사용자가 자기 정보를 확인하고 닉네임을 수정할 수 있는 프로필 페이지 신규 구현. 기존에 user-menu에 흩어져 있던 비밀번호 변경 링크를 프로필 페이지로 통합.

### 생성/수정 파일 (7개)

| 파일 | 작업 |
|------|------|
| `src/lib/schemas/profile.ts` | 신규 - `updateNicknameSchema` Zod 스키마 |
| `src/lib/schemas/index.ts` | profile 스키마 re-export 추가 |
| `src/actions/profile.ts` | 신규 - `updateNickname` 서버 액션 |
| `src/app/(dashboard)/settings/profile/page.tsx` | 신규 - Server Component (데이터 fetch) |
| `src/app/(dashboard)/settings/profile/profile-form.tsx` | 신규 - Client Component (폼 + 시즌 표시) |
| `src/components/dashboard/user-menu.tsx` | "내 정보" 메뉴 추가, 비밀번호 변경 항목 제거 |
| `src/components/dashboard/header.tsx` + `layout.tsx` | `hasPassword` prop 제거 (프로필 페이지로 이동) |

### 표시 정보

| 항목 | 소스 | 수정 가능 |
|------|------|-----------|
| 이메일 | `user.email` | X (읽기 전용) |
| 닉네임 | `profiles.nickname` | O (인라인 수정) |
| 역할 | `profiles.role` | X (Badge) |
| 가입일 | `profiles.created_at` | X |
| 참여 시즌 | `season_members` JOIN `seasons` | X (목록 표시) |
| 비밀번호 변경 | 링크 버튼 | — (이메일 가입자만) |

## 왜 했는지

- 비밀번호 변경 페이지만 존재하고, 사용자가 자기 정보를 확인할 곳이 없었음
- user-menu 드롭다운에서 바로 로그아웃으로 이어지는 구조 → "내 정보" 허브 페이지가 필요
- 닉네임 수정 기능도 없어서 관리자에게 요청해야 했음

## 논의/고민

- **카드 vs 넓은 레이아웃**: 처음에 `settings/password` 패턴 따라 `max-w-md` Card로 만들었는데, 대시보드 내 페이지치고 너무 좁았음. `max-w-4xl` + 2컬럼 카드 레이아웃으로 변경
- **hasPassword prop 전파 제거**: user-menu에서 비밀번호 변경 항목을 제거하면서 header → layout까지 전파되던 `hasPassword` prop을 깔끔하게 제거. 프로필 페이지에서만 판단
- **시즌 정보 추가**: `season_members` 테이블이 다중 시즌 참여를 지원하는 구조여서, 참여 시즌 목록을 프로필에 표시하기로 결정

## 결정된 내용

- 닉네임 검증 규칙은 회원가입 스키마와 동일하게 유지 (한글/영문/숫자/_ , 1~20자)
- `revalidatePath('/', 'layout')` — 닉네임 변경 시 헤더 닉네임도 즉시 갱신
- 데스크톱: 좌측 "계정 정보" / 우측 "참여 시즌" 2컬럼 카드
- 모바일: 세로 스택으로 폴백

## 난이도/발견

- 난이도: 낮음. 기존 패턴(password 페이지, server action 구조) 그대로 따라감
- `hasPassword` prop이 layout → header → user-menu로 3단계 전파되고 있었는데, 프로필 페이지 도입으로 깔끔하게 정리됨
- Supabase JOIN에서 `seasons` 결과가 배열/단일 객체 둘 다 올 수 있어서 `Array.isArray` 방어 필요 (기존 코드 패턴과 동일)

## 남은 것

- 닉네임 중복 검사 미구현 (DB unique constraint도 없음 — 현재 소규모라 문제없지만 추후 고려)
- 프로필 이미지/아바타 기능은 스코프 밖

## 다음 액션

- 없음. 기능 완성 상태.
