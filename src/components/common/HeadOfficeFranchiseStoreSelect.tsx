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
 * ### 기본 사용 (본사/가맹점/점포 전부 표시) — StoreSearch.tsx 패턴
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
 *   officeId={filters.officeId ?? null}
 *   franchiseId={filters.franchiseId ?? null}
 *   storeId={filters.storeId ?? null}
 *   onChange={(next) => {
 *     if (next.head_office) setShowOfficeError(false)
 *     onChange({
 *       officeId: next.head_office,
 *       franchiseId: next.franchise,
 *       storeId: next.store,
 *     })
 *   }}
 * />
 * ```
 *
 * ### 본사+가맹점만 (fields 제어) — AuthoritySearch.tsx 패턴
 * ```tsx
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={false}
 *   fields={['office', 'franchise']}
 *   officeId={params.officeId ?? null}
 *   franchiseId={params.franchiseId ?? null}
 *   storeId={null}
 *   onChange={handleBpSelectChange}
 *   isDisabled={isBpDisabled}
 * />
 * ```
 *
 * ### 점포 필수 입력 — WorkScheduleSearch.tsx 패턴
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
 * />
 * ```
 *
 * ### 폼(등록/수정) 내 사용 — AuthorityForm.tsx 패턴 (비활성화 옵션 포함)
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
 * ## 계정 유형별 초기값 자동 설정
 *
 * 로그인 사용자의 bpTree(본사/가맹점 트리) 구조에 따라 초기값이 자동 결정된다.
 *
 * | 계정 유형             | bpTree 조건                                        | 본사               | 가맹점             | 점포        |
 * | --------------------- | -------------------------------------------------- | ------------------ | ------------------ | ----------- |
 * | 단일 본사 + 단일 가맹 | `bpTree.length === 1 && franchises.length === 1`   | 자동 고정(readOnly)| 자동 고정(readOnly)| 사용자 선택 |
 * | 단일 본사 + 다중 가맹 | `bpTree.length === 1 && franchises.length > 1`     | 자동 고정(readOnly)| 사용자 선택        | 사용자 선택 |
 * | 다중 본사             | `bpTree.length > 1`                                | 직접 선택 필요†    | 사용자 선택        | 사용자 선택 |
 *
 * (†) 다중 본사: 자동 선택 없음. onMultiOffice 콜백으로 상위 컴포넌트에 다중 본사 여부를 통보하며, 사용자가 직접 선택해야 한다.
 *
 * ---
 *
 * ## 컴포넌트 내부 로직
 *
 * ### 데이터 흐름
 * - `useBpHeadOfficeTree()` → 본사/가맹점 트리 로드 → `buildOfficeOptions()`, `buildFranchiseOptions()`로 옵션 빌드
 * - `useStoreOptions(officeId, franchiseId)` → 선택된 본사/가맹점에 해당하는 점포 옵션 로드
 *
 * ### 자동 선택 useEffect 로직
 * - **단일 본사**: isHeadOfficeRequired 여부와 무관하게 항상 고정. 초기화 버튼 후에도 자동 복원(readOnly).
 *   단일 가맹점이면 가맹점도 함께 고정.
 * - **다중 본사**: 자동 선택 없음. onMultiOffice(true) 콜백으로 상위 컴포넌트에 통보하여
 *   상위가 검색 패널을 열거나 오류 상태를 표시하도록 위임한다.
 *
 * ### 핵심 Ref
 * - `onChangeRef`: onChange 콜백의 안정적 참조 유지. useEffect 내에서 onChange를 호출하되
 *   의존성 배열에 넣지 않아 불필요한 effect 재실행을 방지.
 * - `onMultiOfficeRef`: onMultiOffice 콜백의 안정적 참조 유지. bpTree 로드 후 다중 본사 여부를 상위에 통보.
 *
 * ### 상위→하위 초기화 (캐스케이드)
 * - 본사 변경 시: 새 본사의 가맹점 목록에 기존 가맹점이 없으면 가맹점 초기화 + 점포 항상 초기화
 * - 가맹점 변경 시: 점포 초기화
 * - 점포 변경 시: 본사/가맹점 유지
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
    /** bpTree 로드 후 다중 본사 여부를 알려주는 콜백 */
    onMultiOffice?: (isMulti: boolean) => void
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
    onMultiOffice,
}: HeadOfficeFranchiseStoreSelectProps) {
    const { accessToken, affiliationId } = useAuthStore()
    const isReady = Boolean(accessToken && affiliationId)
    const visibleFields: OfficeFranchiseStoreField[] = fields ?? ['office', 'franchise', 'store']
    const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree(isReady)

    // onChange를 ref로 감싸서 useEffect 의존성에서 제외 (불필요한 effect 재실행 방지)
    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    // 로그인 사용자 권한에 따른 비활성화 여부 (bpTree 구조 기반 추론)
    // TODO: auth-store에 소속 조직 타입(organizationType: 'HEAD_OFFICE' | 'FRANCHISE')이
    //       저장되면 bpTree 추론 대신 조직 타입 기반으로 변경
    //       - HEAD_OFFICE: isOfficeFixed=true, isFranchiseFixed=false
    //       - FRANCHISE: isOfficeFixed=true, isFranchiseFixed=true
    const isOfficeFixed = bpTree.length === 1
    const isFranchiseFixed = isOfficeFixed && bpTree[0]?.franchises.length === 1

    // 다중 본사 여부를 상위 컴포넌트에 알림
    const onMultiOfficeRef = useRef(onMultiOffice)
    useEffect(() => { onMultiOfficeRef.current = onMultiOffice }, [onMultiOffice])
    const bpCount = bpTree.length
    useEffect(() => {
        if (bpLoading || bpCount === 0) return
        onMultiOfficeRef.current?.(bpCount > 1)
    }, [bpLoading, bpCount])

    // 본사/가맹점 자동 선택 및 고정 로직
    // - 단일 본사(사용자 소속): 항상 고정, 초기화해도 값 유지
    // - 다중 본사: 자동 선택 없음 (사용자가 직접 선택)
    useEffect(() => {
        if (bpLoading || bpTree.length === 0) return

        if (bpTree.length === 1) {
            // 단일 본사: 로그인 사용자의 소속 조직 → isHeadOfficeRequired와 무관하게 항상 고정
            const office = bpTree[0]
            const autoFranchiseId = office.franchises.length === 1 ? office.franchises[0].id : null

            // 초기화 버튼 후에도 고정값 자동 복원 (readOnly)
            const needsUpdate =
                officeId !== office.id ||
                (autoFranchiseId !== null && franchiseId !== autoFranchiseId)

            if (needsUpdate) {
                onChangeRef.current({
                    head_office: office.id,
                    franchise: autoFranchiseId,
                    store: null,
                })
            }
        }
    }, [bpLoading, bpTree, officeId, franchiseId])

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
