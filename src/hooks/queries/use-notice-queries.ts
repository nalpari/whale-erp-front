import { useQuery } from '@tanstack/react-query'
import { fetchNoticeDetail, fetchNotices } from '@/lib/api/notice'
import { noticeKeys } from './query-keys'

/**
 * 공지사항 목록 조회 훅.
 */
export const useNotices = () => {
  return useQuery({
    queryKey: noticeKeys.lists(),
    queryFn: ({ signal }) => fetchNotices(signal),
  })
}

/**
 * 공지사항 상세 조회 훅.
 * - noticeId가 null이면 비활성화된다.
 */
export const useNoticeDetail = (noticeId: number | null) => {
  return useQuery({
    queryKey: noticeKeys.detail(noticeId!),
    queryFn: ({ signal }) => fetchNoticeDetail(noticeId!, signal),
    enabled: noticeId !== null,
  })
}
