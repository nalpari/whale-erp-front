export type HolidayOwnType = 'LEGAL' | 'HEAD_OFFICE' | 'FRANCHISE' | 'STORE'
export type ApplyChildType = 'HEAD_OFFICE' | 'ALL_HEAD_OFFICE_STORES' | 'ALL_FRANCHISE_STORES'
export type HolidaySourceType = 'LEGAL' | 'BRANCH'
export type HolidayListType = 'LEGAL' | 'PARTNER'

// 목록 조회 파라미터
export interface HolidayListParams {
    year: number
    office?: number
    franchise?: number
    store?: number
    page?: number
    size?: number
}

// 목록 응답 아이템
export interface HolidayListItem {
    year: number
    holidayType: HolidayListType
    headOfficeName?: string
    headOfficeId?: number
    franchiseName?: string
    franchiseId?: number
    storeName?: string
    storeId?: number
    holidayCount: number
    updatedAt?: string
}

// 소유자별 휴일 조회 파라미터
export interface HolidayOwnerParams {
    year: number
    orgId?: number
    storeId?: number
}

// 소유자별 휴일 응답
export interface HolidayResponse {
    holidayOwnType: HolidayOwnType
    ownerId: number
    ownerName?: string
    branchName?: string
    infos: HolidayResponseInfo[]
}

export interface HolidayResponseInfo {
    id: number
    holidayName: string
    hasPeriod: boolean
    startDate: string
    endDate?: string
    holidayType: HolidayOwnType
    isOperating: boolean
    applyChildType?: ApplyChildType
}

// 휴일 생성/수정 요청
export interface HolidayRequest {
    ownerType: HolidayOwnType
    ownerId: number
    holidayInfos: HolidayInfoRequest[]
    parentHolidaySettings?: ParentHolidayOperatingSetting[]
}

export interface HolidayInfoRequest {
    holidayId?: number
    holidayName: string
    isOperating: boolean
    hasPeriod: boolean
    startDate: string
    endDate?: string
    applyChildType?: ApplyChildType
}

export interface ParentHolidayOperatingSetting {
    holidaySourceType: HolidaySourceType
    holidaySourceId: number
    isOperating: boolean
}

// 삭제 파라미터
export interface HolidayDeleteParams {
    type: HolidayOwnType
    id: number
}

// 법정공휴일 응답
export interface LegalHolidayResponse {
    id: number
    holidayName: string
    hasPeriod: boolean
    startDate: string
    endDate?: string
}

// 법정공휴일 생성/수정 요청
export interface LegalHolidayRequest {
    id?: number
    holidayName: string
    hasPeriod: boolean
    startDate: string
    endDate?: string
}
