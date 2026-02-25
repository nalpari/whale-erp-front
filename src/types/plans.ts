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
    sixMonthDiscount: number | null
    yearlyDiscount: number | null
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
    pricings: PlanPricing[]      // 가격 정책 목록
    createdAt: string
    createdBy: number
    updatedAt: Date
    updatedBy: number
}

// 포함 기능
export interface PlanFeature {
    id: number
    featureCode: string
    featureName: string
    enabled: boolean
}

// 가격 정책
export interface PlanPricing {
    id: number
    title: string
    status: string
    period: string
    startDate: Date
    endDate: Date
    monthlyPrice: number
    sixMonthPrice: number | null
    sixMonthDiscountRate: number | null
    sixMonthDiscountPrice: number | null
    sixMonthDiscount: number | null
    yearlyPrice: number | null
    yearlyDiscountRate: number | null
    yearlyDiscountPrice: number | null
    yearlyDiscount: number | null
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

// 요금제 헤더 수정 요청
export interface UpdatePlanHeaderRequest {
    storeLimit: number | null       // 점포 수 제한 (null: 제한없음)
    employeeLimit: number | null    // 직원 수 제한 (null: 제한없음)
    features: {
        featureCode: string         // 기능 코드
        enabled: boolean            // 활성화 여부
    }[]
}

// 가격 정책 생성 요청
export interface CreatePlanPricingRequest {
    title: string                        // 필수
    startDate: string                    // 필수, 'yyyy-MM-dd'
    endDate: string                      // 필수, 'yyyy-MM-dd'
    monthlyPrice: number                 // 필수, 1개월 요금
    sixMonthPrice: number | null         // 6개월 월 요금 (비활성화 시 null)
    sixMonthDiscountRate: number | null  // 할인율 선택 시 값, 할인금액 선택 시 null
    sixMonthDiscountPrice: number | null // 할인금액 선택 시 값, 할인율 선택 시 null
    yearlyPrice: number | null           // 12개월 월 요금 (비활성화 시 null)
    yearlyDiscountRate: number | null    // 할인율 선택 시 값, 할인금액 선택 시 null
    yearlyDiscountPrice: number | null   // 할인금액 선택 시 값, 할인율 선택 시 null
}

// 가격 정책 생성 응답
export interface CreatePlanPricingResponse {
    id: number
    planId: number
    title: string
    startDate: string
    endDate: string
    monthlyPrice: number
    sixMonthPrice: number | null
    sixMonthDiscountRate: number | null
    sixMonthDiscountPrice: number | null
    yearlyPrice: number | null
    yearlyDiscountRate: number | null
    yearlyDiscountPrice: number | null
}

// 가격 정책 수정 요청 (생성 요청과 동일)
export type UpdatePlanPricingRequest = CreatePlanPricingRequest