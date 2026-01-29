export type EmployeeInfoListResponse = {
  employeeInfoId: number
  memberId: number
  rowNumber: number
  workStatus?: string | null
  workStatusName?: string | null
  headOfficeOrganizationName: string
  franchiseOrganizationName?: string | null
  storeName?: string | null
  employeeName: string
  employeeClassification?: string | null
  employeeClassificationName?: string | null
  contractClassification?: string | null
  contractClassificationName?: string | null
  hireDate: string
}
