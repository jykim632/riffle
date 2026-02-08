# 2026-02-08 대시보드 개선 (공부방 링크 + 시즌 배너 + 프로필 설정)

## 작업 내용

두 커밋으로 나눠서 진행.

### 커밋 1: 헤더에 손경제 공부방 바로가기 링크 추가

| 파일 | 작업 |
|------|------|
| `src/components/dashboard/header.tsx` | Radio 아이콘 + "손경제 홈페이지" 링크 버튼 추가 |

- MBC "이진우의 손에잡히는 경제" 공부방 게시판 외부 링크
- 기존 가이드 버튼과 동일한 Tooltip + Button 패턴
- 데스크톱: 아이콘 + 텍스트, 모바일: 아이콘만 (`hidden sm:inline`)
- `target="_blank"` + `rel="noopener noreferrer"`

### 커밋 2: 시즌 배너, 프로필 설정, 사용자 메뉴 개선

| 파일 | 작업 |
|------|------|
| `src/components/dashboard/season-banner.tsx` | 신규 - 시즌 종합 배너 (멤버, 주차 현황) |
| `src/app/(dashboard)/dashboard/page.tsx` | SeasonBanner 통합 + 레이아웃 구조 변경 |
| `src/app/(dashboard)/settings/profile/page.tsx` | 신규 - 프로필 설정 페이지 |
| `src/app/(dashboard)/settings/profile/profile-form.tsx` | 신규 - 닉네임 변경 폼 |
| `src/actions/profile.ts` | 신규 - 프로필 업데이트 서버 액션 |
| `src/lib/schemas/profile.ts` | 신규 - 프로필 Zod 스키마 |
| `src/lib/schemas/index.ts` | profile 스키마 re-export 추가 |
| `src/components/dashboard/user-menu.tsx` | '내 정보' 메뉴 항목 추가, hasPassword prop 제거 |
| `src/app/(dashboard)/layout.tsx` | 레이아웃 미세 조정 |

## 왜 했는지

- **공부방 링크**: 멤버들이 매번 외부에서 MBC 공부방 URL을 찾아야 하는 불편함 해소. talkbbs.imbc.com이 클라이언트 JS 전용 렌더링이라 게시글 목록 직접 가져오기는 불가능 → 외부 링크로 결정.
- **시즌 배너**: 대시보드 상단에 시즌 전체 현황(몇 주차/총 주차, 멤버 목록) 한눈에 보이도록.
- **프로필 설정**: 닉네임 변경 기능 필요.

## 논의/고민

### 공부방 링크 위치
처음에 대시보드 하단 Card 컴포넌트로 만들었는데 → 너무 안 보임 → SeasonBanner 위로 이동 → 여전히 스크롤 필요할 수 있음 → **최종: 헤더에 아이콘 버튼으로 배치**. 모든 페이지에서 항상 접근 가능.

별도 `study-resources.tsx` 컴포넌트를 만들었다가 헤더로 옮기면서 삭제함. 단순 외부 링크 하나에 별도 컴포넌트는 과잉.

## 결정된 내용

- 공부방 링크는 **헤더 우측** (주차 배지 옆)에 고정
- 배치 순서: `[N주차 배지] [📻 손경제 홈페이지] [📖 가이드] [사용자 메뉴]`
- 링크 텍스트는 "손경제 홈페이지"로 사용자가 직접 수정

## 난이도/발견

- 난이도: 낮음
- 링크 위치 선정이 핵심. 기능 구현 자체보다 "어디에 놓을 것인가"가 UX 결정의 본질이었음.

## 남은 것

- 없음. 공부방 링크는 완료.
- 나머지 커밋(시즌 배너, 프로필 설정)은 이전 세션에서 작업한 내용의 커밋 정리.

## 다음 액션

- `bd ready`로 다음 작업 확인
