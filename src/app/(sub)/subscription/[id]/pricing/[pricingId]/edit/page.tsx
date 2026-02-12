import PlanPricingEdit from '@/components/subscription/detail/PlanPricingEdit'

interface PageProps {
    params: Promise<{ id: string; pricingId: string }>
    searchParams: Promise<{ planTypeName?: string }>
}

export default async function PlanPricingEditPage({ params, searchParams }: PageProps) {
    const { id, pricingId } = await params
    const { planTypeName } = await searchParams
    const planTypeId = Number(id)
    const pricingIdNum = Number(pricingId)

    if (isNaN(planTypeId) || planTypeId <= 0 || isNaN(pricingIdNum) || pricingIdNum <= 0) {
        return (
            <div className="data-wrap">
                <div className="error-wrap">
                    <div className="form-helper error">잘못된 요청입니다.</div>
                </div>
            </div>
        )
    }

    return (
        <PlanPricingEdit
            planTypeId={planTypeId}
            pricingId={pricingIdNum}
            planTypeName={planTypeName}
        />
    )
}
