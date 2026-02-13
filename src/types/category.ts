export interface Category {
  id: number | null
  bpId: number
  companyName: string
  categoryCode: string | null
  categoryName: string
  depth: number // 1=대분류, 2=소분류
  parentCategoryId: number | null
  isFixed: boolean
  isActive: boolean
  isDeleted: boolean
  sortOrder: number
  createdBy: number
  updatedBy: number
  createdAt: string
  updatedAt: string
  children: Category[]
}

export interface CategorySearchParams {
  bpId?: number
  franchiseId?: number
  categoryName?: string
  depth: number // 전체/대분류=1, 소분류=2
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
}
