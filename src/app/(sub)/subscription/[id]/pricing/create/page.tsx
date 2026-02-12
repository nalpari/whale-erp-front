import PlanPricingCreate from '@/components/subscription/detail/PlanPricingCreate'

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ planTypeName?: string }>
}

export default async function PlanPricingCreatePage({ params, searchParams }: PageProps) {
    const { id } = await params
    const { planTypeName } = await searchParams
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

    return (
        <PlanPricingCreate
            planTypeId={planTypeId}
            planTypeName={planTypeName}
        />
    )
}
