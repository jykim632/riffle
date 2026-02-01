# Dev 환경 설정 가이드

## 옵션 1: Supabase 프로젝트 분리 (추천)

### 장점
- 환경 완전 격리 (데이터, 설정, 백업 분리)
- Supabase 표준 패턴
- 배포 파이프라인 명확 (dev → staging → prod)
- 실수로 prod 데이터 건드릴 위험 없음

### 설정 방법

1. **Supabase에서 프로젝트 2개 생성**
   - `riffle-dev`
   - `riffle-prod`

2. **각 프로젝트에 schema 적용**
   ```bash
   # dev 프로젝트
   psql $DEV_DATABASE_URL -f supabase/schema.sql
   psql $DEV_DATABASE_URL -f supabase/seed.sql  # dev만

   # prod 프로젝트
   psql $PROD_DATABASE_URL -f supabase/schema.sql
   # seed.sql은 실행하지 않음
   ```

3. **환경변수 분리 (.env.local, .env.production)**
   ```env
   # .env.local (dev)
   NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx-dev...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx-dev...

   # .env.production (prod)
   NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx-prod...
   SUPABASE_SERVICE_ROLE_KEY=eyJxxx-prod...
   ```

4. **Vercel 배포 설정**
   - dev 브랜치 → dev 환경 변수
   - main 브랜치 → prod 환경 변수

---

## 옵션 2: PostgreSQL Schema 분리 (복잡함, 비추천)

### 장점
- 하나의 Supabase 프로젝트로 관리
- 데이터베이스 비용 절약

### 단점
- RLS 정책 복잡도 증가
- Supabase Auth가 schema를 인식 못함 (auth.users는 항상 public)
- 실수로 prod 데이터 건드릴 위험
- 백업/복구 복잡

### 설정 방법 (비추천)

1. **schema 분리 SQL 작성** (`supabase/schema-dev.sql`)

```sql
-- dev schema 생성
CREATE SCHEMA IF NOT EXISTS dev;

-- dev schema에 테이블 생성
CREATE TABLE dev.profiles (
  -- schema.sql 내용 복사
);
CREATE TABLE dev.invite_codes (...);
CREATE TABLE dev.weeks (...);
CREATE TABLE dev.summaries (...);

-- dev schema에 RLS 적용
ALTER TABLE dev.profiles ENABLE ROW LEVEL SECURITY;
-- ...

-- public schema는 prod용
-- schema.sql 그대로 적용
```

2. **애플리케이션에서 schema 전환**

```typescript
// lib/supabase.ts
const schema = process.env.NODE_ENV === 'development' ? 'dev' : 'public';

// 모든 쿼리에 schema 명시
const { data } = await supabase
  .from(`${schema}.summaries`)  // 이거 안 됨! Supabase는 schema 분리 미지원
  .select('*');
```

**문제**: Supabase 클라이언트는 schema 분리를 공식 지원하지 않음. 모든 테이블 이름에 schema prefix를 붙여야 하는데, `.from('dev.summaries')`는 `dev.summaries`라는 테이블 이름으로 해석됨.

3. **Raw SQL로만 작업**

```typescript
const { data } = await supabase.rpc('get_summaries', {
  schema_name: 'dev'
});
```

매번 RPC 함수 작성해야 함 → 너무 복잡.

---

## 결론

**옵션 1 (프로젝트 분리) 강력 추천.**

Supabase는 schema 분리를 염두에 두고 설계되지 않았어. 프로젝트 분리가 표준이고, 대부분의 Supabase 앱이 이 방식을 사용함.

### 다음 단계

1. Supabase에서 `riffle-dev` 프로젝트 생성
2. `schema.sql` 적용
3. `seed.sql` 적용
4. `.env.local`에 dev 환경변수 설정
5. 개발 시작

prod 프로젝트는 배포 준비되면 생성.
