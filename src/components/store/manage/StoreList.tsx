'use client'
import { Tooltip } from 'react-tooltip'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { StoreListItem } from '@/types/store'

interface StoreListProps {
  rows: StoreListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error?: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void
  onOpenDetail: (storeId: number) => void
}

const toStatusLabel = (status: string) => {
  if (status === 'STOPR_001') return '운영'
  if (status === 'STOPR_002') return '미운영'
  return status
}

const formatDate = (value?: string) => {
  if (!value) return '-'
  return value.split('T')[0]
}

export default function StoreList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  error,
  onPageChange,
  onPageSizeChange,
  onRegister,
  onOpenDetail,
}: StoreListProps) {
  const columnDefs: ColDef<StoreListItem>[] = [
    {
      headerName: '#',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 + page * pageSize,
    },
    {
      field: 'operationStatus',
      headerName: '운영여부',
      valueGetter: (params) => toStatusLabel(params.data?.operationStatus ?? ''),
    },
    { field: 'officeName', headerName: '본사명' },
    { field: 'franchiseName', headerName: '가맹점' },
    {
      field: 'storeName',
      headerName: '점포명',
      flex: 1,
      cellRenderer: (params: ICellRendererParams<StoreListItem>) => (
        <button
          type="button"
          className="btn-link"
          onClick={() => params.data && onOpenDetail(params.data.id)}
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'createdAt',
      headerName: '등록일',
      valueGetter: (params) => formatDate(params.data?.createdAt),
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button className="tooltip-btn">
            <span className="tooltip-icon" id="tooltip-btn-anchor"></span>
            <Tooltip className="tooltip-txt" anchorSelect="#tooltip-btn-anchor">
              <div>점포 정보 관리 기준으로 필터와 목록을 확인하세요.</div>
              <div>운영여부, 본사/가맹점/점포 조건을 함께 사용할 수 있습니다.</div>
            </Tooltip>
          </button>
        </div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={onRegister} type="button">
            등록
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
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
        ) : (
          <AgGrid rowData={rows} columnDefs={columnDefs} />
        )}
        <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </div>
  )
}
