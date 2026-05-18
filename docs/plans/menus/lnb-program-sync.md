# LNB ↔ 프로그램 관리 데이터 동기화 계획

> 최종 수정: 2026-04-24
> 작성: 재영 + 클로
> 범위: whale-erp-front (LNB 동적화), whale-erp-api (V74 시드 + 로그인 응답 보강)

## 1. 배경

현재 시스템은 두 개의 "메뉴 진실 공급원(SSOT)"이 병존하는 상태다.

| SSOT | 위치 | 사용처 | 데이터 양 |
|------|------|--------|-----------|
| 정적 하드코딩 | `whale-erp-front/src/data/HeaderMenu.ts` | `Lnb.tsx` (ERP 메인 LNB) | 58 항목 (HOME 포함) |
| 정적 하드코딩 | `whale-erp-front/src/data/SupportMenu.ts` | `Lnb.tsx` (고객지원 LNB) | 4 항목 |
| DB | `programs` 테이블 | `/system/program` 프로그램 관리 화면 | 59 항목 (MNKND_001만) |

두 소스의 내용이 이미 서로 달라서, 사용자가 LNB에서 보는 메뉴와 프로그램 관리 화면에서 보는 메뉴가 불일치하는 상태다. 또한 `programs.menu_kind` 컬럼은 `MNKND_001`(ERP Platform)과 `MNKND_002`(고객지원) 두 종류를 구분하도록 설계되었으나 현재 MNKND_001만 사용 중이다.

## 2. 목표

1. **단일 진실 공급원(DB) 확립**: `programs` 테이블이 LNB와 프로그램 관리 화면 모두의 SSOT가 된다.
2. **초기 데이터 확정**: HeaderMenu.ts(ERP) + SupportMenu.ts(고객지원)의 내용을 DB로 이관한다.
3. **LNB 동적화**: LNB가 로그인 시 내려받은 `authority.programs`를 사용하도록 전환한다.
4. **정적 파일 제거**: `src/data/HeaderMenu.ts`, `src/data/SupportMenu.ts` 삭제.

## 3. 비기능 요구사항 / 제약

- **개발 DB 초기화 허용**: 프로덕션 데이터가 없는 개발 환경이므로 `authority_details`(479건)를 포함한 Hard Reset 허용.
- **Flyway 버전 규칙 준수**: 최신 V73 → 다음 번호 V74로 마이그레이션 작성.
- **권한 응답 호환성**: `Lnb.tsx`가 사용할 데이터는 로그인 응답(`/api/auth/login`) 내 `authority.programs` 필드. 아이콘을 보여주려면 이 응답에 `iconUrl`을 추가해야 한다.
- **3-depth 지원**: 현재 `Lnb.tsx`는 3단계까지 렌더링. 시드 데이터도 3단계 이내로 유지.

## 4. 전체 실행 순서 (4 Phase)

> **변경 이력**: 2026-04-24 옵션 B 채택 — 로그인 응답 확장(Phase 3 백엔드 작업) 제거됨. LNB는 기존 `GET /api/v1/system/programs` API를 재사용한다.

| Phase | 작업 | 프로젝트 | 산출물 | 검증 방법 |
|-------|------|----------|--------|-----------|
| 1 | HeaderMenu 중복/오류 정리 (시드 전 사전 작업) | front | 결정 명세 (이 문서 5장) | 코드 리뷰 |
| 2 | 시드 SQL 실행 — programs/authority_details 초기화 + 데이터 시드 | api (DB) | `/tmp/seed-programs.sql` (직접 실행) <br> *V74 승격은 추후 결정* | psql 실행 결과 + postgres MCP 검증 + 프로그램 관리 화면 육안 |
| 3 | `Lnb.tsx` 동적화 + 어댑터 함수 도입 | front | `Lnb.tsx` 수정, `src/util/lnb-adapter.ts` 신규, 쿼리 훅 추가 | `pnpm lint && pnpm build` + 로그인 시나리오 |
| 4 | `HeaderMenu.ts` / `SupportMenu.ts` 삭제 + 타입 중복 정리 | front | 파일 삭제, `schemas/menu.ts` 유지 | `pnpm lint && pnpm build` |

## 5. Phase 1 상세 — HeaderMenu.ts 정리 규칙

시드 전에 `HeaderMenu.ts`의 중복/오류를 제거한다. (파일을 실제로 수정하지는 않고, 본 문서의 "정리된 트리"를 기준으로 V74 INSERT를 작성한다.)

### 5.1 제거 대상

| 대상 | id | 이유 |
|------|-----|------|
| `id=1` Home | 1 | 사용자 지시: HOME은 프로그램 관리 대상이 아님 — **단, LNB 표시는 유지** (`Lnb.tsx` 에서 `HOME_ITEM` 상수로 prepend, sentinel id=0) |
| `id=6` 환경 설정 (1depth 그룹 전체) | 6, 22, 23, 24, 52 | 시스템 관리(id=7) 하위에 동일 메뉴가 이미 존재 (공통코드/권한/휴일) |
| `id=58` 공통 데이터 관리 | 58 | `id=51`과 name/link 완전 중복 |

### 5.2 이동 대상

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| `법정공휴일 관리` (/system/holiday/legal) | 환경 설정(id=6) 하위 | **시스템 관리(id=7) 하위 (id=29 휴일 관리 옆)** — 환경 설정이 제거되지만 이 경로는 보존해야 함 |

### 5.3 leaf `#` 항목 정책 (R2)

- `link='#'`이면서 **자식이 있는** 항목(그루핑용): `path=NULL`, `is_active=true`로 시드
- `link='#'`이면서 **자식이 없는** 항목(페이지 미구현): `path=NULL`, `is_active=false`로 시드

**is_active=false 대상 (5개)**: 신용카드 매출조회 하위 3건(id 19/20/21), 이메일 템플릿 관리(id 30), 부가서비스 요금제관리(id 32), 결제현황(id 33), 부가서비스 셋팅(id 34), 공통 데이터 관리(id 51)

### 5.4 정리된 ERP 트리 (MNKND_001)

> 표의 id는 HeaderMenu.ts 원본 id로 기록 (추적용). 실제 DB ID는 V74 마이그레이션의 시퀀스로 새로 발급됨.

```
[1] Master data 관리 (#)                                 [id=2]
  ├─ 회원 Master (/master/customer/account)              [id=54]
  ├─ 파트너 정보 관리 (/master/bp)                        [id=10]
  ├─ 메뉴 정보 관리 (#)                                  [id=11]
  │   ├─ 마스터용 메뉴 Master (/master/menu)              [id=35]
  │   └─ 점포용 메뉴 Master (/master/menu/store)          [id=36]
  ├─ 가격 Master (#)                                     [id=12]
  │   ├─ 마스터용 가격 관리 (/master/pricing/price-master) [id=37]
  │   ├─ 마스터용 가격 이력 (/master/pricing/price-history)[id=53]
  │   └─ 점포용 프로모션 가격 관리 (/master/pricing/store-promotion) [id=38]
  └─ 카테고리 Master (#)                                 [id=13]
      └─ 마스터용 카테고리 관리 (/master/category/master)  [id=39]

[2] 가맹점 및 점포 관리 (#)                              [id=3]
  └─ 가맹점 및 점포 관리 (#)                             [id=14]
      └─ 점포 정보 관리 (/store/info)                    [id=40]

[3] 직원 관리 (#)                                        [id=4]
  ├─ 직원 관리 (#)                                       [id=15]
  │   ├─ 직원 정보 관리 (/employee/info)                  [id=41]
  │   └─ 근로 계약 관리 (/employee/contract)              [id=42]
  ├─ 급여 명세서 (#)                                     [id=16]
  │   ├─ 정직원 급여명세서 (/employee/payroll/regular)    [id=43]
  │   ├─ 파트타이머 급여명세서 (/employee/payroll/parttime)[id=44]
  │   └─ 연장근무 수당명세서 (/employee/payroll/overtime) [id=45]
  ├─ 근무 현황 (#)                                       [id=17]
  │   ├─ 출퇴근 현황 (/employee/attendance)               [id=46]
  │   ├─ 매장별 근무 계획표 (/employee/schedule/view)      [id=47]
  │   └─ 매장별 근무 계획 수립 (/employee/schedule/plan)   [id=48]
  └─ 직원별 TO-DO 관리 (#)                               [id=18]
      └─ TO-DO 관리 (/employee/todo)                     [id=49]

[4] 신용카드 매출조회 (#)                                [id=5]
  ├─ 일별 승인집계 조회 (#, is_active=false)              [id=19]
  ├─ 기간별 승인집계 조회 (#, is_active=false)            [id=20]
  └─ 월별 승인집계 조회 (#, is_active=false)              [id=21]

[5] 시스템 관리 (#)                                      [id=7]
  ├─ 관리자 관리 (/system/admin)                          [id=25]
  ├─ 프로그램 관리 (/system/program)                      [id=26]
  ├─ 권한 관리 (/system/authority)                        [id=27]
  ├─ 공통코드 관리 (#)                                   [id=28]
  │   ├─ 공통코드 관리 (/system/common-codes)             [id=50]
  │   ├─ 공통 데이터 관리 (#, is_active=false)            [id=51]
  │   ├─ 직원정보 공통코드 (/employee/employee-settings)  [id=55]
  │   ├─ 근로계약서 공통코드 (/employee/employee-contract-settings) [id=56]
  │   └─ 급여명세서 공통코드 (/employee/payroll/regular/common-code) [id=57]
  ├─ 휴일 관리 (/system/holiday)                          [id=29]
  ├─ 법정공휴일 관리 (/system/holiday/legal)              [id=52, 이동됨]
  └─ 이메일 템플릿 관리 (#, is_active=false)              [id=30]

[6] 과금 관리 (#)                                        [id=8]
  ├─ ERP 요금제 관리 (/subscription)                      [id=31]
  ├─ 부가서비스 요금제관리 (#, is_active=false)           [id=32]
  └─ 결제현황 (#, is_active=false)                        [id=33]

[7] 서비스 관리 (#)                                      [id=9]
  └─ 부가서비스 셋팅 (#, is_active=false)                 [id=34]
```

**1depth 아이콘**: HeaderMenu 원본의 `lnb_menu_icon01.svg` ~ `lnb_menu_icon08.svg` (Home 아이콘 icon00은 제외). 환경 설정(id=6)이 빠지므로 아이콘 6번부터 한 칸씩 당겨진다.

### 5.5 정리된 고객지원 트리 (MNKND_002)

```
[1] 요금안내/변경 (/customer/rate-plan)       [SupportMenu id=1]
[2] 부가서비스 신청 (/customer/after-service) [SupportMenu id=2]
[3] 공지사항 (/customer/notice)               [SupportMenu id=3]
[4] 문의하기 (/customer/contact)              [SupportMenu id=4]
```

모두 1depth, 자식 없음, 실제 경로 보유. 아이콘은 `lnb_menu_icon01.svg` ~ `lnb_menu_icon04.svg` 사용.

## 6. Phase 2 상세 — V74 마이그레이션

### 6.1 파일 정보

- **경로**: `whale-erp-api/src/main/resources/db/migration/V74__reset_and_seed_programs_from_headermenu.sql`
- **버전**: V74 (V73 `create_notification_tables` 다음)

### 6.2 SQL 구조

```sql
-- V74__reset_and_seed_programs_from_headermenu.sql
-- 개발 환경 초기화: programs + authority_details를 비우고
-- HeaderMenu.ts + SupportMenu.ts 기반으로 시드한다.
-- (authority_details FK 제약으로 인해 순서를 지켜 DELETE)

BEGIN;

-- 1. 권한 매핑 삭제 (FK 제약 우선 해결)
DELETE FROM authority_details;

-- 2. 기존 프로그램 전체 삭제
DELETE FROM programs;

-- 3. 시퀀스 초기화
ALTER SEQUENCE programs_id_seq RESTART WITH 1;

-- 4. DO 블록으로 트리 순서대로 INSERT
--    (parent_id를 RETURNING으로 받아 하위에 전달)
DO $$
DECLARE
  v_master_id        BIGINT;
  v_master_menu_id   BIGINT;
  v_master_price_id  BIGINT;
  v_master_cat_id    BIGINT;
  v_store_id         BIGINT;
  v_store_mgmt_id    BIGINT;
  v_emp_id           BIGINT;
  v_emp_mgmt_id      BIGINT;
  v_emp_payroll_id   BIGINT;
  v_emp_work_id      BIGINT;
  v_emp_todo_id      BIGINT;
  v_card_id          BIGINT;
  v_system_id        BIGINT;
  v_system_code_id   BIGINT;
  v_billing_id       BIGINT;
  v_service_id       BIGINT;
BEGIN
  -- ============================================
  -- MNKND_001 (ERP Platform)
  -- ============================================

  -- [1] Master data 관리
  INSERT INTO programs (parent_id, level, order_index, name, path, icon_url, menu_kind, is_active, is_deleted, created_at, updated_at)
  VALUES (NULL, 1, 1, 'Master data 관리', NULL,
          'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon01.svg',
          'MNKND_001', true, false, NOW(), NOW())
  RETURNING id INTO v_master_id;

  INSERT INTO programs (parent_id, level, order_index, name, path, menu_kind, is_active, is_deleted, created_at, updated_at)
  VALUES
    (v_master_id, 2, 1, '회원 Master',        '/master/customer/account', 'MNKND_001', true, false, NOW(), NOW()),
    (v_master_id, 2, 2, '파트너 정보 관리',   '/master/bp',               'MNKND_001', true, false, NOW(), NOW());

  INSERT INTO programs (parent_id, level, order_index, name, path, menu_kind, is_active, is_deleted, created_at, updated_at)
  VALUES (v_master_id, 2, 3, '메뉴 정보 관리', NULL, 'MNKND_001', true, false, NOW(), NOW())
  RETURNING id INTO v_master_menu_id;

  INSERT INTO programs (parent_id, level, order_index, name, path, menu_kind, is_active, is_deleted, created_at, updated_at)
  VALUES
    (v_master_menu_id, 3, 1, '마스터용 메뉴 Master', '/master/menu',       'MNKND_001', true, false, NOW(), NOW()),
    (v_master_menu_id, 3, 2, '점포용 메뉴 Master',   '/master/menu/store', 'MNKND_001', true, false, NOW(), NOW());

  -- ... (가격 Master, 카테고리 Master, 2~7 전체 INSERT)

  -- ============================================
  -- MNKND_002 (고객지원)
  -- ============================================
  INSERT INTO programs (parent_id, level, order_index, name, path, icon_url, menu_kind, is_active, is_deleted, created_at, updated_at)
  VALUES
    (NULL, 1, 1, '요금안내/변경',   '/customer/rate-plan',
     'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon01.svg',
     'MNKND_002', true, false, NOW(), NOW()),
    (NULL, 1, 2, '부가서비스 신청', '/customer/after-service',
     'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon02.svg',
     'MNKND_002', true, false, NOW(), NOW()),
    (NULL, 1, 3, '공지사항',        '/customer/notice',
     'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon03.svg',
     'MNKND_002', true, false, NOW(), NOW()),
    (NULL, 1, 4, '문의하기',        '/customer/contact',
     'https://whale-erp-files.s3.ap-northeast-2.amazonaws.com/assets/program_icons/lnb_menu_icon04.svg',
     'MNKND_002', true, false, NOW(), NOW());
END $$;

COMMIT;
```

### 6.3 검증 쿼리

```sql
-- 총 건수 (ERP 약 45건 + 고객지원 4건 예상)
SELECT menu_kind, COUNT(*) FROM programs WHERE is_deleted = false GROUP BY menu_kind;

-- 트리 무결성 (level=1은 parent_id=NULL, level>=2는 parent_id 필수)
SELECT * FROM programs WHERE (level = 1 AND parent_id IS NOT NULL) OR (level >= 2 AND parent_id IS NULL);

-- 같은 parent 하에 order_index 중복 체크
SELECT parent_id, order_index, COUNT(*)
FROM programs
WHERE is_deleted = false
GROUP BY parent_id, order_index
HAVING COUNT(*) > 1;
```

### 6.4 롤백 전략

- Flyway는 undo 상용 기능 제외, 본 마이그레이션은 DELETE를 포함하므로 **롤백 SQL 별도 제공 안 함**.
- 문제가 생기면 V75에서 원상복구 SQL을 재작성한다.
- 본 마이그레이션 적용 전 `pg_dump programs authority_details` 스냅샷 권장.

## 7. ~~Phase 3 — 로그인 응답 iconUrl 추가~~ (폐기)

### 7.1 결정 기록 (2026-04-24)

- **채택**: 옵션 B — 기존 `GET /api/v1/system/programs?menuKind=MNKND_001` 재사용
- **폐기**: 옵션 A (로그인 응답 확장)
- **이유**:
  1. `icon_url`은 메뉴 자체의 속성 — 사용자별 권한 응답에 끼워 넣는 건 책임 분리 위반
  2. 기존 API가 이미 `icon_url`을 포함해 트리로 반환
  3. 백엔드 수정 0건
  4. LNB는 세션당 1회 그려지므로 추가 API 호출 비용 미미

### 7.2 옵션 B의 데이터 흐름

```
로그인
  ↓
auth-store.authority.programs   ← 권한 트리 (ID, canRead/Update/Delete)
                                  iconUrl/order_index/path 메타 없음
LNB 첫 렌더
  ↓
TanStack Query: GET /api/v1/system/programs?menuKind=MNKND_001
                                ↓
                        Program[] 트리 (id, name, path, iconUrl, orderIndex, isActive)

LNB 어댑터: 두 데이터 머지
  - 권한 화이트리스트 = authority.programs의 ID 집합 (canRead!=false만)
  - Program 트리에서 화이트리스트 ID만 통과
  - HeaderMenuItem 형태로 변환
```

### 7.3 권한 필터링 정책 (다음 결정 사항)

| 정책 | 동작 | 적합한 경우 |
|------|------|-------------|
| **B-1** 필터링 없음 | `is_active=true`인 모든 항목 표시 | 모든 사용자가 동일 LNB. 클릭 시 페이지에서 권한 체크 |
| **B-2** authority 화이트리스트 | `authority.programs` ID 집합과 교집합만 표시 | 권한 없는 메뉴는 LNB에 안 보임 (보안 + UX) |
| **B-3** B-2 + canRead 체크 | B-2 + `canRead=true`만 | 가장 엄격 |

→ **권장: B-2** (보안/UX 측면에서 ERP 표준)

### 7.4 백엔드 변경

**없음**. Phase 3은 결정 기록만 남기고 작업은 0건.

## 8. Phase 3 상세 — Lnb.tsx 동적화 (옵션 B 기반)

### 8.1 신규/수정 파일

| 파일 | 동작 | 설명 |
|------|------|------|
| `src/hooks/queries/use-program-queries.ts` | 수정 | 기존 `usePrograms(menuKind)` 훅이 있으면 재사용. 없으면 추가. `menuKind` 별로 캐싱. |
| `src/util/lnb-adapter.ts` | 신규 | 권한 + 메타 머지 → `HeaderMenuItem[]` 변환 어댑터 |
| `src/components/ui/common/Lnb.tsx` | 수정 | `HeaderMenu`/`SupportMenu` import 제거 → `usePrograms` + 어댑터 |

### 8.2 어댑터 함수

**파일**: `src/util/lnb-adapter.ts` (신규)

```typescript
import type { Program } from '@/lib/schemas/program'
import type { LoginAuthorityProgram } from '@/lib/schemas/auth'
import type { HeaderMenuItem } from '@/lib/schemas/menu'

/**
 * Program 트리(API 메타 + iconUrl + order)와
 * authority.programs 트리(권한)를 머지하여 LNB가 쓰는 HeaderMenuItem 트리로 변환.
 *
 * 정책 (B-2 권한 화이트리스트 — 재영 결정):
 * - authority.programs 의 id 집합을 화이트리스트로 사용 (canRead!==false 만)
 * - Program 트리에서 화이트리스트에 포함된 노드만 통과
 * - is_active === false 노드는 LNB 미노출 (페이지 미구현)
 * - children 이 빈 배열이 되면 undefined (Lnb 가 분기에 사용)
 *
 * authority.programs 가 undefined 면 화이트리스트 우회 (관리자 대비 또는 초기화 직후)
 */
function collectAllowedIds(
  programs: LoginAuthorityProgram[] | null | undefined
): Set<number> | null {
  if (!programs) return null  // null 반환 = 모든 ID 허용
  const acc = new Set<number>()
  const walk = (nodes: LoginAuthorityProgram[]) => {
    for (const n of nodes) {
      if (n.canRead !== false) acc.add(n.id)
      if (n.children) walk(n.children)
    }
  }
  walk(programs)
  return acc
}

export function toHeaderMenuItems(
  programs: Program[] | null | undefined,
  authorityPrograms: LoginAuthorityProgram[] | null | undefined
): HeaderMenuItem[] {
  if (!programs) return []
  const allowed = collectAllowedIds(authorityPrograms)

  const map = (nodes: Program[]): HeaderMenuItem[] =>
    nodes
      .filter((p) => p.is_active && (allowed === null || (p.id !== null && allowed.has(p.id))))
      .sort((a, b) => a.order_index - b.order_index)
      .map((p) => {
        const children = p.children ? map(p.children) : []
        return {
          id: p.id ?? 0,
          name: p.name,
          link: p.path ?? '#',
          icon: p.icon_url ?? undefined,
          children: children.length > 0 ? children : undefined,
        }
      })

  return map(programs)
}
```

> 핵심 정책 라인 (`filter`, `sort`, 화이트리스트 우회 조건)은 **재영이 직접 작성/조정**하는 부분. B-1/B-2/B-3 어떤 정책으로 갈지에 따라 `filter` 한 줄이 달라진다.

### 8.3 Lnb.tsx 변경

**변경 전**:

```tsx
import { HeaderMenu } from '@/data/HeaderMenu'
import { SupportMenu } from '@/data/SupportMenu'
...
const menuList = menuType === 'support' ? SupportMenu : HeaderMenu
```

**변경 후**:

```tsx
import { useMemo } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { usePrograms } from '@/hooks/queries/use-program-queries'
import { toHeaderMenuItems } from '@/util/lnb-adapter'
// HeaderMenu / SupportMenu import 제거
...
const menuKind = menuType === 'support' ? 'MNKND_002' : 'MNKND_001'
const { data: programs } = usePrograms(menuKind)
const authorityPrograms = useAuthStore((s) => s.authority?.programs)

const menuList = useMemo(
  () => toHeaderMenuItems(programs, authorityPrograms),
  [programs, authorityPrograms]
)
```

### 8.4 TanStack Query 캐싱 정책

- `staleTime`: 10분 (메뉴는 자주 변하지 않음)
- 쿼리 키: `programKeys.list(menuKind)` 형태로 menuKind별 캐싱
- 프로그램 관리 화면에서 CRUD 시 `queryClient.invalidateQueries(programKeys.lists())`로 LNB 자동 갱신

### 8.5 fallback 정책

| 상태 | LNB 표시 |
|------|----------|
| `programs` 로딩 중 | 빈 LNB (또는 스켈레톤) |
| `programs` 빈 배열 | 빈 LNB |
| `authorityPrograms` undefined | **모든 `is_active=true` 항목 표시** (화이트리스트 우회) |
| `authorityPrograms` 빈 배열 | 빈 LNB (권한 없음) |
| 로그아웃/토큰 만료 | `(sub)/layout.tsx`가 `/login` 리다이렉트 → LNB 자체가 언마운트 |

## 9. Phase 4 상세 — 잔재 제거

| 파일 | 동작 |
|------|------|
| `whale-erp-front/src/data/HeaderMenu.ts` | 삭제 |
| `whale-erp-front/src/data/SupportMenu.ts` | 삭제 |
| `whale-erp-front/src/lib/schemas/menu.ts` | **유지** (`HeaderMenuItem` 인터페이스 + Zod 스키마가 여기 있음, Lnb/어댑터가 사용) |
| `whale-erp-front/src/data/` 디렉토리 | 다른 파일이 없으면 삭제 |

## 10. 검증 시나리오

### 10.1 백엔드

- [ ] `./gradlew flywayMigrate` 성공
- [ ] `flywayInfo`에 V74 Success
- [ ] 6.3의 검증 쿼리 3종 모두 기대값
- [ ] `/api/v1/system/programs?menuKind=MNKND_001` → 정리된 ERP 트리
- [ ] `/api/v1/system/programs?menuKind=MNKND_002` → 고객지원 4건

### 10.2 프로그램 관리 화면

- [ ] `/system/program` 접속 → LNB와 동일한 ERP 트리 표시
- [ ] `selectedMenuKind` 전환 기능 있다면 MNKND_002로 바꿔 고객지원 메뉴 확인
- [ ] 프로그램 CRUD 정상 동작 (편집 → 저장 → 새로고침 반영)

### 10.3 프론트 (Phase 3 완료 후)

- [ ] `pnpm lint` 0 에러
- [ ] `pnpm build` 성공
- [ ] 로그인 → LNB에 정리된 메뉴가 렌더됨
- [ ] 권한이 제한된 계정으로 로그인 → 화이트리스트 외 항목이 LNB에서 제외됨 (B-2 정책)
- [ ] 3-depth 펼침/접힘 정상
- [ ] 1depth 아이콘 URL 렌더링 정상
- [ ] `/customer/...` 진입 시 고객지원 LNB(MNKND_002)가 4개 메뉴로 정상 표시
- [ ] 프로그램 관리 화면에서 메뉴 추가/수정 후 `queryClient.invalidateQueries` 발동 → LNB 즉시 반영

## 11. 위험과 대응

| 위험 | 영향도 | 대응 |
|------|--------|------|
| 프로덕션과 스키마 차이 발생 | 상 | V74는 개발 전용임을 커밋 메시지/PR 설명에 명시. 프로덕션 적용 시 별도 데이터 마이그레이션 계획 필요 |
| 로그인 응답 크기 증가 (iconUrl 추가) | 하 | iconUrl 문자열이므로 미미 |
| `authority.programs` 타입 변경이 기존 코드에 영향 | 중 | `LoginAuthorityProgram`를 사용하는 모든 곳에서 `iconUrl` optional로 추가 → 기존 코드 깨지지 않음 |
| leaf `#` 항목이 LNB에 클릭 불가 상태로 노출 | 하 | `is_active=false` + Lnb 어댑터에서 필터링 가능 (또는 노출하되 disabled 스타일) |
| React Compiler 린트 (set-state-in-effect) 위반 | 중 | 어댑터는 `useMemo`로 파생, useEffect 불필요 |

## 12. 실행 체크리스트 (구현 단계 옮겨갈 때 사용)

- [x] Phase 1: 본 문서 5장 트리 재확인 (재영) — 2026-04-24 완료
- [x] Phase 2-0: `/tmp/seed-programs.sql` 작성 — 2026-04-24 완료
- [x] Phase 2-1: 재영이 psql로 시드 SQL 실행 — 2026-04-24 완료
- [x] Phase 2-2: postgres MCP로 검증 쿼리 4종 통과 확인 — 2026-04-24 완료 (MNKND_001=52, MNKND_002=4, 트리 무결성 OK, order_index 진짜 중복 0, authority_details=0)
- [x] Phase 2-3: 프로그램 관리 화면 육안 확인 — 2026-04-24 완료
- [ ] Phase 2-4: (선택) V74 마이그레이션으로 승격 — 팀 공유/스테이징 적용 시점에 결정
- [x] Phase 3 결정: 옵션 B (기존 API 재사용) 채택, **B-1 단순 활성 필터** 정책 — 2026-04-24 (authority_details=0이라 B-2 화이트리스트 불성립)
- [x] Phase 3-1: `useProgramList(menuKind)` 기존 훅 재사용 (정비 불필요) — 2026-04-24 완료
- [x] Phase 3-2: `src/util/lnb-adapter.ts` 작성 (B-1 정책) — 2026-04-24 완료
- [x] Phase 3-3: `Lnb.tsx` 수정 (HeaderMenu/SupportMenu import 제거 + useProgramList + 어댑터 + HOME prepend + Image 안전 처리) — 2026-04-24 완료
- [x] Phase 3-4: `pnpm lint && pnpm build` — 0 errors — 2026-04-24 완료
- [x] Phase 3-5: 시나리오 검증 — 2026-04-24 완료
- [x] Phase 3-Patch-1: HOME 누락 발견 → `Lnb.tsx`에 `HOME_ITEM` prepend (id=0 sentinel) — 2026-04-24
- [x] Phase 3-Patch-2: 1depth 펼침 화살표 모순 → `.act` 조건을 `expandedMenu === menu.id` 로 변경 — 2026-04-24
- [x] Phase 3-Patch-3: 2depth 화살표 SCSS 누락 발견 → 인라인으로 추가했다가 스크롤바와 겹쳐서 제거 (2depth 는 화살표 없이 클릭으로만 토글) — 2026-04-24
- [x] Phase 4-1: `HeaderMenu.ts` / `SupportMenu.ts` 삭제 + 빈 `src/data/` 디렉토리 제거 — 2026-04-24 완료
- [x] Phase 4-2: `pnpm lint && pnpm build` 최종 확인 — 0 errors, build 성공 — 2026-04-24 완료

## 13. 관련 파일/참조

- 백엔드
  - `whale-erp-api/src/main/resources/db/migration/V25__add_menu_kind_icon_url_to_programs.sql`
  - `whale-erp-api/src/main/resources/db/migration/V73__create_notification_tables.sql` (직전 버전)
  - `whale-erp-api/.../domain/system/entity/Program.kt`
  - `whale-erp-api/.../domain/system/program/controller/ProgramController.kt`
- 프론트
  - `whale-erp-front/src/components/ui/common/Lnb.tsx`
  - `whale-erp-front/src/data/HeaderMenu.ts` (삭제 예정)
  - `whale-erp-front/src/data/SupportMenu.ts` (삭제 예정)
  - `whale-erp-front/src/lib/schemas/menu.ts` (유지)
  - `whale-erp-front/src/stores/auth-store.ts`
  - `whale-erp-front/src/stores/program-store.ts`
  - `whale-erp-front/src/hooks/queries/use-program-queries.ts`
- 공통코드
  - `MNKND_001` (ERP Platform), `MNKND_002` (고객지원)

## 14. MNKND_002 권한 우회 정책 추가 (2026-05-07)

### 배경

LNB DB 동기화(559e5c0, 2026-04-24) 이후 LNB는 `useProgramList(menuKind)`로 양쪽 카테고리를 분기 조회하지만,
백엔드 `AuthorityDetailRepositoryImpl.findProgramsWithAuthority`(`02180d41`, 2026-02-10)는 권한 응답에서
`menuKind = 'MNKND_001'`만 포함하도록 제한. → 사용자의 `auth-store.authority` 트리에는 MNKND_002 프로그램 id가
존재하지 않으므로, `lnb-adapter.toHeaderMenuItems`의 권한 화이트리스트(B-3+)가 leaf 노드를 전부 차단 → 모든 사용자가
고객지원 메뉴를 LNB에서 볼 수 없는 상태.

### 정책 결정 (2026-05-07)

**MNKND_002(고객지원)는 권한 종속 메뉴가 아니다.** 모든 로그인 사용자에게 노출.

- 02180d41 백엔드 정책 유지 (MNKND_001만 권한 관리 대상)
- 권한 관리 페이지(`/system/authority/{id}`, `/system/authority/create`, `/settings/authority`)는 변경 없음
- LNB 어댑터만 `menuType === 'support'`일 때 권한 화이트리스트 우회

### 라우트 가드 영향 검토

- `(sub)/layout.tsx`: 토큰 체크만 — path 기반 권한 가드 없음 ✅
- `/customer/*` 페이지(4개): 가드 없음, 컴포넌트 직접 렌더 ✅
- 클라이언트 라우트 가드 미들웨어/HOC 없음 (`LoginAuthorityProgram` 기반 가드 패턴 부재) ✅
- 백엔드 `hasReadPermission`은 프론트에서 직접 호출 안 됨 ✅
- `findActiveFromPathname`(Lnb 내부): bypass 적용된 menuList에 MNKND_002 메뉴 포함되므로 정상 활성 매칭 ✅

→ LNB 어댑터 수정만으로 충분, 추가 가드 우회 불필요.

### 변경 코드

**`src/util/lnb-adapter.ts`**: `toHeaderMenuItems`에 `options?: { bypassAuthority?: boolean }` 인자 추가.
`bypassAuthority === true`면 leaf 노드 권한 화이트리스트(`readable.has(p.id)`) 검사를 건너뛰고 `is_active === true && p.id !== null`만으로 통과.

**`src/components/ui/common/Lnb.tsx`**: `menuType === 'support'`일 때 `{ bypassAuthority: true }` 전달.

### 정책 박제 의도

- 백엔드 정책(MNKND_001만 권한 관리)이 향후 변경되면 본 우회 옵션도 재검토
- 그룹 노드 자동 표시 정책(B-3+)은 그대로 유지 — bypass는 leaf 권한 검사에만 한정 적용
