'use client'

import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { formatDateYmd } from '@/util/date-util'
import type { AdminListItem } from '@/lib/schemas/admin'
import { getWorkStatusLabel } from '@/lib/schemas/admin'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface AdminRowDataInternal extends AdminListItem {
  rowNumber: number
}

/**
 * 전화번호 포맷 (숫자 → 하이픈 형식)
 */
function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return '-'
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return value
}

/**
 * 전화번호 셀 렌더러
 */
const PhoneCellRenderer = (params: ICellRendererParams<AdminRowDataInternal>) => {
  return <span>{formatPhoneNumber(params.value)}</span>
}

/**
 * 날짜 셀 렌더러
 */
const DateCellRenderer = (params: ICellRendererParams<AdminRowDataInternal>) => {
  return <span>{formatDateYmd(params.value)}</span>
}

const columnDefs: ColDef<AdminRowDataInternal>[] = [
  {
    headerName: '#',
    width: 60,
    valueGetter: (params) => params.data?.rowNumber ?? 0,
  },
  {
    headerName: '근무여부',
    field: 'userType',
    width: 100,
    valueFormatter: (params) => getWorkStatusLabel(params.value),
  },
  {
    headerName: 'ID',
    field: 'loginId',
    width: 130,
  },
  {
    headerName: '관리자명',
    field: 'name',
    flex: 1,
  },
  {
    headerName: '휴대폰번호',
    field: 'mobilePhone',
    width: 150,
    cellRenderer: PhoneCellRenderer,
  },
  {
    headerName: '이메일 주소',
    field: 'email',
    flex: 1.5,
    valueGetter: (params) => params.data?.email || '-',
  },
  {
    headerName: '권한',
    field: 'authorityName',
    flex: 1,
    valueGetter: (params) => params.data?.authorityName || '-',
  },
  {
    headerName: '등록일',
    field: 'createdAt',
    width: 120,
    cellRenderer: DateCellRenderer,
  },
]

interface AdminListProps {
  admins?: AdminListItem[]
  isLoading?: boolean
  currentPage?: number
  totalPages?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRegister?: () => void
}

export default function AdminList({
  admins = [],
  isLoading = false,
  currentPage = 0,
  totalPages = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onRegister,
}: AdminListProps) {
  const router = useRouter()

  const rowData = admins.map((admin, index) => ({
    ...admin,
    rowNumber: index + 1 + currentPage * pageSize,
  }))

  const handleNavigateToDetail = (id: number) => {
    router.push(`/system/admin/${id}`)
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={onRegister} type="button">
            등록
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              aria-label="페이지당 표시 개수 선택"
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
        {isLoading ? (
          <CubeLoader />
        ) : rowData.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid
            rowData={rowData}
            columnDefs={columnDefs}
            onRowClicked={(event) => {
              if (event.data) handleNavigateToDetail(event.data.id)
            }}
          />
        )}
        {!isLoading && rowData.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => onPageChange?.(page)}
          />
        )}
      </div>
    </div>
  )
}
