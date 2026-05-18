/**
 * 알림톡 템플릿 관리 도메인 타입 정의.
 *
 * 통합 화면(알림톡/이메일/문자)이지만 이번 PR은 ALIM_TALK 한정으로 동작.
 */

export type SendType = 'ALIM_TALK' | 'EMAIL' | 'SMS'

/** 발송 카테고리 공통코드: 부모 SNDCTG, 자식 SNDCTG_001 ~ SNDCTG_009 */
export type SendCategoryCode =
  | 'SNDCTG_001'
  | 'SNDCTG_002'
  | 'SNDCTG_003'
  | 'SNDCTG_004'
  | 'SNDCTG_005'
  | 'SNDCTG_006'
  | 'SNDCTG_007'
  | 'SNDCTG_008'
  | 'SNDCTG_009'

export interface MessageTemplateSearchParams {
  sendType?: SendType
  categoryCode?: string
  templateCode?: string
  title?: string
  page?: number
  size?: number
  sort?: string
}

export interface MessageTemplateListItem {
  id: number
  categoryName: string | null
  templateCode: string
  title: string | null
  createdAt: string
}

export interface MessageTemplateDetail {
  id: number
  categoryCodeId: number | null
  categoryName: string | null
  templateCode: string
  sendTiming: string | null
  title: string | null
  body: string
  createdAt: string | null
  updatedAt: string | null
}

export interface MessageTemplateCreateRequest {
  sendType: SendType
  categoryCodeId: number
  templateCode: string
  title: string
  sendTiming?: string | null
  body: string
}

export interface MessageTemplateUpdateRequest {
  sendType: SendType
  categoryCodeId: number
  templateCode: string
  title: string
  sendTiming?: string | null
  body: string
}
