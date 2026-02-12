'use client'
import '@/components/common/custom-css/FormHelper.css'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { StoreListItem } from '@/types/store'
import { formatDateYmd } from '@/util/date-util'

// 점포 목록 테이블 컴포넌트 props
interface StoreListProps {
  rows: StoreListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  error?: string | null
  statusMap: Record<string, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void
  registerDisabled?: boolean
  onOpenDetail: (storeId: number) => void
}


// 점포 목록 테이블 + 페이징 UI
export default function StoreList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  error,
  statusMap,
  onPageChange,
  onPageSizeChange,
  onRegister,
  registerDisabled,
  onOpenDetail,
}: StoreListProps) {
  // 그리드 컬럼 정의(표시 순서/렌더링 규칙 포함)
  const columnDefs: ColDef<StoreListItem>[] = [
    {
      headerName: '#',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 + page * pageSize,
    },
    {
      field: 'operationStatus',
      headerName: '운영여부',
      valueGetter: (params) => statusMap[params.data?.operationStatus ?? ''] ?? '-',
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
          onClick={(event) => {
            event.stopPropagation()
            if (params.data) onOpenDetail(params.data.id)
          }}
        >
          {params.value}
        </button>
      ),
    },
    {
      field: 'createdAt',
      headerName: '등록일',
      valueGetter: (params) => formatDateYmd(params.data?.createdAt),
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
        </div>
        <div className="data-header-right">
          <button
            className="btn-form basic"
            onClick={onRegister}
            type="button"
            disabled={registerDisabled}
            title={registerDisabled ? '플랜 확인 중...' : undefined}
            aria-label={registerDisabled ? '플랜 확인 중입니다' : '점포 등록'}
          >
            {registerDisabled ? '확인 중...' : '등록'}
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
        {error && <div className="warning-txt">{error}</div>}
        {loading ? (
          <div></div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid rowData={rows} columnDefs={columnDefs} onRowClicked={(event) => onOpenDetail(event.data?.id ?? 0)}/>
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
