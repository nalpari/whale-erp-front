// 요금제 목록 조회 응답
export interface PlansListItem {
    planId: number
    planTypeId: number
    planTypeCode: string
    planTypeName: string
    storeLimit: number | null
    employeeLimit: number | null
    featureCount: number
    updatedBy: number
    updatedAt: Date
    updater: string
    monthlyPrice: number
    sixMonthDiscountPrice: number
    yearlyDiscountPrice: number
}

// 요금제 상세 조회 응답
export interface PlanDetailResponse {
    planId: number
    planTypeId: number
    planTypeCode: string
    planTypeName: string
    storeLimit: number | null       // null이면 제한없음
    employeeLimit: number | null    // null이면 제한없음
    features: PlanFeature[]         // 포함 기능 목록
    pricingList: PlanPricing[]      // 가격 정책 목록
    createdAt: string
    createdBy: number
    updatedAt: Date
    updatedBy: number
}

// 포함 기능
export interface PlanFeature {
    featureId: number
    featureCode: string
    featureName: string
    isIncluded: boolean
}

// 가격 정책
export interface PlanPricing {
    pricingId: number
    months: number              // 개월수 (1, 6, 12)
    originalPrice: number       // 정상가
    discountPrice: number       // 할인가
    discountRate: number        // 할인율
}
export interface PlansListResponse {
    content: PlansListItem[] // 요금제 목록 데이터
    pageNumber: number // 페이지 번호
    pageSize: number // 페이지 크기
    totalElements: number // 총 요소 수
    totalPages: number // 총 페이지 수
    isFirst: boolean // 첫 페이지 여부
    isLast: boolean // 마지막 페이지 여부
    hasNext: boolean // 다음 페이지 여부
}