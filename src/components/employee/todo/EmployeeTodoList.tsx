'use client'

import { useRouter } from 'next/navigation'
import type { ColDef, RowClickedEvent, SelectionChangedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import type { EmployeeTodoListItem } from '@/types/employee-todo'

interface EmployeeTodoListProps {
  rows: EmployeeTodoListItem[]
  isLoading: boolean
  error: string | undefined
  page: number
  pageSize: number
  totalPages: number
  selectedIds: Set<number>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelectionChange: (ids: Set<number>) => void
  onDelete: () => void
  onRegister: () => void
}

export default function EmployeeTodoList({
  rows,
  isLoading,
  error,
  page,
  pageSize,
  totalPages,
  selectedIds,
  onPageChange,
  onPageSizeChange,
  onSelectionChange,
  onDelete,
  onRegister,
}: EmployeeTodoListProps) {
  const router = useRouter()

  const handleRowClicked = (event: RowClickedEvent<EmployeeTodoListItem>) => {
    const id = event.data?.id
    if (id != null) {
      router.push(`/employee/todo/${id}`)
    }
  }

  const handleSelectionChanged = (event: SelectionChangedEvent<EmployeeTodoListItem>) => {
    const selected = event.api.getSelectedRows()
    onSelectionChange(new Set(selected.map((r) => r.id)))
  }

  const columnDefs: ColDef<EmployeeTodoListItem>[] = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      suppressSizeToFit: true,
    },
    { field: 'headOfficeName', headerName: '본사', minWidth: 120 },
    { field: 'franchiseName', headerName: '가맹점', minWidth: 120 },
    { field: 'storeName', headerName: '점포', minWidth: 120 },
    { field: 'employeeName', headerName: '직원명', minWidth: 100 },
    { field: 'content', headerName: '할 일 내용', minWidth: 150 },
    { field: 'todoDate', headerName: '날짜', flex: 1, minWidth: 250 },
    {
      field: 'isCompleted',
      headerName: '완료여부',
      width: 100,
      cellRenderer: (params: { value: boolean }) => params.value ? '완료' : '미완료',
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" />
        <div className="data-header-right">
          <button
            className="btn-form gray"
            onClick={onDelete}
            type="button"
            disabled={selectedIds.size === 0}
          >
            삭제
          </button>
          <button className="btn-form basic" onClick={onRegister} type="button">
            등록
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {[50, 100, 200].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {error && <div className="warning-txt">{error}</div>}
        {isLoading ? (
          <div className="cube-loader-overlay"><CubeLoader /></div>
        ) : !error && rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid
            rowData={rows}
            columnDefs={columnDefs}
            rowSelection="multiple"
            suppressRowClickSelection
            onRowClicked={handleRowClicked}
            onSelectionChanged={handleSelectionChanged}
          />
        )}
        {!isLoading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
