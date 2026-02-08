# 2026-02-08 경제지표 티커 바 + 날짜 포맷 통일

## 작업 내용

두 가지 작업을 한 세션에 처리:

1. **경제지표 티커 바**: 모든 대시보드 페이지 헤더 아래에 핵심 4개 지표(원/달러, 코스피, 기준금리, CPI) 상시 노출
2. **날짜 포맷 통일**: 프로젝트 전체 날짜 표시를 `YYYY-MM-DD` 형식으로 표준화

### 신규 파일

| 파일 | 역할 |
|------|------|
| `src/components/dashboard/indicators-ticker.tsx` | 티커 바 Server Component (layout에서 렌더링) |

### 수정 파일

| 파일 | 변경 |
|------|------|
| `src/lib/utils/date.ts` | 유틸 함수 6개로 확장, `.` → `-` 구분자, YYYYMMDD 파싱 지원 |
| `src/app/(dashboard)/layout.tsx` | 티커 데이터 fetch + 렌더링 추가 |
| `src/app/(dashboard)/dashboard/page.tsx` | IndicatorsWidget → MarketSummaryWidget 교체 |
| `src/app/(dashboard)/summaries/page.tsx` | `toLocaleDateString` → `formatDate()` |
| `src/app/(dashboard)/summaries/[id]/page.tsx` | `toLocaleDateString` → `formatDate()` |
| `src/app/(dashboard)/settings/profile/profile-form.tsx` | 로컬 formatDate 함수 제거, 유틸 import |
| `src/app/admin/indicators/page.tsx` | `toLocaleString` → `formatDateTime()`, time_label → `formatDate()` |
| `src/components/admin/invite-codes/invite-codes-list.tsx` | date-fns `format()` → `formatDateTime()` |
| `src/components/admin/seasons/seasons-list.tsx` | date-fns `format()` → `formatDate()` |
| `src/components/admin/weeks/weeks-list.tsx` | date-fns `format()` → `formatShortDateWithDay()` |
| `src/components/admin/members/members-list.tsx` | date-fns `format()` → `formatDate()` |
| `src/components/indicators/indicator-card.tsx` | time_label → `formatDate()` |
| `src/components/summaries/week-select.tsx` | 로컬 formatDateRange → `formatShortDateRange()` |
| `src/components/indicators/week-select.tsx` | 로컬 formatDateRange → `formatShortDateRange()` |

## 왜 했는지

### 티커 바
경제지표가 `/indicators` 전용 페이지와 대시보드 홈 위젯에서만 보였음. 스터디 멤버가 요약본 작성/열람 중에도 핵심 지표를 참고할 수 있도록 모든 페이지에 상시 노출 필요.

### 날짜 포맷 통일
프로젝트 내 날짜 표시가 3가지 이상 방식으로 혼재:
- `toLocaleDateString('ko-KR')` → `2026. 2. 8.`
- date-fns `format('yyyy.MM.dd')` → `2026.02.08`
- 유틸 `formatDate()` → `2026.02.08`
- ECOS time_label → `20260208` (원본 그대로)

통일된 포맷 없이 페이지마다 날짜가 다르게 보이는 문제.

## 논의/고민

### 1. 티커 위치: sticky vs scroll
- sticky로 하면 헤더(h-16) + 티커(~32px) = 80px 이상 고정 영역 → 모바일에서 콘텐츠 영역 압박
- **결정**: 스크롤과 함께 올라가는 방식. 헤더만 sticky 유지

### 2. 날짜 구분자: `.` vs `-`
- 기존 코드는 `.` 사용 (`2026.02.08`)
- ISO 8601 표준은 `-` (`2026-02-08`)
- **결정**: `-` 채택. 국제 표준이고, DB/API 날짜와 시각적 일관성

### 3. ECOS time_label 처리
- DB에 `20260207` 형태로 저장됨 (ECOS API 원본)
- 표시 시점에 포맷팅할지 vs 저장 시점에 변환할지
- **결정**: 저장은 원본 유지, 표시 시 `toDate()` 유틸에서 `YYYYMMDD` 자동 파싱. `YYYYMM`(월간 지표)도 지원

### 4. date-fns 의존성 잔류
- 4개 admin 컴포넌트에서 date-fns 제거 완료
- `date-picker.tsx`, `create-season-dialog.tsx`는 date-fns의 `addMonths`, `PPP` 포맷 등 라이브러리 고유 기능 사용 → 유지
- 완전 제거는 calendar/date-picker UI까지 커스텀해야 해서 ROI 낮음

## 결정된 내용

### 날짜 유틸 API (`lib/utils/date.ts`)

| 함수 | 출력 | 용도 |
|------|------|------|
| `formatDate()` | `2026-02-08` | 기본 날짜 |
| `formatDateTime()` | `2026-02-08 10:30` | 날짜+시간 |
| `formatShortDate()` | `02-08` | 컴팩트 (드롭다운 등) |
| `formatShortDateWithDay()` | `02-08 (토)` | 요일 포함 |
| `formatDateRange()` | `2026-02-03 ~ 02-09` | 기간 (연도 포함) |
| `formatShortDateRange()` | `02-03 ~ 02-09` | 기간 (컴팩트) |

### `toDate()` 내부 함수 - 자동 파싱 규칙

| 입력 | 처리 |
|------|------|
| `Date` 객체 | 그대로 반환 |
| `YYYY-MM-DD` | 로컬 시간으로 파싱 (`T00:00:00` 추가) |
| `YYYYMMDD` | `-` 삽입 후 로컬 파싱 |
| `YYYYMM` | 해당 월 1일로 파싱 |
| 기타 ISO string | `new Date()` 직접 파싱 |

### 건드리지 않은 것
- ECOS API 내부 포맷 (`YYYYMMDD`) - API 규격
- `week-generator.ts` 로컬 `formatDate` - DB 저장용
- `date-picker.tsx` PPP 포맷 - shadcn/ui 컴포넌트
- `create-season-dialog.tsx` `yyyy-MM-dd` - 서버 전송용
- 숫자 `toLocaleString` - 날짜가 아닌 경제지표 값 포맷팅

## 난이도/발견

- **난이도**: 낮음. 패턴화된 작업이라 기계적으로 치환 가능
- **`toDate()` 타임존 방어**: `new Date('2026-02-08')`은 UTC로 파싱되어 KST에서 날짜가 밀릴 수 있음. `T00:00:00` 추가로 로컬 시간 파싱 강제. 기존 week-select 컴포넌트들이 이미 이 트릭을 사용하고 있었는데, 유틸로 중앙화함
- **date-fns 제거 효과**: admin 4개 컴포넌트에서 import 제거. 번들 크기 미세 감소 (tree-shaking 되긴 하지만)

## 남은 것

- [ ] `date-picker.tsx`, `create-season-dialog.tsx`의 date-fns 의존성 (필요 시 제거)
- [ ] feature/indicators-ticker 브랜치 → develop 머지
- [ ] 배포 후 모바일에서 티커 가로 스크롤 동작 확인

## 다음 액션

1. 로컬에서 여러 페이지 돌면서 날짜 포맷 일관성 최종 확인
2. 브랜치 푸시 + PR → develop 머지
3. dev 배포 후 모바일 뷰포트 확인

## 서랍메모

- 요일 이름(`일월화수목금토`)을 date-fns 없이 `DAY_NAMES` 상수로 처리. 한국어 전용이라 locale 라이브러리 불필요
- `YYYYMM` 파싱 추가한 이유: CPI(소비자물가지수), 실업률 등 월간 지표의 time_label이 `202601` 형태
- `formatDateTime`에 초(`:ss`) 안 넣은 이유: 현재 프로젝트에서 초 단위 정밀도가 필요한 곳 없음. 필요하면 별도 함수 추가

## 내 질문 평가

- **"기준일도 추가해줘"** → 티커에 맥락 부여. 숫자만 보면 언제 기준인지 모름. 핵심적인 UX 개선
- **"모든 페이지에서 사용하게 만들어"** → 경제지표 페이지의 time_label이 ECOS 원본(`20260207`)으로 표시되던 것 발견하게 한 질문. 안 물어봤으면 놓칠 뻔
- **"프로젝트 전반으로 날짜 포맷 픽스해줘"** → 기술 부채 해소. 산발적 포맷팅을 한번에 정리. 타이밍 좋았음
