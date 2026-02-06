'use client'

import { useEffect, useMemo, useState } from 'react'
import Pagination from '@/components/ui/Pagination'
import NoticePop from './NoticePop'
import { fetchNoticeDetail, fetchNotices } from '@/lib/api/notice'
import type { NoticeDetail, NoticeListItem } from '@/lib/schemas/notice'

const NOTICE_PAGE_SIZE = 10

/**
 * 날짜 문자열을 화면 표기 형식으로 변환한다.
 */
const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
 
 export default function Notice() {
   const [page, setPage] = useState(0)
  const [notices, setNotices] = useState<NoticeListItem[]>([])
  const [activeNotice, setActiveNotice] = useState<NoticeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(notices.length / NOTICE_PAGE_SIZE))

  /**
   * 공지사항 목록을 최초 로딩한다.
   */
  useEffect(() => {
    setLoading(true)
    setError(null)

    fetchNotices()
      .then((data) => {
        setNotices(data)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : '공지사항 조회에 실패했습니다.'
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [])
 
  /**
   * 현재 페이지에 해당하는 공지 목록만 계산한다.
   */
  const pagedNotices = useMemo(() => {
     const start = page * NOTICE_PAGE_SIZE
     const end = start + NOTICE_PAGE_SIZE
    return notices.slice(start, end)
  }, [page, notices])
 
   return (
    <div className="content-wrap">
      <div className="notice-list-wrap">
        {loading ? (
          <div className="notice-empty">공지사항을 불러오는 중입니다.</div>
        ) : error ? (
          <div className="notice-empty">{error}</div>
        ) : pagedNotices.length === 0 ? (
           <div className="notice-empty">등록된 공지사항이 없습니다.</div>
         ) : (
           pagedNotices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className="notice-list-btn"
              onClick={async () => {
                // 공지사항 상세 조회 후 팝업을 연다.
                try {
                  const detail = await fetchNoticeDetail(notice.id)
                  setActiveNotice(detail)
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : '공지사항 상세 조회에 실패했습니다.'
                  setError(message)
                }
              }}
            >
               <span className="notice-tit">{notice.title}</span>
              <span className="notice-date">{formatDate(notice.createdAt)}</span>
             </button>
           ))
         )}
       </div>
 
       <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {activeNotice && <NoticePop notice={activeNotice} onClose={() => setActiveNotice(null)} />}
     </div>
   )
 }
