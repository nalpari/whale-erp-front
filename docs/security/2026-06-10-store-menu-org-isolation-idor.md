# [보안] 점포·메뉴 조회 API 조직 격리 부재 (IDOR)

- **작성일**: 2026-06-10
- **심각도**: High
- **유형**: IDOR (Insecure Direct Object Reference) / Broken Object-Level Authorization
- **영향 환경**: 운영(prod) 포함 전 환경
- **담당**: Backend (프론트엔드로는 차단 불가)
- **발견 경위**: PR #104(점포 옵션 소유자 필터링) 적대적 코드리뷰 중 백엔드 동작 확인

---

## 1. 요약

점포 옵션·점포 메뉴 조회 API가 **요청자의 토큰 소속(조직)을 검증하지 않는다.** 그 결과 임의의 로그인 사용자가 **자신이 속하지 않은 조직의 점포·메뉴 데이터를 열람**할 수 있다. 운영 환경에서는 매트릭스 권한 필터마저 비활성화되어 있어 조직 격리 방어선이 실질적으로 존재하지 않는다.

> 프론트엔드(PR #104)의 표시 필터는 화면 노출만 가리며, API 직접 호출로 우회되므로 이 취약점을 막지 못한다. **수정은 반드시 백엔드 서비스 단에서 이루어져야 한다.**

## 2. 영향 엔드포인트

| 엔드포인트 | 문제 |
|---|---|
| `GET /api/v1/stores/options` | `officeId` 미지정 시 전 조직 점포 반환 / 타 조직 `officeId` 지정 시 그대로 반환 |
| `GET /api/v1/master/menu/store` | `bpId`↔`storeId` 소속 교차검증 없음, 토큰 소속 검증 없음 |

## 3. 재현 절차

임의의 유효한 로그인 토큰으로:

```http
# (a) officeId/franchiseId 없이 호출 → 삭제되지 않은 전 조직 점포 반환
GET /api/v1/stores/options
Authorization: Bearer <임의 사용자 토큰>

# (b) 타 조직 본사 id 지정 → 해당 조직 점포 그대로 반환 (403/빈 목록 아님)
GET /api/v1/stores/options?officeId=<타_조직_본사_id>

# (c) 타 조직 점포 id 로 store 메뉴 조회 → 그대로 반환
GET /api/v1/master/menu/store?storeId=<타_조직_점포_id>&bpId=<내_본사_id>
```

## 4. 근본 원인 (백엔드 코드)

### 4-1. `StoreRepositoryCustomImpl.findStoreOptions` (≈204~243줄)
```kotlin
val predicates = mutableListOf<BooleanExpression>()
predicates += store.isDeleted.isFalse          // 둘 다 null이면 이 조건만 남음
if (officeId != null) { ... }                  // 미지정 시 skip
if (franchiseId != null) { ... }               // 미지정 시 skip
```
- 둘 다 null이면 `isDeleted=false`만 적용 → 전 조직 점포 노출.
- `officeId` 지정 시에도 **토큰 소속과의 교차검증 없음** → 임의 `officeId` 주입 허용.
- 서비스(`StoreService.getStoreOptions:744`)·컨트롤러(`StoreController:259`, 두 파라미터 `required=false`) 어느 레이어에도 소속 필터 없음.

### 4-2. `MenuService.findMenuList` (≈87줄) → `MenuRepositoryImpl.findMenuList`
- 서비스 단 권한/소속 가드 0건, 바로 리포지토리 위임.
- `bpIdEq(request.bpId)`, `storeIdEq(request.storeId)`가 **독립 where 조건** → bpId↔storeId 소속 일치 검증 없음, 토큰 소속 검증 없음.

### 4-3. 운영 매트릭스 필터 OFF (결정타)
- `application-prod.yml:70` → `current-path-header-required: false`
- 이 경우 `AuthorityCheckFilter`(≈162줄)가 admin·affiliationId·매트릭스 체크를 통째로 스킵(JWT 유효성만 통과).
- 필터 주석(≈95줄)은 *"조직 스코프는 서비스 단 책임"* 이라 명시하지만, 위 두 서비스에 그 가드가 없어 **방어선이 비어 있음.**

> 참고: dev/local의 매트릭스 RCUD 체크가 켜져 있어도 "이 메뉴에 대한 읽기 권한 보유 여부"를 볼 뿐, "이 데이터가 내 조직 소유인지"는 검증하지 않으므로 IDOR를 막지 못함.

## 5. 권장 수정 (백엔드)

1. **서비스 단 조직 스코프 필터 강제**: `getStoreOptions`/`findMenuList`에서 토큰의 `affiliationId`(소속 조직) 기준 where 절을 **항상** 적용. `officeId`/`franchiseId`/`storeId`는 그 스코프 내에서만 추가 필터로 동작.
2. **교차검증 + 거부**: 요청 `officeId`/`storeId`가 토큰 소속과 불일치하면 403 또는 빈 목록 반환.
3. **`menu/store`의 `bpId`↔`storeId` 소속 일치 검증** 추가.
4. **설정 의존 제거**: 조직 격리를 `current-path-header-required` 같은 필터 설정값에 의존시키지 말고 서비스 단에 항구적으로 둘 것.

## 6. 영향 범위 / 노출 데이터

- 노출 대상: 타 조직 점포 메타데이터(점포명·id 등), 타 조직 점포 메뉴(메뉴명·판매가·할인가 등).
- 노출 주체: **모든 유효 로그인 사용자**(PLATFORM admin뿐 아니라 일반 토큰 포함).
- 운영 환경에서 실시간 노출 중.

## 7. 프론트엔드 측 조치 (보안 아님, 참고)

PR #104에서 다음을 적용했으나 이는 **요청·캐시 절감 + 선택 UX** 목적이며 보안 경계가 아님:
- `useStoreOptions`를 `effectiveOfficeId != null`일 때만 enabled → 본사 미선택 시 요청 미발생.
- `validatedStoreId` 파생값으로 stale/주입 `storeId`의 store 메뉴 선요청 차단.

→ 근본 차단은 본 문서 5항(백엔드)에서만 가능.
