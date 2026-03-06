// 검색 파라미터
export interface CustomerSearchParams {
  isOperate?: number | null  // null=전체, 1=운영, 0=탈퇴
  name?: string
  loginId?: string
  mobilePhone?: string
  socialAuthType?: string    // KAKAO | NAVER | GOOGLE
  joinDateFrom?: string      // yyyy-MM-dd
  joinDateTo?: string
  page?: number
  size?: number
}

// 목록 응답 아이템
export interface CustomerListItem {
  id: number
  isOperate: number
  name: string
  loginId: string
  mobilePhone: string | null
  socialAuthType: string | null
  joinDate: string | null
}

// 목록 응답 (페이징)
export interface CustomerListResponse {
  content: CustomerListItem[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// 상세 응답
export interface CustomerDetailResponse {
  id: number
  loginId: string
  customerCode: string
  name: string
  mobilePhone: string | null
  email: string | null
  isOperate: number
  socialAuthType: string | null
  socialAuthId: string | null
  joinDate: string | null
  lastAccessTime: string | null
  withdrawalDate: string | null
  withdrawalReason: string | null
  createdAt: string | null
  updatedAt: string | null
}

// 수정 요청
export interface PutCustomerRequest {
  name?: string
  mobilePhone?: string
  email?: string
  isOperate?: number
  socialAuthType?: string
  socialAuthId?: string
  withdrawalReason?: string
}
