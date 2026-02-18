# 대시보드 데스크톱 그리드 레이아웃 적용

**날짜**: 2026-02-09
**mode**: log

---

## 작업 내용

- 대시보드 페이지에 데스크톱(lg+) 2컬럼 그리드 레이아웃 적용
- MarketSummaryWidget을 대시보드에서 제거 (헤더 티커와 중복)
- 각 카드에 `h-full` 적용하여 같은 행 높이 매칭

## 왜 했는지

대시보드가 모든 뷰포트에서 단일 컬럼 수직 스택이었음. `max-w-7xl`(1280px) 너비에 카드가 1열로만 쌓여서 데스크톱에서 공간 낭비가 심했음. 반응형 패딩/폰트 조정은 있었지만 페이지 레벨 그리드 배치가 없었음.

## 논의/고민

1. **그리드 구조 선택**: 처음에 왼쪽 사이드바(WeekOverview + MarketSummary) / 오른쪽 메인(CurrentWeekSummaries) 구조로 갔는데, 같은 행 카드 높이가 안 맞는 문제 발생
2. **2x2 그리드 vs 사이드바**: 사이드바 방식은 왼쪽 div 래퍼 때문에 CSS grid 행 높이 매칭이 안 됨. 래퍼를 제거하고 4개 카드를 직접 그리드에 배치하는 2x2 방식으로 전환
3. **MarketSummaryWidget 제거**: 헤더에 경제지표 티커가 이미 있어서 중복. 제거하니 레이아웃도 깔끔해짐
4. **SeasonBanner 전체 너비**: 시즌 정보는 넓게 보는 게 자연스러워서 `lg:col-span-full`로 처리

## 결정된 내용

- 최종 레이아웃: `lg:grid-cols-[2fr_3fr]` (40/60 비율)
  - Row 1: WeekOverview(40%) | CurrentWeekSummaries(60%) — 높이 동일
  - Row 2: SeasonBanner(100%) — 전체 너비
- 모바일은 기존과 동일한 수직 스택 유지
- MarketSummaryWidget은 대시보드에서만 제거 (컴포넌트 파일은 유지)

## 난이도/발견

- 난이도: 낮음
- CSS grid의 `align-items: stretch` 기본 동작 + 카드 `h-full`로 행 높이 매칭이 자연스럽게 됨
- 래퍼 div로 카드를 묶으면 grid 행 높이 매칭이 깨진다는 점 재확인

## admin 페이지 접근 제어 확인

세션 초반에 admin 페이지 접근 제어 상태도 점검함:
- Layout 레벨: `requireUser()` + `isAdmin()` → 비관리자에게 `notFound()` (404)
- Server Action 레벨: `requireAdmin()` 가드
- UI 레벨: Header/MobileNav 모두 `{isAdmin && ...}` 조건부 렌더링
- 결론: 일반 사용자는 admin 페이지 존재 자체를 알 수 없음 (링크 숨김 + 404 반환)

## 남은 것

- MarketSummaryWidget 컴포넌트 파일 자체 삭제 여부 (다른 곳에서 사용 안 하면 정리 가능)
- 대시보드 외 다른 페이지(게시판, 경제지표 등)도 데스크톱 레이아웃 최적화 필요 여부 확인

## 질문 평가

- "admin 페이지 막혀있는지?" → 좋은 보안 점검 질문. 3중 보호 구조 확인
- "데스크톱 뷰 고려 안 되어 있는 거 아닌가?" → 정확한 지적. 모바일 퍼스트로 만들다가 데스크톱 그리드 배치를 놓친 부분
- "MarketSummary 빼자, 헤더에 이미 있잖아" → 중복 제거 판단 정확
