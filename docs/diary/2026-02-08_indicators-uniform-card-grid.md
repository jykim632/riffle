# 2026-02-08 경제지표 UI 균일 카드 그리드 리디자인

## 작업한 내용

경제지표 페이지의 이중 구조(Featured 큰 카드 + Compact 행)를 폐지하고, 모든 12개 지표를 동일한 `IndicatorCard` 컴포넌트로 통일한 균일 카드 그리드로 리디자인.

**변경 파일:**
- `indicator-card.tsx` — 통합 카드 컴포넌트 신규 생성
- `indicators-grid.tsx` — 전면 재작성 (이중 구조 → 균일 그리드)
- `sparkline.tsx` — width에 string("100%") 지원 추가
- `date.ts` — 분기 형식(YYYYQN) 파싱 추가
- `featured-indicator-card.tsx` — 삭제
- `compact-indicator-row.tsx` — 삭제
- `change-badge.tsx` — 삭제

**결과:** 7파일 변경, 138줄 추가 / 353줄 삭제 (순 -215줄)

## 왜 했는지

이전 v1 리디자인은 padding/font-size 미세 조정 수준이라 체감 차이가 없었음. 근본 원인은 Featured(크고 스파크라인) + Compact(작고 다른 포맷) 이중 구조 자체. 총 12개 지표에 두 가지 표현 방식은 과잉 설계. indexergo.com 참고하여 하나의 균일한 포맷으로 통일.

## 논의/결정

| 논의 | 결정 |
|------|------|
| 카테고리 태그(우상단) 필요? | 라벨에서 이미 뻔한 정보 → 제거 |
| 데이터 없을 때 "─" placeholder? | 불필요한 자리 차지 → 그냥 안 보여줌 |
| 단위+날짜 한 줄 표시 | 각각 별도 줄로 분리 |
| GDP 성장률 날짜 NaN | ECOS API가 분기를 "2024Q4"로 반환 → toDate()에 YYYYQN 파싱 추가, formatDate()에서 "2024년 4Q"로 표시 |

## 발견

- ECOS API의 `TIME` 필드 형식이 주기(cycle)에 따라 다름: daily=YYYYMMDD, monthly=YYYYMM, quarterly=YYYYQN. 기존 date 유틸이 quarterly를 처리 못해서 NaN 발생.
- Sparkline에 `preserveAspectRatio="none"` + CSS width 조합으로 카드 너비에 맞춘 반응형 차트 구현 가능.

## 남은 것

- 대시보드 MarketSummaryWidget에 미니 스파크라인 추가 — scope 확대로 이번 작업에서 제외
- previousValue(전일 대비 변동률) 데이터가 없는 지표들 → 데이터 수집 로직 확인 필요

## 다음 액션

- 배포 후 실제 데이터로 12개 카드 그리드 레이아웃 확인
- 모바일(2열), 태블릿(3열), 데스크탑(4열) 반응형 검증
