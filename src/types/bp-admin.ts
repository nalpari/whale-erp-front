export type AdminType = 'HEAD_OFFICE' | 'FRANCHISE'

export interface BpAdminSearchParams {
  admin_id?: number
  admin_type?: AdminType
  head_office_organization_id?: number
  franchise_organization_id?: number
  authority_id?: number
  user_type?: string
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
