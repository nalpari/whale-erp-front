'use client'

import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import PlanPricingList from './PlanPricingList'
import { usePlanDetail } from '@/hooks/queries'
import { useState } from 'react'
import AnimateHeight from 'react-animate-height'

const BREADCRUMBS = ['과금관리', 'ERP 요금제 관리', 'ERP요금제 정보 관리']

interface PlanDetailProps {
    planTypeId: number
}

export default function PlanDetail({ planTypeId }: PlanDetailProps) {
    const router = useRouter()
    const { data: plan, isPending, error } = usePlanDetail(planTypeId)
    const [slideboxOpen, setSlideboxOpen] = useState(true)


    const onUpdateHeader = () => {
        router.push(`/subscription/${planTypeId}/header`)
    }

    if (isPending) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 정보 관리" list={BREADCRUMBS} />
                <div className="loading-wrap">로딩 중...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 정보 관리" list={BREADCRUMBS} />
                <div className="error-wrap">
                    <div className="form-helper error">오류가 발생했습니다: {error.message}</div>
                </div>
            </div>
        )
    }

    if (!plan) {
        return (
            <div className="data-wrap">
                <Location title="ERP요금제 정보 관리" list={BREADCRUMBS} />
                <div className="empty-wrap">
                    <div className="empty-data">요금제를 찾을 수 없습니다.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="data-wrap">
            <Location title="ERP요금제 정보 관리" list={BREADCRUMBS} />
            <div className="contents-wrap">
                <div className="contents-body">
                    <div className="content-wrap">
                        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
                            <div className="slidebox-header">
                                <h2>Header</h2>
                                <div className="slidebox-btn-wrap">
                                    <button className="slidebox-btn" onClick={onUpdateHeader}>수정</button>
                                    <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                                        <i className="arr-icon"></i>
                                    </button>
                                </div>
                            </div>

                            <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
                                <div className="slidebox-body">
                                    <table className="default-table">
                                        <colgroup>
                                            <col width="190px" />
                                            <col />
                                        </colgroup>
                                        <tbody>
                                            <tr>
                                                <th>요금제</th>
                                                <td>{plan.planTypeName}</td>
                                            </tr>
                                            <tr>
                                                <th>점포</th>
                                                <td>
                                                    {plan.planId ? (plan.storeLimit === null ? '제한없음' : plan.storeLimit) : ''}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>직원</th>
                                                <td>
                                                    {plan.planId ? (plan.employeeLimit === null ? '제한없음' : plan.employeeLimit) : ''}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th>포함 기능</th>
                                                <td>
                                                    {plan.features
                                                        .filter((feature) => feature.enabled)
                                                        .map((feature) => feature.featureName)
                                                        .join(' | ')}
                                                </td>
                                            </tr>

                                        </tbody>
                                    </table>
                                </div>
                            </AnimateHeight>
                        </div>
                    </div>
                    <div className="content-wrap">
                        <PlanPricingList
                            planId={plan.planId}
                            planTypeId={planTypeId}
                            planTypeName={plan.planTypeName}
                            pricingList={plan.pricings}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
