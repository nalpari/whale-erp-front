/**
 * 공통코드 관리 검색 파라미터 타입
 */
export interface CommonCodeSearchParams {
  owner_group: string // 'platform' | 'bp'
  head_office_id?: number
  franchisee_id?: number
  is_used?: boolean
  has_relation_code?: boolean
  header_code?: string
  header_id?: string
  header_code_name?: string
  header_code_description?: string
  page?: number
  size?: number
}
