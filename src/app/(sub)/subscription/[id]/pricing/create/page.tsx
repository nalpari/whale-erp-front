'use client'

import { use } from 'react'
import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'
import { usePlanDetail } from '@/hooks/queries/use-plans-queries'

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ planTypeName?: string }>
}

export default function PlanPricingCreatePage({ params, searchParams }: PageProps) {
    const { id } = use(params)
    const { planTypeName } = use(searchParams)
    const planTypeId = Number(id)

    const { data: plan, isPending, isError } = usePlanDetail(planTypeId)

    if (isNaN(planTypeId) || planTypeId <= 0) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">잘못된 요금제 ID입니다.</div>
                </div>
            </div>
        )
    }

    if (isPending) {
        return (
            <div className="data-wrap">
                <div className="loading-wrap">로딩 중...</div>
            </div>
        )
    }

    if (isError || !plan) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">요금제 정보를 불러올 수 없습니다.</div>
                </div>
            </div>
        )
    }

    return (
        <PlanPricingForm
            planId={plan.planId}
            planTypeId={planTypeId}
            planTypeName={planTypeName ?? plan.planTypeName}
            mode="create"
        />
    )
}
