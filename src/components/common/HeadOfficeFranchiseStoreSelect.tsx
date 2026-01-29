/**
 * HeadOfficeFranchiseStoreSelect
 *
 * 용도:
 * - 본사/가맹점/점포 선택 UI를 공통 컴포넌트로 제공.
 * - 검색어 입력 기반의 드롭다운으로 대량 옵션에서도 빠르게 필터링 가능.
 *
 * 주요 기능:
 * - 본사/가맹점/점포 옵션을 API 훅(useBp, useStoreOptions)으로 불러와 표시.
 * - 상위 선택이 변경되면 하위 선택값을 자동 초기화/보정.
 * - 드롭다운 입력값으로 옵션 목록을 필터링.
 * - "전체" 선택을 제공하며, 선택값은 { head_office, franchise, store } 형태로 반환.
 *
 * 사용 방법:
 * - officeId/franchiseId/storeId와 onChange 콜백을 전달.
 * - fields로 본사/가맹점/점포 표시 조합을 제어.
 * - isHeadOfficeRequired/showHeadOfficeError로 본사 필수/에러 표시 제어.
 * - onChange는 선택된 값(또는 null)을 받아 상위 상태를 갱신.
 *
 * 예시:
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
 *   fields={['office', 'franchise', 'store']}
 *   officeId={filters.officeId ?? null}
 *   franchiseId={filters.franchiseId ?? null}
 *   storeId={filters.storeId ?? null}
 *   onChange={(next) =>
 *     setFilters({
 *       officeId: next.head_office,
 *       franchiseId: next.franchise,
 *       storeId: next.store,
 *     })
 *   }
 * />
 * 
 * 사용 예시: src/components/store/manage/StoreSearch.tsx
 */
'use client'

import { useMemo } from 'react'
import { useBp } from '@/hooks/useBp'
import { useStoreOptions } from '@/hooks/queries'
import { useAuthStore } from '@/stores/auth-store'
import type { BpHeadOfficeNode } from '@/types/bp'
import SearchableSelect, { type SearchableSelectOption } from '@/components/common/SearchableSelect'

export type SelectOption = SearchableSelectOption<number>

export type OfficeFranchiseStoreValue = {
    head_office: number | null // 본사 선택 값(id)
    franchise: number | null // 가맹점 선택 값(id)
    store: number | null // 점포 선택 값(id)
}

type OfficeFranchiseStoreField = 'office' | 'franchise' | 'store'

type HeadOfficeFranchiseStoreSelectProps = {
    isHeadOfficeRequired?: boolean
    showHeadOfficeError?: boolean
    showStoreError?: boolean
    officeId: number | null // 본사 선택 값(id)
    franchiseId: number | null // 가맹점 선택 값(id)
    storeId: number | null // 점포 선택 값(id)
    fields?: OfficeFranchiseStoreField[] // 표시할 필드 조합
    onChange: (value: OfficeFranchiseStoreValue) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
}

const buildOfficeOptions = (bpTree: BpHeadOfficeNode[]) =>
    bpTree.map((office) => ({ value: office.id, label: office.name }))

const buildFranchiseOptions = (bpTree: BpHeadOfficeNode[], officeId: number | null) =>
    officeId
        ? bpTree
            .find((office) => office.id === officeId)
            ?.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name })) ?? []
        : bpTree.flatMap((office) =>
            office.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name }))
        )

export default function HeadOfficeFranchiseStoreSelect({
    isHeadOfficeRequired = true,
    showHeadOfficeError = false,
    showStoreError = false,
    officeId,
    franchiseId,
    storeId,
    fields,
    onChange,
}: HeadOfficeFranchiseStoreSelectProps) {
    const { accessToken, affiliationId } = useAuthStore()
    const isReady = Boolean(accessToken && affiliationId)
    const visibleFields: OfficeFranchiseStoreField[] = fields ?? ['office', 'franchise', 'store']
    const { data: bpTree, loading: bpLoading } = useBp(isReady)
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
        () => storeOptionList.map((option) => ({ value: option.id, label: option.storeName })),
        [storeOptionList]
    )

    return (
        <>
            {visibleFields.includes('office') && (
                <>
                    <th>본사 {isHeadOfficeRequired ? '*' : ''}</th>
                    <td>
                        <div className="data-filed">
                            <SearchableSelect
                                value={officeId}
                                options={officeOptions}
                                placeholder="전체"
                                disabled={bpLoading}
                                onChange={(nextOfficeId) => {
                                    const nextFranchiseOptions = nextOfficeId
                                        ? bpTree.find((office) => office.id === nextOfficeId)?.franchises ?? []
                                        : bpTree.flatMap((office) => office.franchises)
                                    const shouldClearFranchise =
                                        franchiseId !== null &&
                                        franchiseId !== undefined &&
                                        !nextFranchiseOptions.some((franchise) => franchise.id === franchiseId)

                                    onChange({
                                        head_office: nextOfficeId,
                                        franchise: shouldClearFranchise ? null : franchiseId ?? null,
                                        store: null,
                                    })
                                }}
                            />
                            {isHeadOfficeRequired && showHeadOfficeError && !officeId && (
                                <span className="form-helper error">※ 필수 입력 항목입니다.</span>
                            )}
                        </div>
                    </td>
                </>
            )}
            {visibleFields.includes('franchise') && (
                <>
                    <th>가맹점</th>
                    <td>
                        <div className="data-filed">
                            <SearchableSelect
                                value={franchiseId}
                                options={franchiseOptions}
                                placeholder="전체"
                                disabled={bpLoading}
                                onChange={(nextFranchiseId) =>
                                    onChange({
                                        head_office: officeId,
                                        franchise: nextFranchiseId,
                                        store: null,
                                    })
                                }
                            />
                        </div>
                    </td>
                </>
            )}
            {visibleFields.includes('store') && (
                <>
                    <th>점포</th>
                    <td>
                        <div className="data-filed">
                            <SearchableSelect
                                value={storeId}
                                options={storeOptions}
                                placeholder="전체"
                                disabled={storeLoading}
                                onChange={(nextStoreId) =>
                                    onChange({
                                        head_office: officeId,
                                        franchise: franchiseId,
                                        store: nextStoreId,
                                    })
                                }
                            />
                            {showStoreError && !storeId && (
                                <span className="form-helper error">※ 필수 입력 항목입니다.</span>
                            )}
                        </div>
                    </td>
                </>
            )}
        </>
    )
}
