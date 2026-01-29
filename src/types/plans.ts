// 요금제 목록 조회 응답 
export interface PlansListItem {
    planId: number
    planTypeId: number
    planTypeCode: string
    planTypeName: string
    storeLimit: number
    employeeLimit: number
    featureCount: number
    updatedBy: number
    updatedAt: string
    updater: string
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