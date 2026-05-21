export type AdminType = 'HEAD_OFFICE' | 'FRANCHISE'

export interface BpAdminSearchParams {
  name?: string
  login_id?: string
  user_type?: string
  organization_type?: AdminType
  organization_id?: number
  authority_id?: number
  start_date?: string
  end_date?: string
  page?: number
  size?: number
}

export interface BpAdminFormData {
  adminType: AdminType
  headOfficeOrganizationId: number | null
  franchiseOrganizationId: number | null
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
}
