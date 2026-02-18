# 관리자 멤버 목록 정보 확장

**날짜**: 2026-02-09
**모드**: log

---

## 작업한 내용

관리자 페이지 멤버 관리 테이블에 기존에 표시하지 않던 정보 3개 컬럼 추가:

| 기존 컬럼 | 추가 컬럼 |
|-----------|-----------|
| 닉네임, 가입일, 소속 시즌, 역할, 관리 | **이메일**, **로그인 방식**(이메일/Google 배지), **마지막 로그인** |

### 변경 파일
- `src/app/admin/members/page.tsx` — `listUsers()`에서 이미 가져오던 auth.users 데이터를 구조화하여 전달
- `src/components/admin/members/members-list.tsx` — 테이블 컬럼 3개 추가, MemberWithSeasons 인터페이스 확장

---

## 왜 했는지

서비스 오픈 직전 관리자가 멤버를 효과적으로 관리할 수 있도록. 이메일, 로그인 방식, 마지막 접속 시간은 운영에 기본적으로 필요한 정보.

---

## 결정된 내용

- `adminClient.auth.admin.listUsers()`에서 이미 가져오던 데이터 활용 → 추가 API 호출 없음
- 로그인 방식은 Badge 컴포넌트로 이메일/Google 구분 표시 (Mail, Chrome 아이콘)
- 마지막 로그인이 없는 경우 `-` 표시

---

## 발견

- 기존 코드에서 `providerMap`으로 providers만 추출하고 나머지 auth.users 데이터는 버리고 있었음
- `authUserMap`으로 구조 변경하여 email, providers, lastSignIn을 한번에 관리

---

## 커밋

- `be5ac5e` feat: 관리자 멤버 목록에 이메일, 로그인 방식, 마지막 로그인 정보 추가
