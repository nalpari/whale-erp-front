'use client'

import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'
import type { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { formatDateYmd } from '@/util/date-util'
import { getWorkStatusLabel } from '@/lib/schemas/admin'
import type { BpAdminItem, AdminType } from '@/lib/schemas/bp-admin'
import CubeLoader from '@/components/common/ui/CubeLoader'

ModuleRegistry.registerModules([AllCommunityModule])

interface BpAdminRowDataInternal extends BpAdminItem {
  rowNumber: number
}

/**
 * 관리자 종류 셀 렌더러: HEAD_OFFICE / FRANCHISE 한글 변환
 */
const AdminTypeCellRenderer = (params: ICellRendererParams<BpAdminRowDataInternal>) => {
  const value = params.value as AdminType | null | undefined
  if (value === 'HEAD_OFFICE') return <span>본사 관리자</span>
  if (value === 'FRANCHISE') return <span>가맹 관리자</span>
  return <span></span>
}

/**
 * 날짜 셀 렌더러
 */
const DateCellRenderer = (params: ICellRendererParams<BpAdminRowDataInternal>) => {
  return <span>{formatDateYmd(params.value)}</span>
}

const columnDefs: ColDef<BpAdminRowDataInternal>[] = [
  {
    headerName: '#',
    width: 60,
    valueGetter: (params) => params.data?.rowNumber ?? 0,
  },
  {
    headerName: '이름',
    field: 'name',
    flex: 1,
  },
  {
    headerName: '관리자 종류',
    field: 'adminType',
    width: 130,
    cellRenderer: AdminTypeCellRenderer,
  },
  {
    headerName: '소속 본사',
    field: 'headOfficeOrganizationName',
    flex: 1,
    valueGetter: (params) => params.data?.headOfficeOrganizationName ?? '',
  },
  {
    headerName: '소속 가맹',
    field: 'franchiseOrganizationName',
    flex: 1,
    valueGetter: (params) => params.data?.franchiseOrganizationName ?? '',
  },
  {
    headerName: '권한명',
    field: 'authorityName',
    flex: 1,
    valueGetter: (params) => params.data?.authorityName ?? '-',
  },
  {
    headerName: '로그인 ID',
    field: 'loginId',
    width: 150,
  },
  {
    headerName: '근무여부',
    field: 'userType',
    width: 100,
    valueFormatter: (params) => getWorkStatusLabel(params.value),
  },
  {
    headerName: '등록일',
    field: 'createdAt',
    width: 120,
    cellRenderer: DateCellRenderer,
  },
]

interface BpAdminListProps {
  admins: BpAdminItem[]
  isLoading: boolean
  error?: string | null
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void
  onRowClick?: (id: number) => void
}

export default function BpAdminList({
  admins,
  isLoading,
  error,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRegister,
  onRowClick,
}: BpAdminListProps) {
  const rowData: BpAdminRowDataInternal[] = admins.map((admin, index) => ({
    ...admin,
    rowNumber: index + 1 + currentPage * pageSize,
  }))

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={onRegister} type="button">
            BP 관리자 등록
          </button>
          <div className="data-count-select">
            <select
              className="select-form"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
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
        {error && <div className="warning-txt">{error}</div>}
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
              if (event.data) onRowClick?.(event.data.id)
            }}
          />
        )}
        {!isLoading && rowData.length > 0 && (
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => onPageChange(page)}
          />
        )}
      </div>
    </div>
  )
}
