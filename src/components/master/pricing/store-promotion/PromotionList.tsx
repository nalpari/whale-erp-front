'use client'

import { useRouter } from 'next/navigation'
import { ColDef } from 'ag-grid-community'
import type { RowClickedEvent } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import type { StorePromotionListItem } from '@/types/store-promotion'
import { formatDateYmd } from '@/util/date-util'

interface PromotionListProps {
  rows: StorePromotionListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  storeName: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void
}

export default function PromotionList({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  storeName,
  onPageChange,
  onPageSizeChange,
  onRegister,
}: PromotionListProps) {
  const router = useRouter()

  const handleRowClicked = (event: RowClickedEvent<StorePromotionListItem>) => {
    const id = event.data?.id
    if (id != null) {
      router.push(`/master/pricing/store-promotion/header?id=${id}`)
    }
  }

  const columnDefs: ColDef<StorePromotionListItem>[] = [
    {
      headerName: '#',
      width: 70,
      valueGetter: (params) => (params.node?.rowIndex ?? 0) + 1 + page * pageSize,
    },
    { field: 'status', headerName: '프로모션 상태' },
    { field: 'promotionName', headerName: '프로모션명', flex: 1 },
    {
      headerName: '프로모션 메뉴',
      valueGetter: (params) => {
        const menus = params.data?.promotionMenus
        if (!menus || menus.length === 0) return '-'
        if (menus.length === 1) return menus[0].menuName
        return `${menus[0].menuName} 외 ${menus.length - 1}개`
      },
    },
    {
      headerName: '프로모션 기간',
      minWidth: 250,
      valueGetter: (params) => {
        const start = formatDateYmd(params.data?.startDate)
        const end = formatDateYmd(params.data?.endDate)
        if (!start && !end) return '-'
        return `${start ?? ''} ~ ${end ?? ''}`
      },
    },
    {
      field: 'createdAt',
      headerName: '등록일',
      valueGetter: (params) => formatDateYmd(params.data?.createdAt),
    },
    { field: 'createdByName', headerName: '등록자' },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          {storeName && (
            <span className="data-header-title">{storeName} 프로모션 가격</span>
          )}
        </div>
        <div className="data-header-right">
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
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {loading ? (
          <div className="cube-loader-overlay"><CubeLoader /></div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid rowData={rows} columnDefs={columnDefs} onRowClicked={handleRowClicked} />
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
