'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import './custom-css/SearchableSelect.css'

export type SearchableSelectValue = string | number

/**
 * 검색형 셀렉트 옵션 타입.
 * - value: 실제 값(숫자/문자열)
 * - label: 화면에 표시할 문구
 */
export type SearchableSelectOption<TValue extends SearchableSelectValue = SearchableSelectValue> = {
    value: TValue
    label: string
}

/**
 * 검색형 셀렉트 컴포넌트 props.
 * - value: 현재 선택된 값(null이면 미선택)
 * - options: 표시할 옵션 목록
 * - placeholder: 입력/표시용 기본 문구
 * - includeAllOption/allLabel: "전체" 옵션 노출 여부/라벨
 * - ariaLabel: 접근성 라벨(없으면 placeholder 사용)
 */
type SearchableSelectProps<TValue extends SearchableSelectValue = SearchableSelectValue> = {
    value: TValue | null
    options: SearchableSelectOption<TValue>[]
    placeholder: string
    disabled?: boolean
    includeAllOption?: boolean
    allLabel?: string
    ariaLabel?: string
    onChange: (value: TValue | null) => void
}

/**
 * 검색형 셀렉트 컴포넌트.
 * - 드롭다운 메뉴를 통해 대량의 옵션 중에서 빠르게 필터링 가능한 UI를 제공.
 * - 검색어 입력 시 실시간으로 옵션 필터링하여 검색 결과를 보여준다.
 * - 키보드 내비게이션(↑/↓/Enter/Esc)을 지원하여 빠른 선택이 가능하다.
 * - 선택된 값을 초기화하는 버튼도 제공한다.
 */
export default function SearchableSelect<TValue extends SearchableSelectValue = SearchableSelectValue>({
    value,
    options,
    placeholder,
    disabled = false,
    includeAllOption = true,
    allLabel = '전체',
    ariaLabel,
    onChange,
}: SearchableSelectProps<TValue>) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    const listId = useId()
    const prevActiveIndex = useRef(-1)
    // 현재 선택된 값에 해당하는 라벨(표시용)
    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label ?? '',
        [options, value]
    )

    useEffect(() => {
        // 바깥 클릭 시 드롭다운 닫기
        const handleClick = (event: MouseEvent) => {
            if (!containerRef.current) return
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false)
                setSearchValue('')
                setActiveIndex(-1)
            }
        }
        window.addEventListener('mousedown', handleClick)
        return () => window.removeEventListener('mousedown', handleClick)
    }, [])

    // 검색어 기준으로 옵션 필터링
    const filteredOptions = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase()
        if (!keyword) return options
        return options.filter((option) => option.label.toLowerCase().includes(keyword))
    }, [options, searchValue])

    // 검색 중이 아닐 때만 "전체" 옵션을 상단에 노출
    const showAllOption = includeAllOption && !searchValue
    const listItems = useMemo<Array<{ value: TValue | null; label: string }>>(
        () => [
            ...(showAllOption ? [{ value: null, label: allLabel }] : []),
            ...filteredOptions,
        ],
        [filteredOptions, showAllOption, allLabel]
    )

    const displayValue =
        open && searchValue === '' ? selectedLabel : open ? searchValue : selectedLabel

    // 항목 선택 시 값 적용 후 닫기
    const selectItem = (nextValue: TValue | null) => {
        onChange(nextValue)
        setOpen(false)
        setSearchValue('')
        setActiveIndex(-1)
    }

    // 키보드 내비게이션(↑/↓/Enter/Esc)
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
        // 키보드로 이동 시 활성 항목이 보이도록 스크롤 보정
        if (!open || activeIndex < 0) return
        if (prevActiveIndex.current === activeIndex) return
        prevActiveIndex.current = activeIndex
        const items = listRef.current?.querySelectorAll<HTMLButtonElement>('.searchable-select-item')
        const target = items?.[activeIndex]
        target?.scrollIntoView({ block: 'nearest' })
    }, [activeIndex, open])

    return (
        <div className="searchable-select" ref={containerRef}>
            <div
                className={`searchable-select-input${open ? ' is-open' : ''}${
                    disabled ? ' is-disabled' : ''
                }`}
            >
                <input
                    type="text"
                    // 열려있을 때는 검색어, 닫혀있을 때는 선택 라벨을 표시
                    value={displayValue}
                    placeholder={placeholder}
                    aria-label={ariaLabel ?? placeholder}
                    onFocus={() => {
                        setOpen(true)
                        if (listItems.length > 0) setActiveIndex(0)
                    }}
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
                        aria-label="선택 초기화"
                        onClick={() => {
                            setSearchValue('')
                            onChange(null)
                        }}
                    >
                        <span aria-hidden="true">×</span>
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
                            className={`searchable-select-item${
                                option.value === value ? ' is-selected' : ''
                            }${index === activeIndex ? ' is-active' : ''}`}
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
                    {filteredOptions.length === 0 && searchValue && (
                        <div className="searchable-select-empty">검색 결과가 없습니다.</div>
                    )}
                </div>
            )}
        </div>
    )
}
