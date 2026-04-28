# 본사 영역 affiliationId 자동 적용 (검색 + 폼 통합)

- **Feature**: affiliation-headoffice-filter
- **Branch**: `feature/affiliation-headoffice-filter`
- **작성일**: 2026-04-28
- **작성자**: 재영(요청) / 클로(설계)
- **관련 컴포넌트**: `src/components/common/HeadOfficeFranchiseStoreSelect.tsx`
- **버전**: v6 (자동선택 = 잠금 통합 / BP Master headOfficeId fallback 수신 후 PLATFORM 예외 제거)

---

## Executive Summary

| 항목 | 내용 |
|------|------|
| Problem | 검색 필터/폼/상세의 "본사" 셀렉트가 사용자 권한(`affiliationId`)에 종속되지 않아 권한 외 본사 노출/조회/등록 가능. 다중 본사 권한 계정 진입 시 자동 적용도 누락. **플랫폼 관리자는 전 본사 횡단 운영이 필요하므로 잠금되면 안 됨**. |
| Solution | 공통 컴포넌트 `HeadOfficeFranchiseStoreSelect`에서 `affiliationId` 매핑 본사를 자동 선택·고정. **자동 적용 조건에 가드 추가**(`officeId==null` & `isDisabled=false` & `autoSelect=true` & `ownerCode!==PLATFORM`)로 검색·등록 폼은 자동 적용, 수정 폼·상세·플랫폼 관리자는 사용자 선택 보장. |
| Function/UX | (검색) 진입 시 본사 자동 채움+잠금. (등록 폼) 자기 본사 자동 채움+잠금. (수정 폼/상세) 기존 본사값 보존 무영향. (**플랫폼 관리자**) 본사 빈 값으로 시작 + 전 본사 자유 선택 가능. (시스템 관리/세팅) 정책 예외 유지. |
| Core Value | 데이터 격리(권한 외 본사 차단) + UX 단축 + 헤더↔화면 정합성 + **수정 모드 데이터 무결성** + **플랫폼 관리자 횡단 운영 보장**. |

---

## 1. 배경 및 목적

### 1.1 현재 문제
- `HeadOfficeFranchiseStoreSelect`의 자동 선택 로직은 `ownerCode === HEAD_OFFICE/FRANCHISE` 또는 `bpTree.length === 1`인 경우에만 작동.
- 다중 본사 권한 계정이 affiliation을 골라 백엔드가 본사 1개로 좁혀줘도 **자동 잠금이 안 됨** (현재 폴백은 자동 선택까지만, 잠금 미적용).
- API 헤더 `affiliationId`와 화면 본사 값이 어긋나면 잘못된 데이터 노출/생성 위험.
- 현재 자동 적용 분기가 `officeId !== office.id`이면 강제 변경하는 구조라 **수정 폼에서 기존 데이터의 본사를 덮어쓸 위험** 존재.
- 플랫폼 관리자 환경에 본사가 1개뿐일 때 단일 본사 폴백이 잘못 발동하면 플랫폼 관리자에게도 자동 선택이 적용되어 **횡단 운영 의도 훼손 위험**.

### 1.1.1 백엔드 검증 결과 (Phase 1 사전 조사 완료, 2026-04-28)

`/api/v1/master/bp/head-office-tree` (`BpService.findHeadOfficeTree`)는 **이미 affiliationId 기반으로 결과를 필터링**해서 반환:

| ownerCode | bpTree 응답 |
|-----------|-------------|
| HEAD_OFFICE (PRGRP_002_001) | 자기 본사 1개 + 하위 가맹점 |
| FRANCHISEE (PRGRP_002_002) | 자기 가맹점 + 그 본사 1개 |
| PLATFORM (PRGRP_001_001) / ADMIN | 모든 본사 |
| 다중 본사 권한 + affiliation 선택 | 선택된 affiliation의 본사 1개만 |

**결론**: `bpTree.length === 1`이면 그 본사가 곧 affiliationId 매핑 본사다.
별도의 `authorityMasterId` 매핑 필드 추가 **불필요** — 기존 `bpTree` 단일 본사 폴백이 정확하게 작동.

따라서 본 작업은 **백엔드 변경 없이 프론트만 수정**하면 된다.

### 1.2 목표 (확장)
1. **본사 영역**을 `affiliationId` 매핑 본사로 자동 적용.
2. **검색 19개 + 폼/상세 직접 사용처 4개**까지 일관 적용.
3. **수정 모드/상세 모드는 기존 값 보존** (자동 적용으로 데이터 손상 방지).
4. **플랫폼 관리자(`PRGRP_001_001`)는 자동 적용·잠금 모두 비활성** — 전 본사 횡단 운영 보장.
5. 시스템 관리/세팅의 `autoSelect={false}` 정책 유지.
6. 다중 본사 권한 계정의 횡단 조회 escape hatch 보존 (`autoSelect={false}` 패턴).

### 1.3 비목표 (Out of Scope)
- 백엔드 권한-본사 매핑 API 신규 추가 (현 데이터로 도출).
- BP 자체 폼(`BpForm`, `BpMasterManage`, `BpDetailView`) 동작 변경 — 이들은 BP 자체를 CRUD하는 화면이라 본사 셀렉트 의미가 다름(현재도 미사용).
- `StorePromotionDetail`의 인라인 로직 통합 — 별도 리팩터 사안.
- `useStoreDetailForm` 훅 내부 모드 처리 변경 — 부모 페이지 onChange 통해 자연 영향만.

---

## 2. 영향 범위 (확장)

### 2.1 수정 대상: 공통 컴포넌트 1개
| 파일 | 변경 |
|------|------|
| `src/components/common/HeadOfficeFranchiseStoreSelect.tsx` | (1) `affiliationId` 기반 본사 도출 (2) 자동선택 가드 강화 (`officeId==null` & `!isDisabled`) (3) `isOfficeFixed`에 affiliation 매핑 케이스 합류 |

### 2.2 자동 영향 분류 (사용처 36개 전수)

> ★ = 본 변경의 직접 적용 대상  /  ◇ = 가드로 자동 보호되어 동작 변경 없음

#### A. 검색 필터 (19개) — **★ 검색 자동 적용**
| 도메인 | 파일 |
|--------|------|
| master | `BpMasterSearch.tsx`, `StoreMenuSearch.tsx`, `PriceMasterSearch.tsx`, `PriceHistorySearch.tsx`, `PromotionSearch.tsx` |
| category | `CategorySearch.tsx` |
| store | `StoreSearch.tsx` |
| employee (목록계) | `EmployeeSearch.tsx`(employeeinfo), `EmployeeSearch.tsx`(popup), `EmployContractSearch.tsx`, `AttendanceSearch.tsx`, `WorkScheduleSearch.tsx`, `EmployeeTodoSearch.tsx`, `FullTimePayrollSearch.tsx`, `PartTimePayrollSearch.tsx`, `OvertimePayrollSearch.tsx` |
| system (정책 예외) | `HolidaySearch.tsx`, `CommonCodeSearch.tsx`, `AuthoritySearch.tsx` (모두 `autoSelect={false}` → ◇) |

#### B. 폼/상세 직접 사용처 (4개) — **★ 모드별 자동 적용**
| 파일 | 패턴 | 적용 정책 |
|------|------|----------|
| `MenuForm.tsx` | 등록/수정 분기 없음, `isDisabled` 미세팅 | 등록(officeId=null) 시만 자동 적용. 수정(officeId 보유) 시 가드로 미적용 |
| `AuthorityForm.tsx` | `mode: 'create' \| 'edit'`, `isDisabled={mode==='edit'}` | 등록 시 자동 적용+잠금. 수정 시 `isDisabled=true`로 가드 차단 (기존 동작 유지) |
| `StoreInfo.tsx` | `OfficeFranchiseStoreValue` 타입 import + 자식 컴포넌트(StoreSearch)에서 사용 | 자식이 검색이라 A 카테고리로 자동 처리 |
| `FindOptionPop.tsx` | `isDisabled={true}` 항상 잠금 | 가드로 자동 적용 차단 (◇) |

#### C. Settings — **◇ `autoSelect={false}` 보존**
| 파일 | 비고 |
|------|------|
| `EmployeeInfoSettings.tsx` | 이미 `autoSelect={false}` |
| `LaborContractSettings.tsx` | 이미 `autoSelect={false}` |
| `PayrollStatementSettings.tsx` | 이미 `autoSelect={false}` |

#### D. Type-only Import (5개) — **◇ 영향 없음**
| 파일 | 비고 |
|------|------|
| `StoreMenuManage.tsx`, `StorePromotionManage.tsx`, `EmployeeTodoManage.tsx`, `PriceMasterManage.tsx`, `PriceHistoryManage.tsx` | `OfficeFranchiseStoreValue` 타입만 import (실제 셀렉트는 자식 Search가 렌더) |

#### E. 인라인/별도 로직 (3개) — **◇ 본 작업 범위 외**
| 파일 | 비고 |
|------|------|
| `StorePromotionDetail.tsx` | 인라인 BP 로직 (HeadOfficeFranchiseStoreSelect 미사용) — 별도 리팩터 사안 |
| `BpDetailView.tsx`, `BpMasterManage.tsx`, `BpForm.tsx` | BP 자체 CRUD 화면, 본사 셀렉트 미사용 |
| `app/(sub)/settings/authority/page.tsx` | 타입 import만 |
| `useStoreDetailForm.ts` | 훅, 부모 onChange 흐름만 |

### 2.3 영향 매트릭스 요약
| 카테고리 | 개수 | 동작 |
|---------|------|------|
| 검색 직접 적용 | 16 | ★ 진입 시 자동 적용+잠금 |
| 시스템 관리(검색) | 3 | ◇ `autoSelect={false}`로 우회 |
| 폼/상세 직접 적용 | 2 (MenuForm, AuthorityForm) | ★ 등록 시만 자동 적용 |
| Settings | 3 | ◇ `autoSelect={false}` |
| 타입 only / 별도 로직 | 12 | ◇ 무관 |
| **총** | **36** | — |

---

## 3. 설계

### 3.1 affiliationId → 본사 ID 매핑 (백엔드 자동 필터링 활용)

**문제**: `auth-store.affiliationId`(=`authority_masters.id`) ≠ 본사 셀렉트의 `officeId`(=`head_office.id`).

**해결**: 백엔드 `findHeadOfficeTree`가 이미 affiliationId 기반으로 `bpTree`를 필터링해주므로 프론트는 추가 매핑 불필요.

**선결 차단**: `ownerCode === PLATFORM` (`PRGRP_001_001`) → **모든 자동 적용/잠금 차단**, 사용자 선택만 허용.

**자동 적용 우선순위 (플랫폼 관리자가 아닐 때만)**:
1. **ownerCode 기반 (기존, 잠금 강함)**:
   - `HEAD_OFFICE` (PRGRP_002_001) → `bpTree[0]` 자동 선택 + 잠금
   - `FRANCHISEE` (PRGRP_002_002) → `bpTree[0]` 자동 선택 + 가맹점도 잠금
2. **affiliation 단일 본사 폴백 (확장)**:
   - `bpTree.length === 1` → 그 본사 자동 선택 + **잠금 신규 추가** (헤더 정합성)
   - 백엔드가 이미 affiliation 기반으로 1개로 좁혀준 결과이므로 안전하게 잠금 가능
3. **모두 실패** → 자동선택 미수행 (수동 선택 허용)

### 3.2 자동 적용 가드 체계 (신규)

자동 적용 useEffect 조건에 다음 가드를 **모두 만족**해야 발동:
```
autoSelect === true             // 명시적 비활성화 우회 (시스템 관리/세팅)
&& !isDisabled                  // 폼이 잠긴 경우(수정 모드 등) 우회
&& !bpLoading
&& bpTree.length > 0
&& shouldAutoSelectOffice       // ownerCode/단일 본사 중 매칭 (PLATFORM 포함)
&& officeId == null             // 기존 값이 있으면 덮어쓰지 않음 (수정 폼 보호)
```

> **잠금**(`isOfficeFixed`)은 별도로 `ownerCode !== PLATFORM` 가드 — 플랫폼 관리자는 자동선택은 발동하되 잠금은 안 됨.

이 가드로 다음 시나리오가 안전 처리됨:
- ✅ 검색 진입 (officeId=null) → 자동선택 + 잠금
- ✅ 등록 폼 진입 (officeId=null) → 자동선택 + 잠금
- ✅ 수정 폼 진입 (officeId=기존값) → 자동선택 안 함
- ✅ 상세/수정 잠금 (`isDisabled=true`) → 자동선택 안 함
- ✅ 시스템 관리 (`autoSelect=false`) → 자동선택 안 함
- ✅ **플랫폼 관리자 + 단일 본사** → 자동선택만 발동, **잠금 안 함** (변경 가능)
- ✅ **플랫폼 관리자 + 다본사** → 자동선택 안 함, 잠금 안 함 (사용자 선택)

### 3.3 잠금(고정) 정책 — 자동선택 = 잠금 통합 (v6 최종)

백엔드 BP Master fallback이 추가되어 PLATFORM도 매핑 본사를 받게 되면서, 자동선택과 잠금을 동일 조건으로 통합. 헤더 `affiliationId` ↔ 화면 본사 정합성을 모든 권한 유형에서 보장.

```
shouldAutoSelectOffice = autoSelect
  && (ownerCode === HEAD_OFFICE
      || ownerCode === FRANCHISEE
      || bpTree.length === 1
      || platformHasDefault)         // PLATFORM + defaultHeadOfficeId 매핑

isOfficeFixed = shouldAutoSelectOffice  // 자동선택 = 잠금
```

| 시나리오 | bpTree | ownerCode | defaultHOId | 자동선택 | 잠금 |
|---------|--------|-----------|-------------|---------|------|
| 본사 권한 | 1 | HEAD_OFFICE | * | ✅ | ✅ |
| 가맹점 권한 | 1 | FRANCHISEE | * | ✅ | ✅ |
| 다중 본사 권한 (affiliation 선택 후) | 1 | (없거나 일반) | * | ✅ | ✅ |
| **PLATFORM/BP Master + 매핑 있음** | n | PLATFORM | 있음 | ✅ | ✅ |
| **슈퍼 어드민(admin) + 단일 본사 환경** | 1 | PLATFORM | null | ✅ | ✅ |
| 슈퍼 어드민(admin) + 다본사 환경 | 다수 | PLATFORM | null | ❌ | ❌ |
| 시스템 관리 / Settings | * | * | * | ❌ (`autoSelect=false`) | ❌ |

### 3.4 컴포넌트 인터페이스 변경
- **신규 prop 도입 없음**.
- 기존 `autoSelect`, `isDisabled` 조합으로 모든 분기 표현 가능.
- 향후 "자동 적용은 하지만 잠금은 안 함" 등의 케이스가 생기면 prop 추가 검토.

---

## 4. 구현 단계

### Phase 1 — 사전 검증 (✅ 완료, 2026-04-28)
- ✅ 백엔드 `findHeadOfficeTree`가 이미 affiliationId 기반 필터링 적용 확인.
- ✅ 프론트 별도 매핑 필드 불필요 결론 → 단일 본사 폴백을 잠금에도 사용.
- ✅ 백엔드 변경 없이 프론트만 수정으로 작업 가능.

### Phase 2 — 공통 컴포넌트 수정 (3가지 가드 추가)
**작업 포인트**:
1. **수정 폼 데이터 보존 가드** — `officeId == null && !isDisabled` 추가 → 기존 값이 있거나 잠긴 폼은 자동 적용 차단.
2. **단일 본사 폴백 잠금 강화** — `isOfficeFixed`에 `bpTree.length === 1` 추가 → 백엔드가 affiliation 기반으로 좁혀준 단일 본사도 자동 잠금.
3. **플랫폼 관리자 차단** — 자동 적용·잠금 양쪽에 `ownerCode !== PLATFORM` 가드 → 횡단 운영 보장.

**구현 디테일**:
- `useAuthStore`에서 `ownerCode` 사용 (이미 사용 중).
- 자동 적용 `useEffect` 가드 강화.
- `isOfficeFixed` 산출 로직에 단일 본사 폴백 추가 + PLATFORM 차단.
- JSDoc 주석에 v4 정책(매트릭스) 명시.

### Phase 3 — 검증

**Phase 3-A: 검색 회귀 (16개)**
- 도메인별 대표 페이지 진입 → 본사 자동 적용 + 잠금 확인.
- ownerCode 시나리오별: HEAD_OFFICE / FRANCHISE / 다중 본사 권한 / **PLATFORM(플랫폼 관리자)**.
- **PLATFORM 시나리오**: 본사 빈 값 + 잠금 없음 + 사용자가 본사 자유 선택 가능 확인.

**Phase 3-B: 시스템 관리 회귀 (3개)**
- `HolidaySearch`, `CommonCodeSearch`, `AuthoritySearch` → 본사 빈 값 + 전체 선택 가능 유지.

**Phase 3-C: 폼 회귀 (2개)**
- `MenuForm`: 등록 페이지 → 자동 적용. 수정 페이지 → 기존 본사 보존.
- `AuthorityForm`: 등록(`mode='create'`) → 자동 적용 + 잠금. 수정(`mode='edit'`) → `isDisabled=true`로 차단됨.

**Phase 3-D: Settings 회귀 (3개)**
- `EmployeeInfoSettings`, `LaborContractSettings`, `PayrollStatementSettings` → `autoSelect={false}`로 자동 적용 안 됨.

### Phase 4 — 빌드/린트
- `pnpm lint` 0 errors.
- `pnpm build` 성공.

### Phase 5 — 문서/PR
- 본 계획 문서 결과 갱신.
- PR 생성 (타겟 브랜치 `develop` 가정, 사용자 확인 필수).

---

## 5. 리스크 & 가드

| Risk | 가드 |
|------|------|
| 다중 본사 권한 계정 횡단 조회 차단 | `autoSelect={false}` 우회 경로 유지 |
| **플랫폼 관리자 본사 잠금** (전 본사 횡단 운영 차단) | **`ownerCode !== PLATFORM` 가드를 자동 적용·잠금 양쪽에 추가** |
| 수정 폼에서 기존 본사 값 덮어쓰기 | `officeId == null` 가드 |
| 상세 잠금 화면에서 자동 적용 호출 | `!isDisabled` 가드 |
| 잠금 우선순위 충돌 | PLATFORM 차단 → ownerCode → 단일 본사 폴백 순서 명시 |
| 잠금 정책으로 정상 다중 본사 사용자 답답함 | 시스템 관리 패턴 (`autoSelect={false}`)이 escape hatch |
| Settings 3개의 autoSelect=false 의도와 충돌 | 가드로 자동 적용 안 되므로 영향 없음 |
| **플랫폼 단일 본사 폴백 오발동** (플랫폼 관리자 환경에 본사 1개뿐일 때 자동 잠금되는 위험) | **PLATFORM 차단이 단일 본사 폴백보다 상위** |
| 백엔드 응답이 affiliationId 필터를 빠뜨리는 회귀 발생 | `affiliationId` 헤더 누락 시 401/403/유효성 에러로 회귀 알람. 별도 가드 불필요. |

---

## 6. 검증 체크리스트

- [x] **Phase 1**: 백엔드 검증 — `findHeadOfficeTree`가 affiliationId 기반 자동 필터링 적용 확인 (별도 매핑 필드 불필요)
- [ ] **Phase 2**: 공통 컴포넌트 수정 (3가지 가드 추가)
- [ ] **Phase 3-A**: 검색 16개 — 본사 권한 / 가맹점 권한 / 다중 본사 권한 / **플랫폼 관리자** 시나리오 (4종)
- [ ] **Phase 3-A-PLATFORM**: 플랫폼 관리자 진입 시 본사 빈 값 + 잠금 없음 + 자유 선택 가능
- [ ] **Phase 3-B**: 시스템 관리 3개 — `autoSelect={false}` 동작 보존
- [ ] **Phase 3-C-1**: `MenuForm` 등록/수정 분기 동작
- [ ] **Phase 3-C-2**: `AuthorityForm` create/edit 모드 동작
- [ ] **Phase 3-D**: Settings 3개 동작 보존
- [ ] **Phase 4**: `pnpm lint` 0 errors
- [ ] **Phase 4**: `pnpm build` 성공
- [ ] **Phase 5**: 문서 결과 갱신
- [ ] **Phase 5**: PR (타겟 브랜치 사용자 확인)

---

## 7. 미결정 사항 (검토 요청)

1. ~~**PR 타겟 브랜치**: `develop`로 진행해도 되나요?~~ → **확정: `develop`** (2026-04-28)
2. ~~**affiliation 매핑 키 미존재 시 대처**~~ → **해소(v4)**: 백엔드 `findHeadOfficeTree`가 이미 affiliationId 기반 필터링하므로 단일 본사 폴백만으로 충분. 백엔드 변경/보조 API 모두 불필요.
3. ~~**다중 본사 권한 계정의 잠금 정책**~~ → **확정: 자동잠금 적용** (단, PLATFORM은 자동선택만, 잠금 차단)
4. ~~**MenuForm 수정 모드 정책**~~ → **확정: `officeId==null` 가드로 자동 차단**
5. ~~**시스템 관리 3개 외 추가 예외 페이지**~~ → **확정: 추가 예외 없음** (기존 7개 + PLATFORM 정책으로 충분)
6. ~~**PLATFORM 정책**~~ → **확정: 자동선택은 발동(단일 본사 환경), 잠금은 차단**

---

## 8. 변경 이력

| 버전 | 날짜 | 변경 |
|------|------|------|
| v1 | 2026-04-28 | 초안 — 검색 19개만 |
| v2 | 2026-04-28 | 확장 — 폼/상세 직접 사용처 4개 합류, 가드 체계 도입 |
| v3 | 2026-04-28 | 플랫폼 관리자(`PRGRP_001_001`) 예외 정책 추가 — 자동 적용/잠금 모두 차단 |
| v4 | 2026-04-28 | 백엔드 검증 — `findHeadOfficeTree`가 affiliationId 기반 자동 필터링 → 매핑 필드 불필요. 작업 포인트 3가지로 축소. PR 타겟 `develop` 확정. |
| v5 | 2026-04-28 | 모든 정책 확정 — 자동잠금(PLATFORM은 자동선택만, 잠금 차단) / MenuForm 가드 / 추가 예외 없음. Phase 2 진입. |
| **v6** | **2026-04-28** | **백엔드 BP Master fallback 적용 후 PLATFORM 예외 제거 — 자동선택 = 잠금으로 통합. 슈퍼 어드민(매핑X+다본사)만 자유 선택.** |
