# 점포 옵션 소유자(본사 직영 / 가맹 산하) 필터링 설계

- 작성일: 2026-06-09
- 대상: 본사/가맹 라디오를 가진 "소유 지정 폼"에서 점포 드롭다운 노출 규칙 통일
- 결론 요약: **API 변경 없음**. 응답에 이미 존재하는 `franchiseId`/`headOfficeId`를 이용한 **클라이언트 필터링** + **공유 유틸** 도입. 수정 대상은 **폼 4곳**.

---

## 1. 배경 / 문제

본사/가맹점 selectbox 이후 노출되는 **점포 selectbox**의 동작이 화면 성격에 따라 달라야 하는데, 현재는 모두 동일하게 "본사 산하 전체 점포"를 노출해 일부 화면에서 잘못된 점포가 보인다.

요구 동작은 화면을 두 부류로 나눈다.

### Case 1 — 본사/가맹 라디오가 있는 화면 (= 소유 지정 폼)
- **본사 선택 시**: 점포 selectbox에는 **해당 본사의 직영 점포만** 노출(상위 조직이 본사 자신인 점포).
- **가맹점 선택 시**: 본사 + 가맹점 둘 다 고른 뒤 **선택한 가맹점 산하 점포만** 노출.
  - 본사만 고르고 가맹점 미선택이면 점포 selectbox는 **빈 목록**.

### Case 2 — 본사/가맹 라디오가 없는 화면 (= 검색/필터)
- **본사만 선택**: 직영 점포 + 본사 산하 모든 가맹점의 점포 = **본사 산하 전체** 노출.
- **본사 + 가맹점 선택**: 선택한 가맹점 산하 점포만 노출.

> Case 2는 현재 동작과 이미 일치하므로 **변경하지 않는다.** 이번 작업은 Case 1 폼만 대상.

---

## 2. 사실 확정 (백엔드 동작 / 응답 스키마)

### 2.1 현재 `GET /api/v1/stores/options` 동작
`StoreRepositoryCustomImpl.findStoreOptions` 기준 (`officeId`만, `franchiseId == null`):

```kotlin
predicates += office.id.eq(officeId)
    .or(franchise.organizationType.eq(OrganizationType.HEAD_OFFICE).and(franchise.id.eq(officeId)))
```

- `office.id == officeId` → 본사 아래 **가맹점들이 보유한 점포**
- `franchise.organizationType == HEAD_OFFICE && franchise.id == officeId` → **본사 직영 점포**
- ⇒ `officeId`-only는 **직영 + 모든 가맹 산하 = 본사 산하 전체**를 반환 (= Case 2 본사선택과 일치).
- `officeId`/`franchiseId` 모두 null → `isDeleted = false`만 적용되어 전체 점포 반환.
- 유효성 검증 없음. 없는 officeId → 빈 배열(예외 아님), HTTP 200.

### 2.2 응답 스키마 (와이어 JSON 키) — 게임체인저
`StoreOptionResponse`는 `@JsonProperty`/전역 NamingStrategy 없음 → Spring Boot 기본(LOWER_CAMEL_CASE), 필드명 1:1.

| 의미 | 와이어 JSON 키 | 비고 |
|------|----------------|------|
| 점포 PK | `id` | ← `storeId` 아님 |
| 점포명 | `storeName` | |
| 가맹점 PK | `franchiseId` | 점포 조직이 FRANCHISE일 때만 값, 아니면 `null` |
| 본사 PK | `headOfficeId` | 점포 조직이 HEAD_OFFICE(직영)일 때만 값, 아니면 `null` |

- `franchiseId`와 `headOfficeId`는 **상호 배타적**(한쪽은 항상 null).
- 따라서 **직영 점포 = `franchiseId == null`**, **가맹 산하 점포 = `franchiseId != null`**.

예시 응답:
```json
{
  "data": [
    { "id": 101, "storeName": "강남점",   "franchiseId": 55,   "headOfficeId": null },
    { "id": 102, "storeName": "직영본점", "franchiseId": null, "headOfficeId": 7 }
  ],
  "message": "드롭다운용 점포 목록 조회 성공했습니다."
}
```

> 프론트 타입 `StoreOption = { id, storeName }`(`src/types/store.ts`)이 두 필드를 **누락 선언**하고 있을 뿐, 페이로드에는 이미 존재한다.

---

## 3. 결정 사항 (의사결정 로그)

| # | 결정 | 선택 | 근거 |
|---|------|------|------|
| D1 | "직영만" 구현 방식 | **클라이언트 필터(B1)** | 응답에 `franchiseId`가 이미 있음. 본사당 점포 규모가 수십 건(향후도 수백 미만)이라 페이로드 부담 적음. BE 배포 선행 불필요, 모드 전환 시 재요청 없이 캐시 재필터 |
| D2 | API 변경 여부 | **변경 없음** | 위와 동일. URL/메서드/파라미터 그대로 `GET /api/v1/stores/options?officeId&franchiseId` |
| D3 | 대상 화면 분류 | **폼 = Case1 / 검색 = Case2** | 본사/가맹 라디오가 점포를 좌우하는 화면은 전부 "소유 지정 폼". 검색 화면의 라디오는 운영여부·메뉴타입 등 별개 필터 |
| D4 | 대상 화면 수 | **폼 4곳** | 아래 4. 참조 (Case2 검색 화면은 무변경) |
| D5 | 필터 로직 위치 | **공유 유틸 1개** | "중구난방" 재발 방지. 규칙을 한 곳에 모아 BE 정책 정합 추적 용이 |
| D6 | 라디오 값 표준화 | **`'HEAD_OFFICE' | 'FRANCHISE'`로 정규화** | 폼마다 enum이 제각각(`menuOwnership`/`MENU_PROPERTY`/`workplaceType`/`adminType`) → 유틸 호출 전 표준값으로 변환 |
| D7 | 빈 목록 UX | **`disabled` + 안내 placeholder** | 빈 드롭다운 방치 시 사용자 혼란("왜 안 뜨지?") |
| D8 | stale storeId | **라디오/가맹 변경 시 자동 해제** | 엉뚱한 점포 id 잔존·제출 방지 |

---

## 4. 대상 화면 (Case 1, 4곳) — 현재 상태 진단

네 폼 모두 **점포 드롭다운을 공유 컴포넌트가 아닌 자체 `SearchSelect` + 자체 `useStoreOptions`로 직접 렌더**한다. ⇒ **공유 컴포넌트 `HeadOfficeFranchiseStoreSelect`는 수정 불필요.**

| 화면 | 라디오 변수(현재) | `useStoreOptions` 호출 | 본사 모드 현재 | 가맹+미선택 현재 |
|------|-------------------|------------------------|----------------|------------------|
| `settings/admin/BpAdminForm.tsx` | `adminType` (`HEAD_OFFICE`/`FRANCHISE`) | `(officeId, adminType==='FRANCHISE'?franchiseId:null, enabled)` (L179) | 전체 노출 ❌(직영만이어야) | `enabled:false`로 **이미 빈 목록** ✅ |
| `master/pricing/store-promotion/StorePromotionDetail.tsx` | `menuProperty` (`MENU_PROPERTY.HEAD_OFFICE`/`FRANCHISE`) | `(effectiveOfficeId, effectiveFranchiseId, isReady)` (L216) | 전체 ❌ | 전체 노출 ❌ |
| `employee/employeeinfo/StaffInvitationPop.tsx` | `workplaceType` (`HEAD_OFFICE`/`FRANCHISE`) | `(headOfficeOrganizationId, franchiseOrganizationId, isReady)` (L403) | 전체 ❌ | 전체 노출 ❌ |
| `master/menu/MenuForm.tsx` ⚠️ | `menuOwnership` (`HEAD_OFFICE`/`FRANCHISE`) | `(bpId, franchiseId, !!bpId)` (L163) | — (아래 주석) | — |

> **⚠️ MenuForm 정정 (Playwright 실측, 2026-06-09):** MenuForm은 `SHOW_MENU_OWNERSHIP = false`, `SHOW_STORE_SELECT = false`(MenuForm.tsx L23·L25)라 **메뉴 소유 라디오와 점포 select가 현재 화면에 렌더되지 않는다.** 따라서 **현재 활성 대상은 3곳**(BpAdminForm · StorePromotionDetail · StaffInvitationPop)이며, MenuForm의 필터 코드는 `{SHOW_STORE_SELECT && ...}` 블록 안의 **미래 대비 코드**다. 플래그 주석에 "차후 개발 시 true로 변경"이 명시돼 있어, 플래그를 켜면 즉시 직영/가맹 필터가 적용되도록 유지한다(사용자 결정: 유지).
>
> 제외(점포 selectbox 없음): `AuthorityForm`(owner_code 라디오 + 본사/가맹까지만), 점포 등록 `StoreInfo`(점포 자체를 생성). — 점포 목록 노출 대상 아님.

---

## 5. 설계

### 5.1 타입 보강 — `src/types/store.ts`
```ts
export interface StoreOption {
  id: number          // 점포 ID (와이어 키도 id)
  storeName: string   // 점포명
  franchiseId: number | null   // 가맹 점포일 때만 값 (직영이면 null)
  headOfficeId: number | null  // 직영 점포일 때만 값 (가맹 산하이면 null)
}
```
- 두 필드는 상호 배타적. 기존 사용처(`option.id`, `option.storeName`)는 영향 없음.

### 5.2 공유 유틸 — `src/util/store-options.ts` (신규)
```ts
import type { StoreOption } from '@/types/store'

/** 점포 소유자 모드(본사 직영 / 가맹 산하) */
export type StoreOwnerType = 'HEAD_OFFICE' | 'FRANCHISE'

/**
 * 라디오(소유자 모드) + 선택된 가맹 id 기준으로 노출할 점포만 추린다.
 * - HEAD_OFFICE: 직영 점포만 (franchiseId == null)
 * - FRANCHISE + 가맹 미선택: 빈 목록
 * - FRANCHISE + 가맹 선택: 해당 가맹 산하 점포만
 *
 * 주의: 이 필터는 UX 가드다. 제출값의 소유자↔점포 정합성은 BE가 재검증해야 한다.
 */
export function filterStoreOptionsByOwner(
  list: StoreOption[],
  ownerType: StoreOwnerType,
  franchiseId: number | null,
): StoreOption[] {
  if (ownerType === 'HEAD_OFFICE') {
    return list.filter((s) => s.franchiseId == null)
  }
  if (franchiseId == null) return []
  return list.filter((s) => s.franchiseId === franchiseId)
}
```

> 참고: `FRANCHISE + 가맹 선택` 케이스는 대부분 `useStoreOptions(officeId, franchiseId)`가 이미 BE에서 해당 가맹으로 필터해 주지만, 유틸에서도 동일 기준으로 한 번 더 거른다(이중 안전망 + 단일 규칙).

### 5.3 각 폼 적용 패턴 (4곳 동일)
```ts
// 1) 폼 고유 enum → 표준값 정규화
const ownerType: StoreOwnerType =
  menuOwnership === 'FRANCHISE' ? 'FRANCHISE' : 'HEAD_OFFICE' // 폼별 매핑

// 2) 노출용 옵션 파생
const visibleStores = useMemo(
  () => filterStoreOptionsByOwner(storeOptionList, ownerType, franchiseId),
  [storeOptionList, ownerType, franchiseId],
)
const storeOptions = useMemo(
  () => visibleStores.map((s) => ({ value: String(s.id), label: s.storeName })),
  [visibleStores],
)
```

#### 폼별 enum → 표준값 매핑
| 화면 | 매핑 |
|------|------|
| BpAdminForm | `adminType === 'FRANCHISE' ? 'FRANCHISE' : 'HEAD_OFFICE'` |
| MenuForm | `menuOwnership` (이미 `HEAD_OFFICE`/`FRANCHISE`) 그대로 |
| StorePromotionDetail | `menuProperty === MENU_PROPERTY.FRANCHISE ? 'FRANCHISE' : 'HEAD_OFFICE'` |
| StaffInvitationPop | `workplaceType` (이미 `HEAD_OFFICE`/`FRANCHISE`) 그대로 |

### 5.4 빈 목록 UX (D7)
```ts
const isFranchiseModeNoPick = ownerType === 'FRANCHISE' && franchiseId == null
const isStoreEmpty = visibleStores.length === 0
```
| 상황 | 점포 select | placeholder |
|------|-------------|-------------|
| 가맹 모드 + 가맹 미선택 | `isDisabled` | `"가맹점을 먼저 선택하세요"` |
| 필터 후 0건(직영 0건 / 해당 가맹 점포 0건) | `isDisabled` | `"선택 가능한 점포가 없습니다"` |
| 정상(1건+) | 활성 | `"점포 선택"` |

- `isDisabled`는 기존 조건(`!bpId`, `storeLoading`)과 OR로 결합.

### 5.5 stale storeId 자동 해제 (D8)
- **렌더 중 setState 금지(React Compiler 규칙)** 이므로 `useEffect` 보정이 아니라 **변경 핸들러 내부**에서 처리한다.
- 라디오(`ownerType`) 변경 onChange, 가맹(`franchiseId`) 변경 onChange 시점에:
  ```ts
  // 변경 후 visibleStores 기준으로 현재 storeId가 유효하지 않으면 즉시 해제
  const nextVisible = filterStoreOptionsByOwner(storeOptionList, nextOwnerType, nextFranchiseId)
  if (storeId != null && !nextVisible.some((s) => s.id === storeId)) {
    setStoreId(null)
  }
  ```
- 제출 시 화이트리스트 가드(권장): `storeId`가 `visibleStores`에 없으면 제출 거부 + 에러 메시지. (BpAdminForm 선례와 동일 정신)

---

## 6. API

- **변경 없음.** `GET /api/v1/stores/options?officeId={}&franchiseId={}` 그대로 사용.
- URL / 메서드 / 파라미터 / 응답 스키마 전부 유지.
- 프론트는 응답에 이미 포함된 `franchiseId`/`headOfficeId`를 타입에 노출해 클라이언트에서 필터링.

> 만약 향후 본사당 점포가 수백 건 이상으로 커져 페이로드가 부담되면, 그때 `?officeId=X&storeOwner=HEAD_OFFICE`(직영만) 같은 서버 파라미터 추가(B2)로 전환을 검토한다. 현재 규모(수십)에서는 불필요.

---

## 7. 보안 경계 (명시)

- 본 필터/`disabled`/stale 가드는 모두 **UX 가드**다. DevTools로 우회 가능.
- 사용자가 본사 모드에서 가맹 점포 id를, 혹은 다른 가맹의 점포 id를 폼에 주입해 제출할 수 있다.
- 따라서 **모든 mutation API에서 BE가 `소유자(본사/가맹) ↔ 점포 소속` 정합성을 재검증**해야 안전하다. (Boston Code Review HIGH #4와 동일 원칙)

---

## 8. 비범위 (Non-goals)

- Case 2 검색/조회 화면(EmployeeSearch, AttendanceSearch, WorkScheduleSearch, 각종 PayrollSearch, StoreMenuSearch, StoreSearch, Price* 등) — **무변경**.
- 공유 컴포넌트 `HeadOfficeFranchiseStoreSelect` — **무변경**.
- `fields` prop 표기 통일, 콜백 타입 통일, BP 필터 상태 필드명 표준화 등 기존 "중구난방" 리팩터링 — **별건**, 이번 범위 아님.
- 백엔드 변경 — 없음.

---

## 9. 작업 체크리스트

- [ ] `src/types/store.ts` — `StoreOption`에 `franchiseId`/`headOfficeId` 추가
- [ ] `src/util/store-options.ts` — `filterStoreOptionsByOwner` + `StoreOwnerType` 신규
- [ ] `BpAdminForm.tsx` — `ownerType` 정규화, `visibleStores` 적용, 빈목록 UX, stale 해제
- [ ] `MenuForm.tsx` — 동일 (점포 자체 `SearchSelect` L391 영역)
- [ ] `StorePromotionDetail.tsx` — 동일 (인라인 `SearchSelect` L493 영역)
- [ ] `StaffInvitationPop.tsx` — 동일 (`SearchSelect` 점포 영역)
- [ ] 각 폼 제출 핸들러 — 화이트리스트 가드 추가
- [ ] lint / type / build 체크
- [ ] (선택) `storeOptions` 관련 zod 스키마가 신설되면 두 필드 반영
