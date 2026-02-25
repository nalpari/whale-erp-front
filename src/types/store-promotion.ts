export const PROMOTION_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
} as const

export type PromotionStatus = (typeof PROMOTION_STATUS)[keyof typeof PROMOTION_STATUS]

export const PROMOTION_STATUS_LABEL: Record<PromotionStatus, string> = {
  PENDING: '대기',
  ACTIVE: '진행중',
  ENDED: '종료',
}

export const MENU_PROPERTY = {
  HEAD_OFFICE: 'MNPRP_001',
  FRANCHISE: 'MNPRP_002',
} as const

export type MenuProperty = (typeof MENU_PROPERTY)[keyof typeof MENU_PROPERTY]

export const MENU_PROPERTY_LABEL: Record<MenuProperty, string> = {
  MNPRP_001: '본사',
  MNPRP_002: '가맹점',
}

export interface StorePromotionListMenuItem {
  menuId: number
  menuName: string
}

export interface StorePromotionListItem {
  id: number
  status: string
  promotionName: string
  promotionMenus: StorePromotionListMenuItem[]
  headOfficeId: number | null
  headOfficeName: string | null
  franchiseId: number | null
  franchiseName: string | null
  storeId: number | null
  storeName: string | null
  startDate: string
  endDate: string
  createdAt: string
  createdByName: string
}

export interface StorePromotionListResponse {
  content: StorePromotionListItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

export interface StorePromotionListParams {
  headOfficeId?: number
  franchiseId?: number
  storeId?: number
  status?: string
  menuName?: string
  startDate?: string
  endDate?: string
  page: number
  size: number
}

export interface StorePromotionMenuItem {
  menuId: number
  menuName: string
  salePrice: number | null
  discountPrice: number | null
  promotionPrice: number | null
}

export interface StorePromotionMenuPayload {
  menuId: number
  promotionPrice: number | null
}

export interface StorePromotionCreateRequest {
  menuProperty: MenuProperty
  headOfficeId: number
  franchiseId?: number
  storeId?: number
  promotionName: string
  startDate: string
  endDate: string
  promotionMenus: StorePromotionMenuPayload[]
}

export type StorePromotionUpdateRequest = StorePromotionCreateRequest

export interface ApiErrorResponse {
  code?: string
  message?: string
  details?: {
    overlappingMenuIds?: number[]
  }
}

export interface StorePromotionDetailResponse {
  id: number
  headOfficeName: string | null
  headOfficeId: number | null
  franchiseId: number | null
  franchiseName: string | null
  storeId: number | null
  storeName: string | null
  promotionName: string | null
  status: string
  startDate: string | null
  endDate: string | null
  promotionMenus: StorePromotionMenuItem[]
  createdByName: string | null
  createdAt: string | null
  updatedByName: string | null
  updatedAt: string | null
}
