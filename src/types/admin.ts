// 관리자 검색 파라미터
export interface AdminSearchParams {
  admin_id?: number
  user_type?: string // 'MSTWK_001' | 'MSTWK_002'
  authority_id?: number
  start_date?: string // yyyy-MM-dd
  end_date?: string // yyyy-MM-dd
  page?: number
  size?: number
}

// 관리자 폼 데이터
export interface AdminFormData {
  name: string
  userType: string
  department: string
  rank: string
  mobilePhone: string
  officePhone: string
  extensionNumber: string
  loginId: string
  password: string
  authorityId: number | null
  email: string
  inquiryResponderName: string
}
