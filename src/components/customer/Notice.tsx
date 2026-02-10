'use client'

import { useMemo, useState } from 'react'
import Pagination from '@/components/ui/Pagination'
import NoticePop from './NoticePop'
import { useNotices, useNoticeDetail } from '@/hooks/queries'
import { formatDateDot } from '@/util/date-util'

const NOTICE_PAGE_SIZE = 10

export default function Notice() {
  const [page, setPage] = useState(0)
  const [activeNoticeId, setActiveNoticeId] = useState<number | null>(null)

  const { data: notices = [], isPending, error } = useNotices()
  const { data: activeNotice } = useNoticeDetail(activeNoticeId)

  const totalPages = Math.max(1, Math.ceil(notices.length / NOTICE_PAGE_SIZE))

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
        {isPending ? (
          <div className="notice-empty">공지사항을 불러오는 중입니다.</div>
        ) : error ? (
          <div className="notice-empty">
            {error instanceof Error ? error.message : '공지사항 조회에 실패했습니다.'}
          </div>
        ) : pagedNotices.length === 0 ? (
          <div className="notice-empty">등록된 공지사항이 없습니다.</div>
        ) : (
          pagedNotices.map((notice) => (
            <button
              key={notice.id}
              type="button"
              className="notice-list-btn"
              onClick={() => setActiveNoticeId(notice.id)}
            >
              <span className="notice-tit">{notice.title}</span>
              <span className="notice-date">{formatDateDot(notice.createdAt)}</span>
            </button>
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      {activeNotice && (
        <NoticePop notice={activeNotice} onClose={() => setActiveNoticeId(null)} />
      )}
    </div>
  )
}
