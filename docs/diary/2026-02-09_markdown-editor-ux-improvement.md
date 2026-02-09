# 2026-02-09 마크다운 에디터 UX 개선

## 작업 내용

### summary-form.tsx: 2컬럼 → 단일 Card + Tabs 구조
- `grid lg:grid-cols-2` 레이아웃 제거
- 하나의 Card 안에 Tabs(편집/미리보기)로 전환하는 구조로 변경
- shadcn/ui `tabs` 컴포넌트 새로 추가 (`pnpm dlx shadcn@latest add tabs`)
- 미리보기 영역에 기존 `SummaryContent` 재사용
- CardDescription 제거해서 카드 헤더 간결하게
- 글자수 안내/검증 에러를 탭 바깥(하단)으로 이동해서 탭 전환과 무관하게 항상 보이도록

### markdown-editor.tsx: 툴바 정리 + 에디터 설정
- **툴바 커스텀**: bold, italic, strikethrough, title, unorderedList, orderedList, link, quote만 남김
- **extraCommands=[]**: 우측 fullscreen/프리뷰 토글 버튼 전부 제거
- **highlightEnable={false}**: 구문 하이라이트 끔 (비개발자 대상)
- **반응형 높이**: `height={400}` 고정 → `minHeight={200}`, `maxHeight={500}`, `height={300}`, `visibleDragbar={true}`
- **placeholder 개선**: 영어 예시 → 한글 안내 문구

### globals.css: 에디터 스타일링
- 폰트: `var(--font-mono)` → `var(--font-sans), system-ui, sans-serif` (모노스페이스 → 본문체)
- 크기: `0.875rem` → `0.9375rem` (14px → 15px)
- 줄간격: `1.5` → `1.6`
- 툴바: `flex-wrap: wrap` 추가 (모바일에서 오버플로 방지)

### 페이지 레이아웃 폭 축소
- `summaries/new/page.tsx`, `summaries/[id]/edit/page.tsx`: `max-w-7xl` → `max-w-4xl`
- 단일 카드 레이아웃에 맞게 좁힘

## 왜 했는지

- 2컬럼(에디터+미리보기) 구조가 공간 낭비. 에디터 자체 프리뷰 기능을 끄고 별도 카드에 보여주는 이상한 구조였음
- 모노스페이스 폰트 + 개발자용 툴바(이미지, 코드블록, 테이블, fullscreen 등)가 비개발자 사용자에게 불필요
- 모바일에서 2컬럼이 깨지고, 툴바가 오버플로되는 문제

## 결정된 내용

| 항목 | Before | After |
|------|--------|-------|
| 레이아웃 | 2컬럼 (에디터 카드 + 미리보기 카드) | 단일 Card + Tabs(편집/미리보기) |
| 페이지 폭 | max-w-7xl | max-w-4xl |
| 에디터 높이 | 고정 400px | min 200 / default 300 / max 500 + 드래그바 |
| 폰트 | monospace 14px | sans-serif 15px |
| 툴바 | 전체 기본 commands + fullscreen/preview | bold/italic/strikethrough/title/list/link/quote만 |
| 구문 하이라이트 | ON | OFF |

## 난이도/발견

- 난이도 낮음. `@uiw/react-md-editor`의 `commands` import로 개별 커맨드 지정 가능
- `minHeight`/`maxHeight`/`visibleDragbar` 조합으로 사용자가 높이 조절 가능
- Tabs 전환 시 에디터 상태(content)가 유지됨 — React state가 Card 레벨에 있으니까 탭 전환해도 문제 없음

## 남은 것/미정

- 다크 모드 지원 (`next-themes` ThemeProvider): 별도 작업으로 분리됨
- 실제 모바일 기기에서 드래그바 UX 확인 필요
- 에디터 높이 기본값(300px) 적절한지 사용 후 피드백 반영

## 다음 액션

- develop 배포 후 모바일/태블릿에서 실 사용 테스트
- 사용자 피드백에 따라 툴바 항목 추가/제거 조정 가능
