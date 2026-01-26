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
 * - isHeadOfficeRequired/showHeadOfficeError로 본사 필수/에러 표시 제어.
 * - onChange는 선택된 값(또는 null)을 받아 상위 상태를 갱신.
 *
 * 예시:
 * <HeadOfficeFranchiseStoreSelect
 *   isHeadOfficeRequired={true}
 *   showHeadOfficeError={showOfficeError}
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

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useBp } from '@/hooks/useBp'
import { useStoreOptions } from '@/hooks/store/useStore'
import { useAuthStore } from '@/stores/auth-store'
import type { BpHeadOfficeNode } from '@/types/bp'

export interface SelectOption {
    value: number // 옵션 값(id)
    label: string // 옵션 라벨 (name)
}

export type OfficeFranchiseStoreValue = {
    head_office: number | null // 본사 선택 값(id)
    franchise: number | null // 가맹점 선택 값(id)
    store: number | null // 점포 선택 값(id)
}

type HeadOfficeFranchiseStoreSelectProps = {
    isHeadOfficeRequired?: boolean
    showHeadOfficeError?: boolean
    officeId: number | null // 본사 선택 값(id)
    franchiseId: number | null // 가맹점 선택 값(id)
    storeId: number | null // 점포 선택 값(id)
    onChange: (value: OfficeFranchiseStoreValue) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
}

type SearchableSelectProps = {
    value: number | null // 선택된 값(id)
    options: SelectOption[] // 옵션 목록
    placeholder: string // 플레이스홀더 텍스트
    disabled?: boolean // 비활성화 여부
    onChange: (value: number | null) => void // 선택된 값(또는 null)을 받아 상위 상태를 갱신
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

function SearchableSelect({
    value,
    options,
    placeholder,
    disabled = false,
    onChange,
}: SearchableSelectProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    const listId = useId()
    const prevActiveIndex = useRef(-1)
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
                setActiveIndex(-1)
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

    const showAllOption = !searchValue
    const listItems = useMemo(
        () => [
            ...(showAllOption ? [{ value: null, label: '전체' }] : []),
            ...filteredOptions,
        ],
        [filteredOptions, showAllOption]
    )

    const displayValue =
        open && searchValue === '' ? selectedLabel : open ? searchValue : selectedLabel

    const selectItem = (nextValue: number | null) => {
        onChange(nextValue)
        setOpen(false)
        setSearchValue('')
        setActiveIndex(-1)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return
        if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            setOpen(true)
            setActiveIndex(0)
            return
        }
        if (!open) return
        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setActiveIndex((prev) => Math.min(prev + 1, listItems.length - 1))
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActiveIndex((prev) => Math.max(prev - 1, 0))
        }
        if (event.key === 'Enter') {
            event.preventDefault()
            const current = listItems[activeIndex]
            if (current) {
                selectItem(current.value)
            }
        }
        if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
            setSearchValue('')
            setActiveIndex(-1)
        }
    }

    useEffect(() => {
        if (!open || activeIndex < 0) return
        if (prevActiveIndex.current === activeIndex) return
        prevActiveIndex.current = activeIndex
        const items = listRef.current?.querySelectorAll<HTMLButtonElement>('.searchable-select-item')
        const target = items?.[activeIndex]
        target?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex, open])

    return (
        <div className="searchable-select" ref={containerRef}>
            <div className={`searchable-select-input${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}>
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
                    onFocus={() => { setOpen(true); if (listItems.length > 0) setActiveIndex(0) }}
                    onChange={(event) => {
                        if (disabled) return
                        setOpen(true)
                        setSearchValue(event.target.value)
                        setActiveIndex(0)
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    role="combobox"
                    aria-expanded={open}
                    aria-controls={`searchable-select-list-${listId}`}
                    aria-autocomplete="list"
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
                        x
                    </button>
                )}
                <button
                    type="button"
                    className="searchable-select-toggle"
                    onClick={() => {
                        if (disabled) return
                        setOpen((prev) => {
                            const next = !prev
                            if (next && listItems.length > 0) setActiveIndex(0)
                            if (!next) {
                                setSearchValue('')
                                setActiveIndex(-1)
                            }
                            return next
                        })
                    }}
                    aria-label="toggle"
                >
                    v
                </button>
            </div>
            {open && !disabled && (
                <div
                    className="searchable-select-list"
                    role="listbox"
                    id={`searchable-select-list-${listId}`}
                    ref={listRef}
                >
                    {listItems.map((option, index) => (
                        <button
                            key={option.value ?? 'all'}
                            type="button"
                            className={`searchable-select-item${option.value === value ? ' is-selected' : ''}${
                                index === activeIndex ? ' is-active' : ''
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                selectItem(option.value)
                            }}
                            role="option"
                            aria-selected={option.value === value}
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
    isHeadOfficeRequired = true,
    showHeadOfficeError = false,
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
