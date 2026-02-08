# 2026-02-08 경제지표 대시보드 구현

## 작업 내용

한국은행 ECOS API로 거시경제 지표 12개를 자동 수집하고, 대시보드 + 상세 페이지 + 관리자 페이지에서 보여주는 기능 전체 구현. 계획 → 구현 → 디버깅 → 커밋까지 한 세션에 완료.

### 신규 파일 (21개)

| 영역 | 파일 | 역할 |
|------|------|------|
| DB | `supabase/migrations/014_economic_indicators.sql` | 테이블 + RLS + 스냅샷 뷰 |
| ECOS 클라이언트 | `src/lib/ecos/constants.ts` | 12개 지표 정의 (stat_code, item_code, 주기, 단위) |
| | `src/lib/ecos/types.ts` | ECOS 응답 Zod 스키마 + NormalizedIndicator |
| | `src/lib/ecos/client.ts` | `fetchIndicator()`, `fetchAllIndicators()` |
| | `src/lib/ecos/index.ts` | re-export |
| 파이프라인 | `src/app/api/cron/indicators/route.ts` | Vercel Cron (매일 KST 09:00) |
| | `vercel.json` | Cron 스케줄 정의 |
| | `src/lib/actions/admin/indicators.ts` | 관리자 수동 갱신 + 오늘 데이터 삭제 액션 |
| 쿼리/스키마 | `src/lib/queries/indicators.ts` | 위젯용/상세용/히스토리/이전주차 쿼리 |
| | `src/lib/schemas/indicator.ts` | DB row Zod 스키마 |
| UI 공통 | `src/components/indicators/sparkline.tsx` | SVG polyline 미니 차트 |
| | `src/components/indicators/change-badge.tsx` | 변동률 배지 (상승/하락) |
| | `src/components/indicators/indicator-card.tsx` | 개별 지표 카드 |
| | `src/components/indicators/indicators-grid.tsx` | 카테고리별 그리드 |
| | `src/components/indicators/week-select.tsx` | 주차 선택 드롭다운 |
| 대시보드 | `src/components/dashboard/indicators-widget.tsx` | 핵심 4개 지표 위젯 |
| 페이지 | `src/app/(dashboard)/indicators/page.tsx` | 12개 지표 상세 페이지 |
| | `src/app/(dashboard)/indicators/loading.tsx` | 스켈레톤 로딩 |
| 관리자 | `src/app/admin/indicators/page.tsx` | 수집 현황 테이블 + 수동 수집/삭제 버튼 |
| | `src/components/admin/indicators/refresh-button.tsx` | 수집/삭제 클라이언트 버튼 |
| 문서 | `docs/features/09-economic-indicators.md` | 기능 설계 문서 |

### 수정 파일 (7개)

| 파일 | 변경 |
|------|------|
| `src/lib/types/database.ts` | `economic_indicators` 테이블 + `indicator_snapshots` 뷰 타입 |
| `src/lib/schemas/index.ts` | indicator export 추가 |
| `next.config.ts` | CSP connect-src에 `ecos.bok.or.kr` 추가 |
| `src/components/dashboard/header.tsx` | nav에 "경제지표" 링크 |
| `src/app/(dashboard)/dashboard/page.tsx` | 위젯 import + 렌더링 |
| `src/components/admin/sidebar.tsx` | 관리자 사이드바에 BarChart3 아이콘 + "경제지표" 메뉴 |
| `.env.example` | `ECOS_API_KEY`, `CRON_SECRET` 추가 |

## 왜 했는지

스터디 멤버들이 매주 경제 라디오 요약본 작성할 때 외부 사이트를 왔다갔다해야 했음. 해당 주의 주요 경제지표를 앱 안에서 바로 참고할 수 있게 하려는 것. Beads 이슈 `riffle-8wx`.

## 논의/고민 + 해결 과정

### 1. ECOS API stat_code/item_code 정확성 문제
처음 계획 단계에서 추정한 코드 vs 실제 ECOS 응답이 절반 가까이 불일치. `docs/ECOS/` 폴더의 API 개발명세서 XLS 파일들을 파싱해서 실제 코드 확인, 6개 지표 수정.

| 지표 | 기존 (틀림) | 수정 |
|------|------------|------|
| 미국 기준금리 | `902Y003` | `902Y006` (주요국 중앙은행 정책금리) |
| 코스닥 | itemCode `0002000` | `0089000` |
| GDP 성장률 | `200Y002`/`10111` | `902Y015`/`KOR` (국제 주요국 경제성장률) |
| 실업률 | `I16A` | `I61BC` + itemCode2 `I28A` (원계열) |
| 무역수지 | `101` | `100000` (상품수지) |
| 국제유가 | `902Y004`/`DU` | `902Y003`/`010102` (국제상품가격, 주기 daily→monthly) |

### 2. ECOS 응답 Zod 파싱 전면 실패
ECOS가 미사용 필드를 `null`로 반환하는데 Zod `.optional()`은 `undefined`만 허용 → **전체 지표** 파싱 실패. `.nullish()`로 수정. 추가로 `ITEM_CODE4`, `ITEM_NAME4`, `WGT` 필드도 응답에 포함되는데 스키마에 빠져있었음 → 추가.

### 3. ECOS API 페이지네이션 함정
요청 `1/5`는 "전체 결과 중 1번~5번째"인데, ECOS가 시간순 오름차순으로 반환해서 30일 범위의 **가장 오래된 5건**만 가져옴 → 기준일이 항상 1월 15일. 일간 `1/50`, 월간/분기 `1/20`으로 변경해서 최신 데이터 확보.

### 4. URL 구성
ECOS API 명세상 빈 item_code 자리에 `?`를 넣어야 함. 기존에는 `.filter(Boolean)`로 빈 문자열 제거 → URL 포맷 불일치. `?` placeholder로 수정.

### 5. 날짜 기준
ECOS 데이터는 당일에 아직 안 올라올 수 있음. endDate를 어제(KST) 기준으로 변경.

### 6. weeks.id 타입 불일치
`weeks.id`가 `text` 타입인데 FK를 `UUID`로 걸어서 migration 실패. `TEXT`로 수정.

### 7. 중복 수집 방지
같은 날(KST) 이미 수집된 데이터가 있으면 cron/수동 모두 스킵. + 관리자가 오늘 데이터를 삭제하고 재수집할 수 있는 기능 추가.

## 결정된 내용

- 데이터 소스: 한국은행 ECOS API (무료)
- 갱신: Vercel Cron 매일 UTC 00:00 (KST 09:00) + 관리자 수동 갱신/삭제
- 저장: `economic_indicators` 테이블, `indicator_snapshots` 뷰 (DISTINCT ON)로 주차별 최신값
- 차트: 커스텀 SVG 스파크라인 (외부 의존성 0)
- 중복 방지: 같은 날(KST) 같은 주차 데이터 있으면 스킵
- RLS: authenticated 읽기 전용, 쓰기는 service_role만
- 날짜 기준: 어제(KST) 기준으로 조회

## 난이도/발견

- **ECOS API 문서 신뢰도 낮음**: stat_code/item_code 추정값이 절반 가까이 틀림. 프로젝트 내 XLS 명세서 + 실제 API 호출 둘 다 필요. 웹에서 찾을 수 있는 블로그/GitHub 예제들도 코드가 제각각
- **Zod `.optional()` vs `.nullish()` 차이**: 외부 API 연동에서 치명적. 외부 데이터 파싱할 때는 `.nullish()` 기본 사용 원칙 세워야 함
- **ECOS 페이지네이션이 직관적이지 않음**: `startCount/endCount`가 offset/limit가 아니라 결과 내 행 번호. 충분히 큰 값을 줘야 최신 데이터 확보 가능
- **ECOS rate limit 미명시**: 순차 호출 + 100ms 딜레이로 보수적 접근. 12개 지표 전부 가져오는 데 약 2초

## 남은 것

- [ ] 12개 지표 전부 정상 수집 최종 확인 (수정된 코드로 재테스트)
- [ ] 스파크라인 히스토리 데이터 연동 (현재 빈 배열 전달 중 — 여러 주차 데이터 쌓인 후)
- [ ] feature docs (`docs/features/09-economic-indicators.md`) 수정사항 반영 (코드 수정 내역 동기화)
- [ ] 브랜치 푸시 + PR

## 다음 액션

1. dev 서버에서 오늘 데이터 삭제 → 재수집 → 12개 전부 성공 확인
2. 확인 후 `feature/economic-indicators` 브랜치 푸시 + PR
3. 스파크라인 히스토리는 데이터 쌓인 후 별도 작업

## 서랍메모

- ECOS `StatisticItemList` 서비스로 각 stat_code의 가용 item_code 목록 조회 가능 → 코드 검증 자동화에 활용 가능
- 월간/분기 지표는 매일 cron 돌려도 새 값 없으면 동일 값 반환 → `DISTINCT ON` 뷰가 중복 처리
- `WGT` 필드는 `string | number | null` 다양하게 옴 → Zod `z.union([z.string(), z.number()]).nullish()` 처리
- ECOS API 기본 정렬이 시간순 오름차순이라 "최근 N건"을 받으려면 큰 endCount + 마지막 row 사용해야 함

## 내 질문 평가

- **"중복 수집은 막을까?"** → 운영상 꼭 필요한 기능. 좋은 타이밍
- **"관리자 페이지에 넣어줄까?"** → 수동 수집 UI 없으면 Cron 실패 시 대응 불가. 맞는 판단
- **"오늘 수집한 데이터 삭제하는 기능도 추가해줘"** → 중복 방지와 짝이 되는 기능. 삭제 → 재수집 플로우 완성
- **"기준일이 왜 다르지?"** → ECOS 페이지네이션 버그 발견의 핵심 질문. 이거 안 물어봤으면 계속 1월 데이터 보여줬을 것
