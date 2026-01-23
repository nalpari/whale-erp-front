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
 * - 드롭다운 입력값으로 옵션 목록을 필터링(2, 2-1 요구사항).
 * - "전체" 선택을 제공하며, 선택값은 { head_office, franchise, store } 형태로 반환.
 *
 * 사용 방법:
 * - officeId/franchiseId/storeId와 onChange 콜백을 전달.
 * - onChange는 선택된 값(또는 null)을 받아 상위 상태를 갱신.
 *
 * 예시:
 * <HeadOfficeFranchiseStoreSelect
 *   officeId={filters.officeId ?? null} // 본사 선택
 *   franchiseId={filters.franchiseId ?? null} // 가맹점 선택
 *   storeId={filters.storeId ?? null} // 점포 선택
 *   onChange={(next) =>
 *     setFilters({ // 상위 상태 갱신
 *       officeId: next.head_office, // 본사 선택
 *       franchiseId: next.franchise, // 가맹점 선택
 *       storeId: next.store, // 점포 선택
 *     })
 *   } // 선택된 값(또는 null)을 받아 상위 상태를 갱신
 * />
 */
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useBp } from '@/hooks/useBp'
import { useStoreOptions } from '@/hooks/store/useStore'
import { useAuthStore } from '@/stores/auth-store'
import type { BpHeadOfficeNode } from '@/types/bp'

// 옵션 타입
export interface SelectOption {
    value: number // 옵션 값 (id)
    label: string // 옵션 라벨 (name)
}

// 선택된 값 타입
export type OfficeFranchiseStoreValue = {
    head_office: number | null // 본사 선택 값 (id)
    franchise: number | null // 가맹점 선택 값 (id)
    store: number | null // 점포 선택 값 (id)   
}

// 컴포넌트 프로퍼티 타입
type HeadOfficeFranchiseStoreSelectProps = {
    officeId: number | null // 본사 선택 값 (id)
    franchiseId: number | null // 가맹점 선택 값 (id)
    storeId: number | null // 점포 선택 값 (id)
    onChange: (value: OfficeFranchiseStoreValue) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
}

// 검색 가능한 선택 컴포넌트 프로퍼티 타입
type SearchableSelectProps = {
    value: number | null // 선택된 값 (id)
    options: SelectOption[] // 옵션 목록
    placeholder: string // 플레이스홀더 텍스트
    disabled?: boolean // 비활성화 여부
    onChange: (value: number | null) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
}

// 본사 목록 빌드
const buildOfficeOptions = (bpTree: BpHeadOfficeNode[]) =>
    bpTree.map((office) => ({ value: office.id, label: office.name }))

// 가맹점 목록 빌드
const buildFranchiseOptions = (bpTree: BpHeadOfficeNode[], officeId: number | null) =>
    officeId
        ? bpTree
            .find((office) => office.id === officeId)
            ?.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name })) ?? []
        : bpTree.flatMap((office) =>
            office.franchises.map((franchise) => ({ value: franchise.id, label: franchise.name }))
        )

// 검색 가능한 선택 컴포넌트
function SearchableSelect({
    value,
    options,
    placeholder,
    disabled = false,
    onChange,
}: SearchableSelectProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    // 선택된 값의 라벨 표시용 (검색어 입력 중에는 searchValue가 표시됨)
    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label ?? '',
        [options, value]
    )

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (!containerRef.current) return
            if (!containerRef.current.contains(event.target as Node)) {
                // 외부 클릭 시 닫고 검색어 초기화
                setOpen(false)
                setSearchValue('')
            }
        }
        window.addEventListener('mousedown', handleClick)
        return () => window.removeEventListener('mousedown', handleClick)
    }, [])

    const filteredOptions = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase()
        if (!keyword) return options
        // 입력 키워드 포함 옵션만 표시
        return options.filter((option) => option.label.toLowerCase().includes(keyword))
    }, [options, searchValue])

    const displayValue = open ? searchValue : selectedLabel

    return (
        <div className="searchable-select" ref={containerRef}>
            <div className={`searchable-select-input${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}>
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onChange={(event) => {
                        if (disabled) return
                        setOpen(true)
                        setSearchValue(event.target.value)
                    }}
                    disabled={disabled}
                />
                {displayValue && !disabled && (
                    <button
                        type="button"
                        className="searchable-select-clear"
                        onClick={() => {
                            setSearchValue('')
                            onChange(null)
                        }}
                    >
                        ×
                    </button>
                )}
                <button
                    type="button"
                    className="searchable-select-toggle"
                    onClick={() => {
                        if (disabled) return
                        setOpen((prev) => {
                            const next = !prev
                            if (!next) setSearchValue('')
                            return next
                        })
                    }}
                    aria-label="toggle"
                >
                    ▾
                </button>
            </div>
                {open && !disabled && (
                <div className="searchable-select-list">
                    {/* 검색어가 없을 때만 '전체' 노출 */}
                    {!searchValue && (
                        <button
                            type="button"
                            className={`searchable-select-item${value == null ? ' is-selected' : ''}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                onChange(null)
                                setOpen(false)
                                setSearchValue('')
                            }}
                        >
                            전체
                        </button>
                    )}
                    {filteredOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`searchable-select-item${option.value === value ? ' is-selected' : ''}`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                onChange(option.value)
                                setOpen(false)
                                setSearchValue('')
                            }}
                        >
                            {option.label}
                        </button>
                    ))}
                    {filteredOptions.length === 0 && (
                        <div className="searchable-select-empty">검색 결과가 없습니다.</div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function HeadOfficeFranchiseStoreSelect({
    officeId,
    franchiseId,
    storeId,
    onChange,
}: HeadOfficeFranchiseStoreSelectProps) {
    const { accessToken, affiliationId } = useAuthStore()
    const isReady = Boolean(accessToken && affiliationId)
    const { data: bpTree, loading: bpLoading } = useBp(isReady)
    // 본사/가맹점 옵션은 BP 트리에서 파생
    const officeOptions = useMemo(() => buildOfficeOptions(bpTree), [bpTree])
    const franchiseOptions = useMemo(() => buildFranchiseOptions(bpTree, officeId), [bpTree, officeId])
    const { options: storeOptionList, loading: storeLoading } = useStoreOptions(
        officeId ?? undefined,
        franchiseId ?? undefined,
        isReady
    )
    // 점포 옵션은 API 결과를 select에 맞게 변환
    const storeOptions = useMemo(
        () => storeOptionList.map((option) => ({ value: option.id, label: option.storeName })),
        [storeOptionList]
    )

    return (
        <>
            <th>본사</th>
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
                </div>
            </td>
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
                </div>
            </td>
        </>
    )
}
