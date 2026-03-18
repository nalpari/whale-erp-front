/**
 * HeadOfficeFranchiseStoreSelect
 *
 * ERP 전역에서 사용되는 **본사/가맹점/점포 계층 선택** 공통 컴포넌트.
 * 검색어 입력 기반 드롭다운(SearchSelect)으로 대량 옵션에서도 빠르게 필터링 가능.
 * 선택값은 `{ head_office, franchise, store }` 형태로 상위 컴포넌트에 반환된다.
 *
 * ---
 *
 * ## 사용 예시
 *
 * ### 기본 사용 (본사/가맹점/점포 전부 표시) — StoreSearch, AttendanceSearch 패턴
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
 *   officeId={filters.officeId ?? null}
 *   franchiseId={filters.franchiseId ?? null}
 *   storeId={filters.storeId ?? null}
 *   onChange={(next) => { ... }}
 *   onMultiOffice={handleMultiOffice}
 * />
 * ```
 *
 * ### 본사+점포만 (가맹점 생략) — StoreMenuSearch 패턴
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
 *   fields={['office', 'store']}
 *   officeId={filters.officeId ?? null}
 *   franchiseId={null}
 *   storeId={filters.storeId ?? null}
 *   onChange={(next) => { ... }}
 *   onMultiOffice={handleMultiOffice}
 * />
 * ```
 *
 * ### 점포 필수 입력 — WorkScheduleSearch 패턴
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
 *   isStoreRequired={true}
 *   showStoreError={showStoreError}
 *   officeId={form.officeId ?? null}
 *   franchiseId={form.franchiseId ?? null}
 *   storeId={form.storeId ?? null}
 *   onChange={(next) => { ... }}
 *   onMultiOffice={handleMultiOffice}
 * />
 * ```
 *
 * ### 자동 선택 비활성화 — HolidaySearch, CommonCodeSearch, AuthoritySearch 패턴
 * 시스템 관리 페이지에서는 계정 유형에 관계없이 본사/가맹점을 고정하지 않는다.
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={false}
 *   autoSelect={false}
 *   fields={['office', 'franchise']}
 *   officeId={localParams.officeId ?? null}
 *   franchiseId={localParams.franchiseId ?? null}
 *   storeId={null}
 *   onChange={handleBpSelectChange}
 *   isDisabled={isBpDisabled}
 * />
 * ```
 *
 * ### 폼(등록/수정) 내 사용 — AuthorityForm 패턴 (비활성화 옵션 포함)
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={!!errors.head_office_id}
 *   isFranchiseRequired={showFranchise}
 *   fields={showFranchise ? ['office', 'franchise'] : ['office']}
 *   officeId={formData.head_office_id ?? null}
 *   franchiseId={formData.franchisee_id ?? null}
 *   storeId={null}
 *   onChange={handleBpSelectChange}
 *   isDisabled={mode === 'edit'}
 * />
 * ```
 *
 * ---
 *
 * ## 계정 유형별 자동 선택 (`autoSelect={true}` 기본값일 때)
 *
 * ownerCode(Zustand auth-store)를 우선 사용하여 계정 유형을 판단한다.
 * ownerCode가 없으면 bpTree 구조로 추론한다 (하위 호환).
 *
 * | ownerCode       | 계정 유형 | 본사                | 가맹점             | 점포        |
 * | --------------- | --------- | ------------------- | ------------------ | ----------- |
 * | PRGRP_001_001   | 플랫폼    | 사용자 선택         | 사용자 선택        | 사용자 선택 |
 * | PRGRP_002_001   | 본사      | 자동 고정(readOnly) | 사용자 선택        | 사용자 선택 |
 * | PRGRP_002_002   | 가맹점    | 자동 고정(readOnly) | 자동 고정(readOnly)| 사용자 선택 |
 * | (없음)          | 추론      | bpTree.length===1 시 고정 | 단일 가맹점 시 고정 | 사용자 선택 |
 *
 * `autoSelect={false}` 설정 시 계정 유형과 무관하게 자동 선택/고정이 비활성화된다.
 * 시스템 관리 페이지(휴일, 공통코드, 권한)에서 사용.
 *
 * ---
 *
 * ## 컴포넌트 내부 로직
 *
 * ### 데이터 흐름
 * - `useBpHeadOfficeTree()` → 본사/가맹점 트리 로드 → `buildOfficeOptions()`, `buildFranchiseOptions()`로 옵션 빌드
 * - `useStoreOptions(officeId, franchiseId)` → 선택된 본사/가맹점에 해당하는 점포 옵션 로드
 *
 * ### 자동 선택 useEffect 로직 (autoSelect=true 시)
 * - `isOfficeFixed`: ownerCode가 본사(PRGRP_002_001) 또는 가맹점(PRGRP_002_002)이면 true.
 *   ownerCode 없으면 bpTree.length === 1이면 true. 초기화 후에도 자동 복원(readOnly).
 * - `isFranchiseFixed`: ownerCode가 가맹점(PRGRP_002_002)이면 true.
 *   ownerCode 없으면 bpTree.length === 1 && franchises.length === 1이면 true.
 * - **다중 본사**: 자동 선택 없음. onMultiOffice(true) 콜백으로 상위에 통보.
 *
 * ### 핵심 Ref
 * - `onChangeRef`: onChange 콜백의 안정적 참조 유지. useEffect 내에서 호출 시
 *   의존성 배열에서 제외하여 불필요한 effect 재실행 방지.
 * - `onMultiOfficeRef`: onMultiOffice 콜백의 안정적 참조 유지. bpTree 로드 후 다중 본사 여부 통보.
 *
 * ### 상위→하위 캐스케이드 초기화
 * - 본사 변경 → 새 본사의 가맹점 목록에 기존 가맹점 없으면 가맹점 초기화, 점포는 항상 초기화
 * - 가맹점 변경 → 점포 초기화
 * - 점포 변경 → 본사/가맹점 유지
 *
 * ### 옵션 빌드 로직 (buildFranchiseOptions)
 * - `officeId === null` → bpTree 전체의 가맹점을 flatMap으로 표시 (전체 보기)
 * - `officeId !== null` → 해당 본사의 가맹점만 필터하여 표시
 */
'use client'

import './custom-css/FormHelper.css'
import { useEffect, useMemo, useRef } from 'react'
import { useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import type { BpHeadOfficeNode } from '@/types/bp'
import SearchSelect, { type SelectOption as SearchSelectOption } from '@/components/ui/common/SearchSelect'

export type SelectOption = SearchSelectOption

export type OfficeFranchiseStoreValue = {
    head_office: number | null // 본사 선택 값(id)
    franchise: number | null // 가맹점 선택 값(id)
    store: number | null // 점포 선택 값(id)
}

type OfficeFranchiseStoreField = 'office' | 'franchise' | 'store'

type HeadOfficeFranchiseStoreSelectProps = {
    isHeadOfficeRequired?: boolean
    showHeadOfficeError?: boolean
    headOfficeErrorMessage?: string
    isFranchiseRequired?: boolean
    isStoreRequired?: boolean
    showStoreError?: boolean
    officeId: number | null // 본사 선택 값(id)
    franchiseId: number | null // 가맹점 선택 값(id)
    storeId: number | null // 점포 선택 값(id)
    fields?: OfficeFranchiseStoreField[] // 표시할 필드 조합
    onChange: (value: OfficeFranchiseStoreValue) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
    isDisabled?: boolean // 전체 비활성화 여부
    /** 단일 본사일 때 자동 선택/고정 여부 (기본 true). 검색 컨텍스트에서는 false로 설정하여 "전체" 선택 허용 */
    autoSelect?: boolean
    /** bpTree 로드 후 다중 본사 여부를 알려주는 콜백 */
    onMultiOffice?: (isMulti: boolean) => void
    /** 자동 선택 발생 시 호출되는 콜백 (본사/가맹점 계정 첫 진입 시 appliedFilters 동기화용) */
    onAutoSelect?: (value: OfficeFranchiseStoreValue) => void
}

/** bpTree의 본사 목록을 SearchSelect 옵션 형태로 변환 */
const buildOfficeOptions = (bpTree: BpHeadOfficeNode[]) =>
    bpTree.map((office) => ({ value: String(office.id), label: office.name }))

/**
 * 가맹점 옵션 빌드.
 * - officeId가 null이면 전체 본사의 가맹점을 flatMap으로 합쳐 표시 (전체 보기)
 * - officeId가 있으면 해당 본사 하위 가맹점만 필터하여 표시
 */
const buildFranchiseOptions = (bpTree: BpHeadOfficeNode[], officeId: number | null) =>
    officeId !== null
        ? bpTree
            .find((office) => office.id === officeId)
            ?.franchises.map((franchise) => ({ value: String(franchise.id), label: franchise.name })) ?? []
        : bpTree.flatMap((office) =>
            office.franchises.map((franchise) => ({ value: String(franchise.id), label: franchise.name }))
        )

export default function HeadOfficeFranchiseStoreSelect({
    isHeadOfficeRequired = true,
    showHeadOfficeError = false,
    headOfficeErrorMessage = '필수 입력 항목입니다.',
    isFranchiseRequired = false,
    isStoreRequired = false,
    showStoreError = false,
    officeId,
    franchiseId,
    storeId,
    fields,
    onChange,
    isDisabled = false,
    autoSelect = true,
    onMultiOffice,
    onAutoSelect,
}: HeadOfficeFranchiseStoreSelectProps) {
    const { accessToken, affiliationId, ownerCode } = useAuthStore()
    const isReady = Boolean(accessToken && affiliationId)
    const visibleFields: OfficeFranchiseStoreField[] = fields ?? ['office', 'franchise', 'store']
    const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree(isReady)

    // onChange를 ref로 감싸서 useEffect 의존성에서 제외 (불필요한 effect 재실행 방지)
    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    const onAutoSelectRef = useRef(onAutoSelect)
    useEffect(() => { onAutoSelectRef.current = onAutoSelect }, [onAutoSelect])

    // --- 고정(readOnly) vs 자동 선택(값만 채움) 분리 ---
    // 고정: ownerCode가 명확한 경우에만. 드롭다운 비활성화 + 초기화해도 복원.
    // 자동 선택: 고정 대상 + ownerCode 없이 bpTree가 1개인 경우. 값만 채우고 변경 가능.
    const isOfficeFixed = autoSelect
        && (ownerCode === OWNER_CODE.HEAD_OFFICE || ownerCode === OWNER_CODE.FRANCHISE)
    const isFranchiseFixed = autoSelect && ownerCode === OWNER_CODE.FRANCHISE

    // 자동 선택 대상: 고정 대상 포함 + ownerCode 없을 때 bpTree 단일 본사
    const shouldAutoSelectOffice = isOfficeFixed || (autoSelect && !ownerCode && bpTree.length === 1)

    // 다중 본사 여부를 상위 컴포넌트에 알림
    const onMultiOfficeRef = useRef(onMultiOffice)
    useEffect(() => { onMultiOfficeRef.current = onMultiOffice }, [onMultiOffice])
    const bpCount = bpTree.length
    useEffect(() => {
        if (bpLoading || bpCount === 0) return
        onMultiOfficeRef.current?.(bpCount > 1)
    }, [bpLoading, bpCount])

    // 본사/가맹점 자동 선택 (값 채우기)
    // - 본사(PRGRP_002_001): 본사 값 설정 + 고정(readOnly)
    // - 가맹점(PRGRP_002_002): 본사+가맹점 값 설정 + 고정(readOnly)
    // - ownerCode 없음 + 본사 1개: 본사 값만 설정 (고정 안 함, 변경 가능)
    useEffect(() => {
        if (!autoSelect || bpLoading || bpTree.length === 0) return

        if (shouldAutoSelectOffice) {
            const office = bpTree[0]

            // officeId가 null/undefined이면 항상 업데이트 (초기 진입 시 자동 조회 보장)
            const officeNeedsUpdate = officeId == null || officeId !== office.id
            // 가맹점 고정(가맹점 계정)일 때만 자동 선택/복원
            const autoFranchiseId = isFranchiseFixed && office.franchises.length === 1
                ? office.franchises[0].id
                : null
            const franchiseNeedsUpdate = isFranchiseFixed
                && autoFranchiseId !== null
                && franchiseId !== autoFranchiseId

            if (officeNeedsUpdate || franchiseNeedsUpdate) {
                const value: OfficeFranchiseStoreValue = {
                    head_office: office.id,
                    franchise: autoFranchiseId ?? franchiseId ?? null,
                    store: null,
                }
                onChangeRef.current(value)
                onAutoSelectRef.current?.(value)
            }
        }
    }, [autoSelect, bpLoading, bpTree, officeId, franchiseId, shouldAutoSelectOffice, isFranchiseFixed])

    // 본사/가맹점 옵션은 BP 트리에서 파생
    const officeOptions = useMemo(() => buildOfficeOptions(bpTree), [bpTree])
    const franchiseOptions = useMemo(() => buildFranchiseOptions(bpTree, officeId), [bpTree, officeId])
    const { data: storeOptionList = [], isPending: storeLoading } = useStoreOptions(
        officeId,
        franchiseId,
        isReady
    )
    // 점포 옵션은 API 결과를 select에 맞게 변환
    const storeOptions = useMemo(
        () => storeOptionList.map((option) => ({ value: String(option.id), label: option.storeName })),
        [storeOptionList]
    )

    return (
        <>
            {visibleFields.includes('office') && (
                <>
                    <th>본사 {isHeadOfficeRequired && <span className="red">*</span>}</th>
                    <td>
                        <div className="data-filed">
                            <SearchSelect
                                value={
                                    isOfficeFixed
                                        ? officeOptions.find((opt) => opt.value === String(bpTree[0]?.id)) || null
                                        : officeId !== null ? officeOptions.find((opt) => opt.value === String(officeId)) || null : null
                                }
                                options={officeOptions}
                                placeholder="전체"
                                isDisabled={isDisabled || bpLoading || isOfficeFixed}
                                isSearchable={true}
                                isClearable={true}
                                onChange={(option) => {
                                    // 본사 변경 → 새 본사의 가맹점 목록에 기존 가맹점이 없으면 가맹점 초기화
                                    // 점포는 본사 변경 시 항상 초기화
                                    const nextOfficeId = option ? Number(option.value) : null
                                    const nextFranchiseOptions = nextOfficeId !== null
                                        ? bpTree.find((office) => office.id === nextOfficeId)?.franchises ?? []
                                        : bpTree.flatMap((office) => office.franchises)
                                    const shouldClearFranchise =
                                        franchiseId !== null &&
                                        !nextFranchiseOptions.some((franchise) => franchise.id === franchiseId)

                                    onChange({
                                        head_office: nextOfficeId,
                                        franchise: shouldClearFranchise ? null : franchiseId ?? null,
                                        store: null,
                                    })
                                }}
                            />
                            {isHeadOfficeRequired && showHeadOfficeError && !officeId && (
                                <span className="warning-txt">※ {headOfficeErrorMessage}</span>
                            )}
                        </div>
                    </td>
                </>
            )}
            {visibleFields.includes('franchise') && (
                <>
                    <th>가맹점 {isFranchiseRequired && <span className="red">*</span>}</th>
                    <td>
                        <div className="data-filed">
                            <SearchSelect
                                value={
                                    isFranchiseFixed
                                        ? franchiseOptions.find((opt) => opt.value === String(bpTree[0]?.franchises[0]?.id)) || null
                                        : franchiseId !== null ? franchiseOptions.find((opt) => opt.value === String(franchiseId)) || null : null
                                }
                                options={franchiseOptions}
                                placeholder="전체"
                                isDisabled={isDisabled || bpLoading || isFranchiseFixed}
                                isSearchable={true}
                                isClearable={true}
                                onChange={(option) => {
                                    // 가맹점 변경 → 점포 초기화, 본사는 유지
                                    const nextFranchiseId = option ? Number(option.value) : null
                                    onChange({
                                        head_office: officeId,
                                        franchise: nextFranchiseId,
                                        store: null,
                                    })
                                }}
                            />
                        </div>
                    </td>
                </>
            )}
            {visibleFields.includes('store') && (
                <>
                    <th>점포 {isStoreRequired && <span className="red">*</span>}</th>
                    <td>
                        <div className="data-filed">
                            <SearchSelect
                                value={storeId !== null ? storeOptions.find((opt) => opt.value === String(storeId)) || null : null}
                                options={storeOptions}
                                placeholder="전체"
                                isDisabled={isDisabled || storeLoading}
                                isSearchable={true}
                                isClearable={true}
                                onChange={(option) => {
                                    // 점포 변경 → 본사/가맹점 유지
                                    const nextStoreId = option ? Number(option.value) : null
                                    onChange({
                                        head_office: officeId,
                                        franchise: franchiseId,
                                        store: nextStoreId,
                                    })
                                }}
                            />
                            {showStoreError && !storeId && (
                                <span className="warning-txt">※ 필수 입력 항목입니다.</span>
                            )}
                        </div>
                    </td>
                </>
            )}
        </>
    )
}
