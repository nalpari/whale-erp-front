import PlanHeader from '@/components/subscription/detail/PlanHeader'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function PlanHeaderPage({ params }: PageProps) {
    const { id } = await params
    const planTypeId = Number(id)

    if (isNaN(planTypeId) || planTypeId <= 0) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">잘못된 요금제 ID입니다.</div>
                </div>
            </div>
        )
    }

    return <PlanHeader planTypeId={planTypeId} />
}
