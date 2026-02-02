'use client'

import { ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import type { AttendanceListItem } from '@/types/attendance'

const WORK_DAY_LABEL: Record<string, string> = {
  '평일 전체': '평일',
  '토요일': '토',
  '일요일': '일',
}

interface AttendanceListProps {
  rows: AttendanceListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error?: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRowClick?: (row: AttendanceListItem) => void
}

export default function AttendanceList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  error,
  onPageChange,
  onPageSizeChange,
  onRowClick,
}: AttendanceListProps) {
  const columnDefs: ColDef<AttendanceListItem>[] = [
    {
      headerName: '#',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 + page * pageSize,
    },
    {
      field: 'workStatus',
      headerName: '근무여부',
    },
    { field: 'officeName', headerName: '본사' },
    { field: 'franchiseName', headerName: '가맹점' },
    { field: 'storeName', headerName: '점포' },
    { field: 'employeeName', headerName: '직원명', flex: 1 },
    {
      field: 'employeeClassify',
      headerName: '직원 분류',
    },
    {
      field: 'contractClassify',
      headerName: '계약 분류',
    },
    {
      field: 'workDay',
      headerName: '근무요일',
      flex: 1,
      valueGetter: (params) =>
        params.data?.workDay?.map((d) => WORK_DAY_LABEL[d] ?? d).join('/') ?? '-',
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
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
        {error && <div className="form-helper error">{error}</div>}
        {loading ? (
          <div></div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid
            rowData={rows}
            columnDefs={columnDefs}
            onRowClicked={(event) => {
              if (event.data && onRowClick) onRowClick(event.data)
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
