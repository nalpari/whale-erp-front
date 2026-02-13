'use client'

import { useState } from 'react'
import Image from 'next/image'
import Pagination from '@/components/ui/Pagination'
import NoticePop from '@/components/customer/NoticePop'
import { useNotices, useNoticeDetail } from '@/hooks/queries/use-notice-queries'
import { formatDateDot } from '@/util/date-util'

const PAGE_SIZE = 10

export default function BeforeNoticeList() {
  const [page, setPage] = useState(0)
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null)

  const { data: notices = [], isLoading } = useNotices()
  const { data: noticeDetail } = useNoticeDetail(selectedNoticeId)

  const totalPages = Math.max(1, Math.ceil(notices.length / PAGE_SIZE))
  const pagedNotices = notices.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="sub-wrap">
      <div className="sub-wrap-inner">
        <div className="sub-wrap-header">
          <div className="sub-header-icon">
            <Image src="/assets/images/before_main/sub_whale.png" alt="introduction" width={228} height={126} />
          </div>
          <div className="sub-header-b-tit">
            <span className="bold">WHALE ERP의</span>
            <span>새로운 소식을 알려 드립니다.</span>
          </div>
          <div className="sub-header-desc">새로운 소식 및 업데이트 되어진 신규 기능들을 소개합니다.</div>
        </div>
        <div className="before-notice-wrap">
          <ul className="before-notice-list">
            {isLoading ? (
              <li className="before-notice-item">
                <div className="before-notice-empty">불러오는 중...</div>
              </li>
            ) : pagedNotices.length === 0 ? (
              <li className="before-notice-item">
                <div className="before-notice-empty">등록된 공지사항이 없습니다.</div>
              </li>
            ) : (
              pagedNotices.map((notice) => (
                <li
                  key={notice.id}
                  className={`before-notice-item ${selectedNoticeId === notice.id ? 'act' : ''}`}
                >
                  <button
                    className="before-notice-btn"
                    onClick={() => setSelectedNoticeId(notice.id)}
                  >
                    <div className="notice-tit">{notice.title}</div>
                    <div className="notice-date">{formatDateDot(notice.createdAt)}</div>
                  </button>
                </li>
              ))
            )}
          </ul>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {noticeDetail && selectedNoticeId !== null && (
        <NoticePop
          notice={noticeDetail}
          onClose={() => setSelectedNoticeId(null)}
        />
      )}
    </div>
  )
}
