'use client'

import { useRouter } from 'next/navigation'
import { ColDef, RowClickedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { formatDateTimeYmdHm } from '@/util/date-util'
import type { MessageTemplateListItem, SendType } from '@/types/notification'

/**
 * 발송 구분 → 등록 페이지 라우트 매핑.
 *
 * 향후 이메일/문자 채널 추가 시 본 테이블에 path만 추가하면 등록 분기가 자동으로 동작.
 * 현재는 알림톡만 활성. 알림톡 외 선택 시 `handleCreate`에서 안내 후 차단.
 */
const REGISTER_PATH_BY_SEND_TYPE: Partial<Record<SendType, string>> = {
  ALIM_TALK: '/notification/alim-talk-templates/new',
  // EMAIL: '/notification/email-templates/new',  // 후속 PR
  // SMS: '/notification/sms-templates/new',       // 후속 PR
}

const SEND_TYPE_LABEL: Record<SendType, string> = {
  ALIM_TALK: '알림톡',
  EMAIL: '이메일',
  SMS: '문자',
}

const COLUMN_DEFS: ColDef<MessageTemplateListItem>[] = [
  { headerName: '#', valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1, width: 80 },
  { field: 'categoryName', headerName: '템플릿 분류', flex: 1 },
  { field: 'templateCode', headerName: '템플릿 코드', flex: 1 },
  { field: 'title', headerName: '템플릿 명', flex: 2 },
  {
    field: 'createdAt',
    headerName: '등록일',
    flex: 1,
    valueFormatter: (params) => formatDateTimeYmdHm(params.value, ''),
  },
]

interface MessageTemplateListProps {
  rows: MessageTemplateListItem[]
  error?: string | null
  loading: boolean
  page: number
  pageSize: number
  totalPages: number
  sendType: SendType
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

export default function MessageTemplateList({
  rows,
  error,
  loading,
  page,
  pageSize,
  totalPages,
  sendType,
  onPageChange,
  onPageSizeChange,
}: MessageTemplateListProps) {
  const router = useRouter()

  const handleRowClick = (event: RowClickedEvent<MessageTemplateListItem>) => {
    if (event.data) {
      router.push(`/notification/alim-talk-templates/${event.data.id}`)
    }
  }

  const handleCreate = () => {
    const path = REGISTER_PATH_BY_SEND_TYPE[sendType]
    if (!path) {
      window.alert(
        `${SEND_TYPE_LABEL[sendType]} 템플릿 등록은 후속 작업에서 지원됩니다.`,
      )
      return
    }
    router.push(path)
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" />
        <div className="data-header-right">
          <button className="btn-form basic" type="button" onClick={handleCreate}>
            등록
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="페이지 사이즈"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {error && <div className="form-helper error">{error}</div>}
        {loading ? (
          <div className="cube-loader-overlay">
            <CubeLoader />
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid rowData={rows} columnDefs={COLUMN_DEFS} onRowClicked={handleRowClick} />
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
