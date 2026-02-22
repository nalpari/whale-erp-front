/**
 * 공통코드 관리 검색 파라미터 타입
 */
export interface CommonCodeSearchParams {
  ownerGroup: string // 'platform' | 'bp'
  headOfficeId?: number
  franchiseeId?: number
  isActive?: boolean
  hasRelationCode?: boolean
  headerCode?: string
  headerId?: string
  headerName?: string
  headerDescription?: string
  page?: number
  size?: number
}
