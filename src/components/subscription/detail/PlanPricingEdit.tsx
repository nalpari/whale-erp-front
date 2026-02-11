'use client'

import { notFound } from 'next/navigation'
import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'
import { usePlanDetail } from '@/hooks/queries/use-plans-queries'

interface PlanPricingEditProps {
    planTypeId: number
    pricingId: number
    planTypeName?: string
}

export default function PlanPricingEdit({ planTypeId, pricingId, planTypeName }: PlanPricingEditProps) {
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

    const pricing = plan.pricings.find(p => p.id === pricingId)
    if (!pricing) {
        notFound()
    }

    return (
        <PlanPricingForm
            planId={plan.planId}
            planTypeId={planTypeId}
            planTypeName={planTypeName ?? plan.planTypeName}
            mode="edit"
            initialData={pricing}
            pricingId={pricingId}
        />
    )
}
