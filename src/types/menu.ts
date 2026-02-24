export interface CategoryResponse {
  id: number
  bpId: number
  companyName: string
  categoryCode: string
  categoryName: string
  depth: number
  parentCategoryId: number | null
  isFixed: boolean
  isActive: boolean
  isDeleted: boolean
  sortOrder: number
  createdBy: number | null
  updatedBy: number | null
  createdAt: string | null
  updatedAt: string | null
  children: CategoryResponse[] | null
}
