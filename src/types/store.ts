export type OperationStatusCode = string

export interface StoreListItem {
  id: number
  operationStatus: OperationStatusCode
  officeName: string
  franchiseName: string
  storeName: string
  createdAt: string
}

export interface StoreListResponse {
  content: StoreListItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isFirst: boolean
  isLast: boolean
  hasNext: boolean
}

export interface StoreOption {
  id: number
  storeName: string
}

export interface StoreFileInfo {
  id: number
  originalFileName: string
  uploadFileCategory: string
}

export interface OperatingHourInfo {
  dayType: 'WEEKDAY' | 'SATURDAY' | 'SUNDAY'
  isOperating: boolean
  openTime: string | null
  closeTime: string | null
  breakTimeEnabled?: boolean
  breakStartTime: string | null
  breakEndTime: string | null
}

export interface StoreInfoDetail {
  id: number
  storeOwner?: string
  officeId?: number
  officeName?: string
  franchiseId?: number
  franchiseName?: string
  operationStatus: OperationStatusCode
  statusUpdatedDate?: string
  storeName: string
  storeCode?: string
  businessNumber?: string
  storeAddress?: string
  storeAddressDetail?: string
  ceoName?: string
  ceoPhone?: string
  storePhone?: string
}

export interface StoreDetailResponse {
  storeInfo: StoreInfoDetail
  operating: OperatingHourInfo[]
  files: StoreFileInfo[]
}

export interface StoreHeaderRequest {
  storeOwner: 'HEAD_OFFICE' | 'FRANCHISE'
  organizationId: number
  operationStatus: OperationStatusCode
  storeName: string
  businessNumber: string
  storeAddress: string
  storeAddressDetail?: string | null
  ceoName: string
  ceoPhone: string
  storePhone?: string | null
  operatingHours: OperatingHourInfo[]
}
