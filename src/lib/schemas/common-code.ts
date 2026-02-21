/**
 * 공통코드 관리 검색 파라미터 타입
 */
export interface CommonCodeSearchParams {
  owner_group: string // 'platform' | 'bp'
  head_office_id?: number
  franchisee_id?: number
  isActive?: boolean
  has_relation_code?: boolean
  headerCode?: string
  headerId?: string
  headerName?: string
  headerDescription?: string
  page?: number
  size?: number
}
