'use client'

import { useRouter } from 'next/navigation'
import { ColDef, RowClickedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { formatDateTimeYmdHm } from '@/util/date-util'
import type { AlimTalkTemplateListItem } from '@/types/notification'

const COLUMN_DEFS: ColDef<AlimTalkTemplateListItem>[] = [
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

interface AlimTalkTemplateListProps {
  rows: AlimTalkTemplateListItem[]
  error?: string | null
  loading: boolean
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PAGE_SIZE_OPTIONS = [50, 100, 200]

export default function AlimTalkTemplateList({
  rows,
  error,
  loading,
  page,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: AlimTalkTemplateListProps) {
  const router = useRouter()

  const handleRowClick = (event: RowClickedEvent<AlimTalkTemplateListItem>) => {
    if (event.data) {
      router.push(`/notification/alim-talk-templates/${event.data.id}`)
    }
  }

  const handleCreate = () => {
    router.push('/notification/alim-talk-templates/new')
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button className="btn-form basic" type="button" onClick={handleCreate}>
            등록
          </button>
        </div>
        <div className="data-header-right">
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
