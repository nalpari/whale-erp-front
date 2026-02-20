'use client'

import AnimateHeight from 'react-animate-height'
import { useState } from 'react'
import { useCommonCodeHierarchy } from '@/hooks/queries'

// 요금제 검색 필터 상태
export interface PlanSearchFilters {
    planType?: string | null
    updater?: string | null
}

interface PlanSearchProps {
    filters: PlanSearchFilters
    resultCount: number
    onChange?: (filters: PlanSearchFilters) => void
    onSearch?: () => void
    onReset?: () => void
}

function StatusSelector({ value, onChange }: {
    value: string
    onChange: (value: string) => void
}) {
    const { data, isPending, error } = useCommonCodeHierarchy('PLNTYP')

    if (isPending) return <div>로딩 중...</div>
    if (error) return <div>에러: {error.message}</div>

    return (
        <select className="select-form" value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="">전체</option>
            {data?.map(code => (
                <option key={code.id} value={code.code}>{code.name}</option>
            ))}
        </select>
    )
}

export default function PlanSearch({ filters, resultCount, onChange, onReset }: PlanSearchProps) {
    const [searchOpen, setSearchOpen] = useState(true)
    const [updater, setUpdater] = useState(filters.updater ?? '')
    const [planType, setPlanType] = useState(filters.planType ?? '')

    const handlePlanTypeChange = (value: string) => {
        setPlanType(value)
        const next: PlanSearchFilters = {}
        if (value.trim()) {
            next.planType = value.trim()
        }
        if (updater.trim()) {
            next.updater = updater.trim()
        }
        onChange?.(next)
    }

    const handleSearch = () => {
        const next: PlanSearchFilters = {}
        if (planType.trim()) {
            next.planType = planType.trim()
        }
        if (updater.trim()) {
            next.updater = updater.trim()
        }
        onChange?.(next)
    }

    const handleReset = () => {
        setUpdater('')
        setPlanType('')
        onReset?.()
    }

    return (
        <div className={`search-wrap ${searchOpen ? '' : 'act'}`}>
            <div className="searh-result-wrap">
                <div className="search-result">
                    검색결과 <span>{resultCount}건</span>
                </div>
                <ul className="search-result-list">
                    {/* 필요 시 검색 조건 태그 표시 */}
                    <li></li>
                </ul>
                <button className="search-filed-btn" onClick={() => setSearchOpen(!searchOpen)}></button>
            </div>
            <AnimateHeight duration={300} height={searchOpen ? 'auto' : 0}>
                <div className="search-filed">
                    <table className="default-table">
                        <colgroup>
                            <col width="120px" />
                            <col />
                            <col width="120px" />
                            <col />
                        </colgroup>
                        <tbody>
                            <tr>
                                <th>요금제명</th>
                                <td>
                                    <div className="data-filed">
                                        <StatusSelector value={planType} onChange={handlePlanTypeChange} />
                                    </div>
                                </td>
                                <th>수정자</th>
                                <td>
                                    <div className="data-filed">
                                        <input
                                            id="updater"
                                            type="text"
                                            className="input-frame"
                                            value={updater}
                                            onChange={(e) => setUpdater(e.target.value)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="btn-filed">
                        <button className="btn-form gray" onClick={() => setSearchOpen(!searchOpen)}>닫기</button>
                        <button className="btn-form gray" onClick={handleReset}>초기화</button>
                        <button className="btn-form basic" onClick={handleSearch}>검색</button>
                    </div>
                </div>
            </AnimateHeight>
        </div>
    )
}
