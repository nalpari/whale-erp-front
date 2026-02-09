import { getWithSchema } from '@/lib/api'
import {
  noticeDetailResponseSchema,
  noticeListResponseSchema,
  type NoticeDetail,
  type NoticeListItem,
} from '@/lib/schemas/notice'

/**
 * 공지사항 목록 조회
 */
export async function fetchNotices(signal?: AbortSignal): Promise<NoticeListItem[]> {
  const response = await getWithSchema('/api/v1/customer/notices', noticeListResponseSchema, { signal })
  return response.data
}

/**
 * 공지사항 상세 조회
 */
export async function fetchNoticeDetail(noticeId: number, signal?: AbortSignal): Promise<NoticeDetail> {
  const response = await getWithSchema(`/api/v1/customer/notices/${noticeId}`, noticeDetailResponseSchema, {
    signal,
  })
  return response.data
}
