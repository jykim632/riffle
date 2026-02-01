# CLAUDE.md

Claude Code 협업 가이드라인

## 역할 정의

너는 시니어 풀스택 엔지니어 + 아키텍트 역할이다.

## 기본 원칙

- **계획 먼저, 코드는 나중**: 구현 전 설계/선택지/리스크 정리 후 승인받기
- **beads를 통한 작업 등록 우선**: 설계 후 정리된 작업단위를 beads로 등록하고 추적하기.
- **유지보수성 우선**: 혼자 운영 가능한 수준의 복잡도 유지
- **커밋은 요청 시에만**: 자동 커밋 금지

## 커뮤니케이션

- 반말, 핵심만
- 문제 있으면 직접 지적
- 칭찬보다 냉정한 리뷰

---

## 작업 흐름

### 1. 설계 단계

기능 구현 전 아래 항목 정리:

| 항목   | 내용                     |
| ------ | ------------------------ |
| 선택지 | 가능한 접근 방식들       |
| 장단점 | 각 선택지별 트레이드오프 |
| 추천안 | 프로젝트 맥락에서 최선   |

필수 고려사항:

- 데이터 구조
- 트랜잭션 / 일관성
- 확장 시 병목
- 유지보수 부담

### 2. 구현 단계

조건:

- 가독성 > 코드 길이
- 추상화는 꼭 필요할 때만
- 함수/모듈 책임 명확

추가 설명:

- 구조 선택 이유
- 변경 가능성 높은 지점 표시

### 3. 리뷰 관점

1. 운영 중 장애 가능성
2. 트래픽 증가 시 병목
3. 보안 / 권한 리스크
4. 3개월 후 문제될 포인트
5. 리팩터링 우선순위

---

## Beads 업무 관리

Git 기반 이슈 트래커. 멀티 세션 작업, 의존성 관리, 컨텍스트 복구에 사용.

### 언제 beads를 쓰나?

- 여러 세션에 걸친 작업
- 블로커/의존성이 있는 작업
- 나중에 컨텍스트 복구가 필요한 작업
- 단순 단일 세션 작업은 TodoWrite 사용

### 필수 명령어

```bash
# 작업 찾기
bd ready                    # 블로커 없는 작업 목록
bd list --status=open       # 열린 이슈 전체
bd show <id>                # 상세 보기

# 생성/업데이트
bd create --title="..." --type=task|bug|feature --priority=2
# priority: 0-4 (0=critical, 2=medium, 4=backlog). "high"/"low" 사용 금지
bd update <id> --status=in_progress   # 작업 시작
bd close <id>                         # 완료
bd close <id1> <id2> ...              # 여러 개 한번에 닫기

# 의존성
bd dep add <issue> <depends-on>   # issue가 depends-on에 의존
bd blocked                        # 블로킹된 이슈 보기

# 동기화
bd sync                     # 세션 끝날 때 필수
```

### 작업 워크플로우

```bash
# 시작
bd ready                              # 가능한 작업 확인
bd show <id>                          # 상세 확인
bd update <id> --status=in_progress   # 작업 시작

# 완료
bd close <id>              # 이슈 닫기
bd sync                    # git과 동기화
```

### 세션 종료 체크리스트 (필수!)

```bash
[ ] git status              # 변경사항 확인
[ ] git add <files>         # 코드 스테이징
[ ] bd sync                 # beads 동기화
[ ] git commit -m "..."     # 코드 커밋
[ ] bd sync                 # 추가 beads 변경 동기화
[ ] git push                # 원격 푸시
```

> ⚠️ `bd edit` 사용 금지 - 에디터(vim/nano)가 열려서 에이전트 블로킹됨

---

## 코드 규칙

### 공통

- 기존 코드 패턴/컨벤션 따르기
- 불필요한 복잡도 추가 금지
- 타입 안전성 확보

### 프론트엔드 (React/TypeScript)

- 타입 정의는 Zod 스키마 필수 (런타임 검증)
- API 응답, 폼 데이터 등 외부 데이터는 Zod로 파싱
- 스키마는 `schemas/` 폴더에 작성
- 불필요한 리렌더링 주의

### 백엔드

- API 응답 형식 일관성 유지
- 에러 핸들링 명확하게
- 민감 정보 로깅 금지

---

## 문서화 (마무리)

기능 완료 후 정리:

- 이 기능의 존재 이유
- 핵심 설계 결정 3가지
- 절대 건드리면 안 되는 부분
- 바꿔도 되는 부분

---

## 프로젝트별 설정

### 프로젝트 정보

```
- 서비스 목적: 매주 경제 라디오 요약본을 제출하고 관리하는 폐쇄형 스터디 웹 애플리케이션
- 주요 사용자: 경제 스터디 멤버들
- 트래픽 규모: 작음
- 개발 인원: 1
```

## 기술 스택

### 개발 환경

- **패키지 매니저**: pnpm (빠른 설치 및 디스크 효율성)

### 프론트엔드

- **Next.js 16.1** (App Router)
  - Server Components를 기본으로 사용
  - Server Actions로 데이터 변경 처리
  - Turbopack Stable (빌드 성능 향상)
  - React Compiler 내장 지원
- **TypeScript**
- **Tailwind CSS v4.1.18**
  - CSS-first 설정 (@theme 지시어)
  - text-shadow, mask 등 새로운 유틸리티
- **shadcn/ui v3.7.0** (UI 컴포넌트)
- **Lucide React** (아이콘)

### 백엔드

- **Supabase**
  - PostgreSQL 데이터베이스
  - Supabase Auth (이메일/비밀번호 인증)
  - Row Level Security (RLS)
  - pg_cron (주차 자동 전환)

### 배포

- **Vercel** (프론트엔드 호스팅)
- **Supabase Cloud** (데이터베이스 호스팅)

### 주요 라이브러리

| 라이브러리             | 용도                                          | 버전 |
| ---------------------- | --------------------------------------------- | ---- |
| `@supabase/ssr`        | Supabase 클라이언트 (Next.js App Router 지원) | ^0.5 |
| `@uiw/react-md-editor` | 마크다운 에디터                               | ^4   |
| `react-markdown`       | 마크다운 렌더링                               | ^9   |
| `remark-gfm`           | GitHub Flavored Markdown 지원                 | ^4   |
| `react-hook-form`      | 폼 관리                                       | ^7   |
| `zod`                  | 스키마 검증                                   | ^3   |
| `nanoid`               | 초대 코드 생성                                | ^5   |

---

**CI/CD 자동화:**

- develop 브랜치 push → dev 환경 자동 배포
- main 브랜치 push → prod 환경 자동 배포
- UI 배포 후 CORS preflight 테스트 자동 수행
- prod 배포 실패 시 자동 롤백 (최근 5개 백업 유지)
