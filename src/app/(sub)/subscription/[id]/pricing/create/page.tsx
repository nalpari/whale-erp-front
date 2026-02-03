import PlanPricingForm from '@/components/subscription/detail/PlanPricingForm'

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ planTypeName?: string }>
}

export default async function PlanPricingCreatePage({ params, searchParams }: PageProps) {
    const { id } = await params
    const { planTypeName } = await searchParams
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

    return <PlanPricingForm planId={planId} planTypeName={planTypeName ?? ''} mode="create" />
}
