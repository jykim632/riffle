# 계정 삭제 - 설계 문서

> 상태: **재설계 필요**
> 최종 업데이트: 2026-02-07

## 배경

현재 `profiles.id`가 `auth.users(id) ON DELETE CASCADE`를 참조하고, 하위 테이블들도 `profiles(id) ON DELETE CASCADE`로 연결되어 있어 계정 삭제 시 요약본까지 전부 삭제됨.

요약본은 스터디 공유 자산이므로 내용은 보존하되, 작성자 정보만 익명화하는 정책으로 변경하려 했으나, 설계 검토 중 미결 이슈가 발견됨.

---

## 1차 설계안: FK SET NULL 익명화

### 삭제 시 동작 요약

| 리소스 | 처리 | 메커니즘 |
|--------|------|----------|
| `auth.users` | 삭제 | Supabase Admin API |
| `profiles` | 삭제 | CASCADE (auth.users → profiles) |
| `summaries` | 보존 (`author_id` = NULL) | SET NULL |
| `season_members` | 미결 (아래 참고) | — |
| `invite_codes` | 익명화 (FK = NULL) | SET NULL |

### DB 마이그레이션 (확정된 부분)

#### summaries.author_id: NOT NULL → nullable, CASCADE → SET NULL

```sql
ALTER TABLE public.summaries
  ALTER COLUMN author_id DROP NOT NULL;

ALTER TABLE public.summaries
  DROP CONSTRAINT summaries_author_id_fkey,
  ADD CONSTRAINT summaries_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

#### invite_codes.created_by / used_by: CASCADE → SET NULL

```sql
ALTER TABLE public.invite_codes
  DROP CONSTRAINT invite_codes_created_by_fkey,
  ADD CONSTRAINT invite_codes_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.invite_codes
  DROP CONSTRAINT invite_codes_used_by_fkey,
  ADD CONSTRAINT invite_codes_used_by_fkey
    FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

#### chk_invite_used_consistency 제약조건 수정

현재 `is_used = true AND used_by IS NOT NULL`이 SET NULL을 차단함.

```sql
ALTER TABLE public.invite_codes
  DROP CONSTRAINT chk_invite_used_consistency,
  ADD CONSTRAINT chk_invite_used_consistency CHECK (
    (is_used = true AND used_at IS NOT NULL)
    OR
    (is_used = false AND used_by IS NULL AND used_at IS NULL)
  );
```

### 확인된 주의사항

1. **latest_summaries / first_summaries 뷰**: `DISTINCT ON(week_id, author_id)`에서 `author_id=NULL`인 행들이 하나로 합쳐질 수 있음. 동일 주차에 탈퇴 멤버 2명 이상이면 뷰에서 하나만 보임.
2. **RLS 정책**: 변경 불필요. `NULL ≠ any UUID`이므로 탈퇴 멤버의 요약본은 읽기만 가능.
3. **acquire_invite_code 함수**: 영향 없음. `is_used = false`인 코드만 대상.
4. **UI 처리 필요**: `author_id = NULL`인 요약본에 "탈퇴한 멤버" 표시 + 수정/삭제 버튼 숨김.

---

## 미결 이슈: season_members 처리

### 문제

`season_members`의 탈퇴 처리 방식이 결정되지 않음.

### "계정 탈퇴" vs "시즌 탈퇴"는 다른 동작

| 동작 | 트리거 | 현재 처리 | 결과 |
|------|--------|-----------|------|
| **시즌 탈퇴** (관리자가 시즌에서 멤버 제거) | `DELETE FROM season_members WHERE season_id=X AND user_id=Y` | 행 삭제 | 참여 기록 없음 |
| **계정 탈퇴** (사용자가 계정 삭제) | `profiles` 삭제 → FK action | CASCADE: 행 삭제 / SET NULL: `user_id=NULL` | 아래 참고 |

### 선택지별 트레이드오프

#### A. CASCADE 삭제 (현재 구조 유지)
- 장점: 단순, 추가 마이그레이션 불필요
- 단점: 시즌별 참여 인원수 기록 손실

#### B. SET NULL 익명화
- 장점: 시즌별 참여 인원수 `COUNT(*)` 유지
- 단점:
  - `user_id = NULL`인 행들끼리 구분 불가 → 크로스 시즌 분석 불가
  - `COUNT(DISTINCT user_id)`에서 NULL은 1개로 합쳐짐
  - 향후 멤버별 통계 만들 때 제약

#### C. SET NULL + 닉네임 스냅샷
- `display_name TEXT` 컬럼 추가하여 탈퇴 시점 닉네임 보존
- 장점: 가장 많은 정보 보존, "탈퇴한 멤버 (김OO)" 같은 표시 가능
- 단점: 스키마 변경 필요, 삭제 로직에 스냅샷 단계 추가

### 현재 season_members 사용처

```typescript
// 시즌별 멤버 수 (admin/seasons/page.tsx:19-22)
// → COUNT(*) 사용 — SET NULL이면 탈퇴 멤버 포함 집계
supabase.from('season_members').select('*', { count: 'exact', head: true }).eq('season_id', season.id)

// 멤버십 확인 (season-membership.ts)
// → .eq('user_id', userId) — 탈퇴 멤버는 조회 대상 아님
supabase.from('season_members').select('id').eq('season_id', X).eq('user_id', userId)

// 관리자 멤버 관리 (manage-members-dialog.tsx, admin/seasons.ts)
// → 특정 user_id 기반 추가/삭제 — 탈퇴 멤버 무관
```

---

## 다음 단계

- [ ] season_members 처리 방식 최종 결정
- [ ] 결정 후 마이그레이션 SQL 확정
- [ ] 정책 문서(DATA_POLICY.md, guide/security) 최종 반영
- [ ] 구현 착수
