import type { UploadFile } from './upload-files'

export type OperationStatusCode = string // 운영여부 코드(STOPR_001: 운영, STOPR_002: 휴무)

// 점포 목록 데이터 타입
export interface StoreListItem {
  id: number // 점포 ID    
  operationStatus: OperationStatusCode // 운영여부 코드
  officeName: string // 본사명
  franchiseName: string // 가맹점명
  storeName: string // 점포명
  createdAt: string // 등록일
}

// 점포 목록 응답 타입
export interface StoreListResponse {
  content: StoreListItem[] // 점포 목록 데이터
  pageNumber: number // 페이지 번호
  pageSize: number // 페이지 크기
  totalElements: number // 총 요소 수
  totalPages: number // 총 페이지 수
  isFirst: boolean // 첫 페이지 여부
  isLast: boolean // 마지막 페이지 여부
  hasNext: boolean // 다음 페이지 여부
}

// 점포 옵션 데이터 타입
export interface StoreOption {
  id: number // 점포 ID
  storeName: string // 점포명
}

// 운영 시간 정보 데이터 타입
export interface OperatingHourInfo {
  dayType: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'WEEKDAY' | 'SATURDAY' | 'SUNDAY' // 요일
  isOperating: boolean // 운영 여부
  openTime: string | null // 오픈 시간
  closeTime: string | null // 클로즈 시간
  breakTimeEnabled?: boolean // 휴게 시간 여부
  breakStartTime: string | null // 휴게 시간 시작 시간
  breakEndTime: string | null // 휴게 시간 종료 시간
}

// 점포 상세 정보 데이터 타입
export interface StoreInfoDetail {
  id: number // 점포 ID
  storeOwner?: string // 점포 소유자
  officeId?: number // 본사 ID
  officeName?: string // 본사명
  franchiseId?: number // 가맹점 ID
  franchiseName?: string // 가맹점명
  operationStatus: OperationStatusCode // 운영여부 코드
  statusUpdatedDate?: string // 상태 업데이트 일시
  storeName: string // 점포명
  storeCode?: string // 점포 코드
  businessNumber?: string // 사업자등록번호
  storeAddress?: string // 점포 주소
  storeAddressDetail?: string // 점포 상세 주소
  ceoName?: string // 대표자명
  ceoPhone?: string // 대표자 전화번호
  storePhone?: string // 점포 전화번호
  createdBy?: string // 등록자
  createdAt?: Date // 등록일시
  updatedBy?: string // 최종 수정자
  updatedAt?: Date // 최종 수정일시
}

// 점포 상세 응답 타입
export interface StoreDetailResponse {
  storeInfo: StoreInfoDetail // 점포 상세 정보
  operating: OperatingHourInfo[] // 운영 시간 정보
  files: UploadFile[] // 점포 파일 정보
}

// 점포 상성 요청 타입
export interface StoreHeaderRequest {
  storeOwner: 'HEAD_OFFICE' | 'FRANCHISE' // 점포 소유자
  organizationId: number // 본사/가맹점 ID
  operationStatus: OperationStatusCode // 운영여부 코드
  storeName: string // 점포명
  businessNumber: string // 사업자등록번호
  storeAddress: string // 점포 주소
  storeAddressDetail?: string | null // 점포 상세 주소
  ceoName: string // 대표자명
  ceoPhone: string // 대표자 전화번호
  storePhone?: string | null // 점포 전화번호
  operatingHours: OperatingHourInfo[] // 운영 시간 정보
}

// 요일 키 타입
export type WeekdayKey = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' // 요일 키(MONDAY: 월요일, TUESDAY: 화요일, WEDNESDAY: 수요일, THURSDAY: 목요일, FRIDAY: 금요일)

// 요일 타입
export type OperatingDayType = 'WEEKDAY' | 'SATURDAY' | 'SUNDAY' // 요일 타입(WEEKDAY: 주중, SATURDAY: 토요일, SUNDAY: 일요일)

// 운영 시간 폼 상태 타입
export interface OperatingFormState {
  dayType: OperatingDayType // 요일 타입
  isOperating: boolean // 운영 여부
  openTime: string // 오픈 시간
  closeTime: string // 클로즈 시간
  breakTimeEnabled: boolean // 휴게 시간 여부
  breakStartTime: string // 휴게 시간 시작 시간
  breakEndTime: string // 휴게 시간 종료 시간
}

// 필수 항목 검증 시 사용하는 필드 키
export type FieldErrorKey =
  | 'organizationId'
  | 'storeName'
  | 'ceoName'
  | 'businessNumber'
  | 'storeAddress'
  | 'ceoPhone'
  | 'storePhone'

// 필드별 에러 메시지 모음
export type FieldErrors = Partial<Record<FieldErrorKey, string>>

// 점포 상세/등록 폼 전체 상태
export interface StoreFormState {
  storeOwner: 'HEAD_OFFICE' | 'FRANCHISE'
  officeId: number | null
  franchiseId: number | null
  organizationId: number | null
  postalCode: string
  storeName: string
  storeCode: string
  operationStatus: 'STOPR_001' | 'STOPR_002'
  operationStatusEditedDate: string
  businessNumber: string
  ceoName: string
  ceoPhone: string
  storePhone: string
  storeAddress: string
  storeAddressDetail: string
  sameAsOwner: boolean
  operating: Record<OperatingDayType, OperatingFormState>
  businessFile: File | null
  storeImages: File[]
  existingFiles: UploadFile[]
  deleteImages: number[]
  weekDaySelections: Record<WeekdayKey, boolean>
}
