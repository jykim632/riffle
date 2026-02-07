# 계정 삭제 - 익명화 후 보존 설계

> 상태: 설계 완료, 구현 대기

## 배경

현재 `profiles.id`가 `auth.users(id) ON DELETE CASCADE`를 참조하고, 하위 테이블들도 `profiles(id) ON DELETE CASCADE`로 연결되어 있어 계정 삭제 시 요약본까지 전부 삭제됨.

요약본은 스터디 공유 자산이므로 내용은 보존하되, 작성자 정보만 익명화하는 정책으로 변경.

## 삭제 시 동작 요약

| 리소스 | 처리 | 메커니즘 |
|--------|------|----------|
| `auth.users` | 삭제 | Supabase Admin API |
| `profiles` | 삭제 | CASCADE (auth.users → profiles) |
| `summaries` | 보존 (`author_id` = NULL) | SET NULL |
| `season_members` | 삭제 | CASCADE (profiles → season_members) |
| `invite_codes` | 익명화 (FK = NULL) | SET NULL |

## DB 마이그레이션 (013_account_deletion_fk.sql)

### 1. summaries.author_id: NOT NULL → nullable, CASCADE → SET NULL

```sql
-- 기존: author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
-- 변경: author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL

ALTER TABLE public.summaries
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.summaries
  DROP CONSTRAINT summaries_author_id_fkey,
  ADD CONSTRAINT summaries_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

### 2. invite_codes.created_by / used_by: CASCADE → SET NULL

```sql
-- created_by: 이미 nullable. FK action만 변경
ALTER TABLE public.invite_codes
  DROP CONSTRAINT invite_codes_created_by_fkey,
  ADD CONSTRAINT invite_codes_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- used_by: 이미 nullable. FK action만 변경
ALTER TABLE public.invite_codes
  DROP CONSTRAINT invite_codes_used_by_fkey,
  ADD CONSTRAINT invite_codes_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

### 3. chk_invite_used_consistency 제약조건 수정

현재 제약조건:
```sql
CONSTRAINT chk_invite_used_consistency CHECK (
  (is_used = true AND used_by IS NOT NULL AND used_at IS NOT NULL)
  OR
  (is_used = false AND used_by IS NULL AND used_at IS NULL)
)
```

**문제:** `is_used = true`일 때 `used_by IS NOT NULL`을 강제하므로 SET NULL이 차단됨.

수정:
```sql
ALTER TABLE public.invite_codes
  DROP CONSTRAINT chk_invite_used_consistency,
  ADD CONSTRAINT chk_invite_used_consistency CHECK (
    (is_used = true AND used_at IS NOT NULL)
    OR
    (is_used = false AND used_by IS NULL AND used_at IS NULL)
  );
```

`is_used = true`일 때 `used_by`는 NULL 허용 (탈퇴한 사용자). `used_at`은 여전히 NOT NULL 유지하여 사용 시점은 기록 보존.

## 주의사항

### 1. latest_summaries / first_summaries 뷰

```sql
SELECT DISTINCT ON (week_id, author_id) ...
FROM public.summaries
ORDER BY week_id, author_id, created_at DESC;
```

`author_id = NULL`인 요약본들은 `DISTINCT ON`에서 하나로 합쳐질 수 있음. 즉, 같은 주차에 탈퇴한 멤버가 2명 이상이면 뷰에서 하나만 보임.

**영향도:** 소규모 스터디라 동시 탈퇴 가능성 낮음. 필요시 뷰에 `id` 컬럼 추가하여 구분 가능.

### 2. RLS 정책

변경 불필요. `author_id = NULL`인 요약본은:
- 읽기: 기존 정책으로 모든 멤버가 조회 가능
- 수정/삭제: `auth.uid() = author_id` 조건에 의해 불가 (NULL ≠ any UUID)

### 3. UI 표시

`author_id = NULL`인 요약본의 작성자를 "탈퇴한 멤버"로 표시하는 프론트엔드 처리 필요.
해당 요약본에는 수정/삭제 버튼을 숨겨야 함 (RLS에서도 차단되지만 UX 일관성 확보).

### 4. acquire_invite_code 함수

수정 불필요. 이 함수는 `is_used = false`인 코드만 찾아서 업데이트하므로, 탈퇴로 인해 `used_by`가 NULL이 된 코드(이미 `is_used = true`)에는 영향 없음.

## 구현 순서

1. DB 마이그레이션 SQL 작성 및 적용
2. 프론트엔드: `author_id = NULL`일 때 "탈퇴한 멤버" 표시 처리
3. 관리자 계정 삭제 기능 구현 (Admin API 호출)
4. 테스트: 계정 삭제 후 요약본 보존 확인
