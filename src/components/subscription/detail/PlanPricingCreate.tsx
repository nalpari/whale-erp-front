'use client'

import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'
import { usePlanDetail } from '@/hooks/queries/use-plans-queries'

interface PlanPricingCreateProps {
    planTypeId: number
    planTypeName?: string
}

export default function PlanPricingCreate({ planTypeId, planTypeName }: PlanPricingCreateProps) {
    const { data: plan, isPending, isError } = usePlanDetail(planTypeId)

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
