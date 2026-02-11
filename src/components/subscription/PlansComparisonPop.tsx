'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCommonCode } from '@/hooks/useCommonCode'
import { usePlansComparison } from '@/hooks/queries'
import type { PlansListItem, PlanDetailResponse } from '@/types/plans'

interface PlansComparisonPopProps {
    isOpen: boolean
    onClose: () => void
    plans: PlansListItem[]
}

export default function PlansComparisonPop({ isOpen, onClose, plans }: PlansComparisonPopProps) {
    const router = useRouter()

    // 컬럼 헤더: 요금제 타입 공통코드
    const { children: planTypes, loading: planTypesLoading } = useCommonCode('PLNTYP', isOpen)

    // 기능 목록 행: 기능 공통코드
    const { children: planFeatures, loading: planFeaturesLoading } = useCommonCode('PLANFT', isOpen)

    // 각 요금제 상세: 병렬 조회
    const detailQueries = usePlansComparison(
        plans.map(p => p.planTypeId),
        isOpen
    )

    // planTypeCode → PlanDetailResponse 매핑
    const planDetailMap = useMemo(() => {
        const map = new Map<string, PlanDetailResponse>()
        plans.forEach((plan, idx) => {
            const detail = detailQueries[idx]?.data
            if (detail) map.set(plan.planTypeCode, detail)
        })
        return map
    }, [plans, detailQueries])

    // planTypeCode → PlansListItem 매핑
    const planListMap = useMemo(() => {
        const map = new Map<string, PlansListItem>()
        plans.forEach(plan => {
            map.set(plan.planTypeCode, plan)
        })
        return map
    }, [plans])

    const isLoading = planTypesLoading || planFeaturesLoading || detailQueries.some(q => q.isPending)

    if (!isOpen) return null

    const handleEdit = (planTypeCode: string) => {
        const plan = planListMap.get(planTypeCode)
        if (plan) {
            router.push(`/subscription/${plan.planTypeId}/header`)
            onClose()
        }
    }

    // 기능 활성화 여부 확인
    const isFeatureEnabled = (planTypeCode: string, featureCode: string): boolean => {
        const detail = planDetailMap.get(planTypeCode)
        if (!detail || !detail.planId) return false
        return detail.features.some(f => f.featureCode === featureCode && f.enabled)
    }

    // 점포/직원 제한 표시
    const formatLimit = (value: number | null | undefined): string => {
        if (value === null) return '제한없음'
        if (value === undefined) return ''
        return String(value)
    }

    return (
        <div className="modal-popup" style={{ display: 'block' }}>
            <div className="modal-dialog large">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2>ERP 요금제 기능 비교</h2>
                        <button className="modal-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <div className="pop-frame">
                            {isLoading ? (
                                <div className="loading-wrap">로딩 중...</div>
                            ) : (
                                <table className="comparison-table">
                                    <thead>
                                        <tr>
                                            <th>요금제명</th>
                                            {planTypes.map(type => (
                                                <th key={type.code}>{type.name}</th>
                                            ))}
                                        </tr>
                                        <tr>
                                            <th></th>
                                            {planTypes.map(type => (
                                                <th key={type.code}>
                                                    {planListMap.has(type.code) && (
                                                        <button
                                                            className="comparison-btn"
                                                            onClick={() => handleEdit(type.code)}
                                                        >
                                                            수정
                                                        </button>
                                                    )}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="data">
                                            <td className="al-l">점포</td>
                                            {planTypes.map(type => {
                                                const detail = planDetailMap.get(type.code)
                                                return (
                                                    <td key={type.code}>
                                                        {detail?.planId ? formatLimit(detail.storeLimit) : ''}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                        <tr className="data">
                                            <td className="al-l">직원</td>
                                            {planTypes.map(type => {
                                                const detail = planDetailMap.get(type.code)
                                                return (
                                                    <td key={type.code}>
                                                        {detail?.planId ? formatLimit(detail.employeeLimit) : ''}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                        <tr className="data">
                                            <td className="al-l">기능</td>
                                            {planTypes.map(type => {
                                                const detail = planDetailMap.get(type.code)
                                                return (
                                                    <td key={type.code}>
                                                        {detail?.planId
                                                            ? detail.features.filter(f => f.enabled).length
                                                            : ''}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                        {planFeatures.map(feature => (
                                            <tr key={feature.code}>
                                                <td className="al-l">{feature.name}</td>
                                                {planTypes.map(type => (
                                                    <td key={type.code}>
                                                        {isFeatureEnabled(type.code, feature.code) ? (
                                                            <i className="comparison-check"></i>
                                                        ) : null}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
