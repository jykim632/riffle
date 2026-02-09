# 초대코드 시즌 연결 - 설계 문서

> 상태: **설계 완료 / 구현 전**
> 최종 업데이트: 2026-02-08

## 배경

현재 초대코드는 순수 가입 게이트웨이 역할만 한다. 가입 후 시즌 멤버 추가는 관리자가 수동으로 해야 한다. 초대코드에 시즌을 연결해서 가입과 동시에 해당 시즌 멤버로 자동 등록되게 한다.

### 현재 흐름

```
관리자: 초대코드 생성 → 신규 멤버에게 전달
신규 멤버: 초대코드로 가입
관리자: 시즌 관리 페이지에서 수동으로 멤버 추가  ← 이걸 없앤다
```

### 변경 후 흐름

```
관리자: 초대코드 생성 (시즌 선택) → 신규 멤버에게 전달
신규 멤버: 초대코드로 가입 → 자동으로 해당 시즌 멤버 등록
```

---

## 설계 결정

### 핵심: DB 함수에서 원자적 처리

| 선택지 | 설명 | 판단 |
|---|---|---|
| **A. DB 함수 (acquire_invite_code)** | 코드 사용 + 시즌 멤버 등록을 한 트랜잭션에서 처리 | **채택** |
| B. 앱 코드 | auth.ts, callback/route.ts 두 곳 모두 수정 | 기각 (중복, 원자성 부족) |
| C. DB 트리거 | invite_codes UPDATE 트리거로 season_members INSERT | 기각 (암시적, 디버깅 어려움) |

**A 채택 이유**:
- 이메일 가입 / Google OAuth 두 경로 모두 자동 적용 (앱 코드 변경 불필요)
- 같은 트랜잭션 안에서 처리되므로 원자성 보장
- `SECURITY DEFINER`로 실행되어 RLS 우회 (season_members INSERT는 원래 admin만 가능)

### season_id nullable 여부

nullable로 설정. 시즌 없이 일반 가입만 허용하는 코드도 생성 가능하도록.

### 기본값: 현재 활성 시즌

관리자가 코드 생성 시 시즌을 선택하되, 기본값은 현재 활성 시즌으로 자동 선택.

---

## 테이블 변경

### invite_codes 테이블

```sql
-- 추가 컬럼
season_id TEXT REFERENCES public.seasons(id) ON DELETE SET NULL
```

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `season_id` | `TEXT \| NULL` | 연결된 시즌. NULL이면 가입만 허용 |

**ON DELETE SET NULL**: 시즌 삭제 시 코드는 보존, 시즌 연결만 해제. `created_by`/`used_by`와 동일한 정책.

### acquire_invite_code 함수 변경

```sql
-- 기존: 코드 사용 처리만
-- 변경: 코드 사용 + season_id 있으면 season_members INSERT

IF code_record.season_id IS NOT NULL THEN
  INSERT INTO season_members (season_id, user_id)
  VALUES (code_record.season_id, user_id_input)
  ON CONFLICT (season_id, user_id) DO NOTHING;
END IF;
```

`ON CONFLICT DO NOTHING`: 이미 시즌 멤버인 경우 (있을 수 없지만 안전장치) 무시.

---

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `supabase/migrations/014_invite_code_season.sql` | **신규** - season_id 컬럼 + 함수 업데이트 |
| `src/lib/types/database.ts` | invite_codes에 season_id 추가 |
| `src/lib/actions/admin/invite-codes.ts` | createInviteCodeAction에 seasonId 파라미터 추가 |
| `src/app/admin/invite-codes/page.tsx` | 시즌 목록 조회 + 컴포넌트에 전달 |
| `src/components/admin/invite-codes/create-codes-button.tsx` | 시즌 선택 드롭다운 추가 |
| `src/components/admin/invite-codes/invite-codes-list.tsx` | 시즌 컬럼 추가 |

### 변경하지 않는 파일

| 파일 | 이유 |
|---|---|
| `src/actions/auth.ts` | DB 함수가 자동 처리 |
| `src/app/auth/callback/route.ts` | DB 함수가 자동 처리 |
| `src/app/(auth)/signup/page.tsx` | 사용자에게 시즌 노출 불필요 |
| RLS 정책 | SECURITY DEFINER로 우회 |

---

## 엣지 케이스

| 상황 | 처리 |
|---|---|
| 시즌이 삭제된 코드로 가입 | season_id = NULL, 가입만 되고 시즌 참여 안 됨 |
| 이미 시즌 멤버인 사용자가 같은 시즌 코드 사용 | ON CONFLICT DO NOTHING, 정상 가입 |
| 비활성 시즌 코드로 가입 | 시즌 멤버로 등록됨 (비활성이어도 멤버십은 유효) |
| 기존 미사용 코드 (season_id = NULL) | 기존 동작 그대로 유지 |

---

## 검증 체크리스트

- [ ] 마이그레이션 적용 (로컬 Supabase)
- [ ] 관리자: 시즌 선택 후 초대코드 생성
- [ ] 관리자: 시즌 없이 초대코드 생성 (기존 동작)
- [ ] 코드 목록에서 시즌 표시 확인
- [ ] 시즌 연결 코드로 가입 → season_members 자동 등록
- [ ] 시즌 없는 코드로 가입 → 기존 동작 유지
- [ ] Google OAuth 경로에서도 시즌 자동 등록
- [ ] 대시보드 NonMemberAlert 미표시 확인

---

## 절대 건드리면 안 되는 부분

- `acquire_invite_code`의 `FOR UPDATE` 행 잠금 로직 (race condition 방지)
- 초대 코드 사용 실패 시 계정 삭제 로직 (`auth.ts:115-122`)
- `SECURITY DEFINER` 설정 (RLS 우회 필수)

## 바꿔도 되는 부분

- 시즌 선택 UI (드롭다운 → 라디오 등)
- 기본 시즌 선택 로직 (활성 시즌 → 최신 시즌 등)
- 코드 목록의 시즌 표시 형식
