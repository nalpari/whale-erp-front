'use client'

import '@/components/common/custom-css/FormHelper.css'
import { ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import type { HolidayListItem, HolidayListType } from '@/types/holiday'
import { formatDateYmd } from '@/util/date-util'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface HolidayListProps {
  rows: HolidayListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error?: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onOpenDetail: (row: HolidayListItem) => void
}

const HOLIDAY_TYPE_MAP: Record<HolidayListType, string> = {
  LEGAL: '법정 공휴일',
  PARTNER: 'Partner 휴일',
}


export default function HolidayList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  error,
  onPageChange,
  onPageSizeChange,
  onOpenDetail,
}: HolidayListProps) {
  const columnDefs: ColDef<HolidayListItem>[] = [
    {
      headerName: '#',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 + page * pageSize,
    },
    {
      field: 'year',
      headerName: '연도',
      width: 100,
    },
    {
      field: 'holidayType',
      headerName: '분류',
      width: 140,
      valueGetter: (params) =>
        params.data?.holidayType ? HOLIDAY_TYPE_MAP[params.data.holidayType] : '-',
    },
    { field: 'headOfficeName', headerName: '본사명', flex: 1 },
    { field: 'franchiseName', headerName: '가맹점명', flex: 1 },
    { field: 'storeName', headerName: '점포명', flex: 1 },
    {
      field: 'holidayCount',
      headerName: '휴일 수',
      width: 100,
    },
    {
      field: 'updatedAt',
      headerName: '최종수정일',
      width: 140,
      valueGetter: (params) => formatDateYmd(params.data?.updatedAt),
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" />
        <div className="data-header-right">
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[50, 100, 200].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {error && <div className="warning-txt">{error}</div>}
        {loading ? (
          <div className="cube-loader-overlay"><CubeLoader /></div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid
            rowData={rows}
            columnDefs={columnDefs}
            onRowClicked={(event) => {
              if (event.data) onOpenDetail(event.data)
            }}
          />
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
