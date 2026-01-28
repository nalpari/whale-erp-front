'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

export type SearchableSelectValue = string | number

export type SearchableSelectOption<TValue extends SearchableSelectValue = SearchableSelectValue> = {
    value: TValue
    label: string
}

type SearchableSelectProps<TValue extends SearchableSelectValue = SearchableSelectValue> = {
    value: TValue | null
    options: SearchableSelectOption<TValue>[]
    placeholder: string
    disabled?: boolean
    includeAllOption?: boolean
    allLabel?: string
    onChange: (value: TValue | null) => void
}

export default function SearchableSelect<TValue extends SearchableSelectValue = SearchableSelectValue>({
    value,
    options,
    placeholder,
    disabled = false,
    includeAllOption = true,
    allLabel = '전체',
    onChange,
}: SearchableSelectProps<TValue>) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLDivElement | null>(null)
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [activeIndex, setActiveIndex] = useState(-1)
    const listId = useId()
    const prevActiveIndex = useRef(-1)
    const selectedLabel = useMemo(
        () => options.find((option) => option.value === value)?.label ?? '',
        [options, value]
    )

    useEffect(() => {
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

    const filteredOptions = useMemo(() => {
        const keyword = searchValue.trim().toLowerCase()
        if (!keyword) return options
        return options.filter((option) => option.label.toLowerCase().includes(keyword))
    }, [options, searchValue])

    const showAllOption = includeAllOption && !searchValue
    const listItems = useMemo(
        () => [
            ...(showAllOption ? [{ value: null, label: allLabel }] : []),
            ...filteredOptions,
        ],
        [filteredOptions, showAllOption, allLabel]
    )

    const displayValue =
        open && searchValue === '' ? selectedLabel : open ? searchValue : selectedLabel

    const selectItem = (nextValue: TValue | null) => {
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
            <div
                className={`searchable-select-input${open ? ' is-open' : ''}${
                    disabled ? ' is-disabled' : ''
                }`}
            >
                <input
                    type="text"
                    value={displayValue}
                    placeholder={placeholder}
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
