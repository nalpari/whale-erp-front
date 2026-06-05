# 마이페이지가 PLATFORM(admin)에게 전체 BP 목록의 최신 1건을 "내 조직"으로 표시하는 버그 수정

- 작성일: 2026-06-05
- 도메인: `mypage`, `master/bp`
- 유형: 버그 수정 (프론트엔드)

## 1. 증상

admin(PLATFORM)으로 로그인했는데 마이페이지 사업자정보 탭에 **다른 조직(웨일_가맹01, organization id=49, whalerkaod01/김다영 소속)** 정보가 표시됨. 호출은 `GET /api/v1/master/bp/49`.

## 2. 근본 원인 (디버깅으로 확정 — 데이터 흐름 추적)

- 마이페이지 `MyPageTab01Layout.tsx` → `useMyOrganizationBp()` [`src/hooks/queries/use-bp-queries.ts:23`]는 `GET /api/v1/master/bp?page=0&size=1`로 목록 첫 건을 가져와 그 id로 상세를 조회한다.
- 백엔드 `BpService.findBpList`는 `authContext.getCurrentUserOrganizationFilter()`로 범위를 정하는데, **admin은 `isAdmin()=true` → `canAccessAll=true`** (AuthenticationContext:138-144)라 목록에 organization 필터가 붙지 않는다.
- 실제 SQL: `from organizations where is_deleted=0 order by created_at desc fetch first 1` → **전체 BP 중 가장 최근 생성된 1건**.
- DB 확인: `created_at desc` 첫 건 = id 49 "웨일_가맹01"(2026-05-28 생성). → admin 마이페이지에 이 조직이 뜸.
- 즉 **admin(PLATFORM)은 소속 BP가 없는데, `useMyOrganizationBp`가 전체 목록의 최신 1건을 "내 조직"으로 오인**하는 것이 원인.
- 본사/가맹 사용자는 `canAccessAll=false`라 목록에 자기 조직 필터가 붙어 정상 동작 → **PLATFORM만 발생**.

> 참고: 초기에 `affiliationId` 상태 잔존을 원인으로 의심해 로그인 핸들러에 `clearAuth()`를 추가했으나, 위 분석으로 **무관함이 확인되어 해당 변경은 되돌림**.

## 3. 수정 방안

`useMyOrganizationBp`의 `queryFn` 내부에서 **현재 사용자가 PLATFORM이면 조회하지 않고 `null` 반환**.

- `enabled: false`로 막으면 React Query v5에서 `isPending`이 true로 남아 마이페이지가 무한 로딩 → 부적합.
- `queryFn`에서 `null` 반환 시 `data=null` → `MyPageTab01Layout`의 `if (!bp)` 분기로 "사업자 정보를 찾을 수 없습니다" Empty 표시 (admin은 소속 BP 없음 → 올바른 상태).

### 변경 파일
- `src/hooks/queries/use-bp-queries.ts`
  - `useMyOrganizationBp`에 `const accountType = useAuthStore((s) => s.accountType)` 추가
  - `queryFn` 시작부에 `if (accountType === 'PLATFORM') return null`
- `src/app/(auth)/login/page.tsx`
  - 이전에 추가한 `clearAuth` selector 및 호출 **되돌리기** (이번 버그와 무관)

### 변경 없음
- 백엔드: 변경 없음 (admin 전체 접근은 BP 목록 화면에서는 의도된 동작)

## 4. 검증

1. `pnpm lint` 통과
2. `pnpm build` 통과
3. 수동 재현 검증:
   - admin으로 로그인 → 마이페이지 사업자정보 탭 → 49번 조직 미표시, "사업자 정보를 찾을 수 없습니다" Empty
   - 본사/가맹 사용자 로그인 → 자기 조직 BP 정상 표시 (회귀 없음)

## 5. 범위 외

- email 중복 테스트 데이터 정리 (별건)
- 백엔드 "내 조직 BP" 전용 엔드포인트 신설 (member 소속 기반) — 대안으로 검토했으나 이번엔 프론트 가드 채택
