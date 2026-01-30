'use client'

import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import PlanHeader from './PlanHeader'
import PlanPricingList from './PlanPricingList'
import { usePlanDetail } from '@/hooks/queries'
import { PlanDetailResponse } from '@/types/plans'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', '요금제 상세']

interface PlanDetailProps {
    planId: number
}

export default function PlanDetail({ planId }: PlanDetailProps) {
    const router = useRouter()
    const { data: plan, isPending, error } = usePlanDetail(planId)

    const handleCancel = () => {
        router.push('/subscription')
    }

    const handleSave = (data: Partial<PlanDetailResponse>) => {
        console.log('Save plan:', data)
        // TODO: 저장 API 연동
    }

    if (isPending) {
        return (
            <div className="data-wrap">
                <Location title="요금제 상세" list={BREADCRUMBS} />
                <div className="loading-wrap">로딩 중...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="data-wrap">
                <Location title="요금제 상세" list={BREADCRUMBS} />
                <div className="error-wrap">
                    <div className="form-helper error">오류가 발생했습니다: {error.message}</div>
                </div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="data-wrap">
                <Location title="요금제 상세" list={BREADCRUMBS} />
                <div className="empty-wrap">
                    <div className="empty-data">요금제를 찾을 수 없습니다.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="data-wrap">
            <Location title="요금제 상세" list={BREADCRUMBS} />
            <div className="contents-wrap">
                <div className="contents-body">
                    <div className="content-wrap">
                        <PlanHeader
                            plan={plan}
                            onCancel={handleCancel}
                            onSave={handleSave}
                        />
                    </div>
                    <div className="content-wrap">
                        <PlanPricingList pricingList={plan.pricingList} />
                    </div>
                </div>
            </div>
        </div>
    )
}
