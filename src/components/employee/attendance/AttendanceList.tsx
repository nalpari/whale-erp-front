'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
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
  const pageSizeOptions: SelectOption[] = useMemo(
    () => [
      { value: '50', label: '50' },
      { value: '100', label: '100' },
      { value: '200', label: '200' },
    ],
    []
  )

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
            <SearchSelect
              value={pageSizeOptions.find((opt) => opt.value === String(pageSize)) || null}
              options={pageSizeOptions}
              isSearchable={false}
              isClearable={false}
              onChange={(option) => onPageSizeChange(Number(option?.value ?? 50))}
            />
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {error && <div className="warning-txt">{error}</div>}
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
