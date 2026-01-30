import PlanDetail from '@/components/subscription/detail/PlanDetail'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PlanDetailPage({ params }: PageProps) {
    const { id } = await params
    const planId = Number(id)

    if (isNaN(planId) || planId <= 0) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">잘못된 요금제 ID입니다.</div>
                </div>
            </div>
        )
    }

    return <PlanDetail planId={planId} />
}
