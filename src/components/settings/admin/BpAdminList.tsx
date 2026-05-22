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

const EMPTY = '-'

/**
 * 빈 값(null/undefined/빈 문자열) 공통 폴백 포매터
 */
const dashFallback = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return EMPTY
  const str = String(value)
  return str.length > 0 ? str : EMPTY
}

/**
 * 관리자 종류 셀 렌더러: HEAD_OFFICE / FRANCHISE 한글 변환
 */
const AdminTypeCellRenderer = (params: ICellRendererParams<BpAdminRowDataInternal>) => {
  const value = params.value as AdminType | null | undefined
  if (value === 'HEAD_OFFICE') return <span>본사 관리자</span>
  if (value === 'FRANCHISE') return <span>가맹 관리자</span>
  return <span>{EMPTY}</span>
}

/**
 * 날짜 셀 렌더러
 */
const DateCellRenderer = (params: ICellRendererParams<BpAdminRowDataInternal>) => {
  const formatted = formatDateYmd(params.value)
  return <span>{formatted && formatted.length > 0 ? formatted : EMPTY}</span>
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
    valueFormatter: (params) => dashFallback(params.value),
  },
  {
    headerName: '관리자 종류',
    field: 'organizationType',
    width: 130,
    cellRenderer: AdminTypeCellRenderer,
  },
  {
    headerName: '본사',
    colId: 'headOfficeName',
    flex: 1,
    valueGetter: (params) =>
      params.data?.organizationType === 'HEAD_OFFICE'
        ? params.data?.organizationName ?? null
        : params.data?.parentOrganizationName ?? null,
    valueFormatter: (params) => dashFallback(params.value),
  },
  {
    headerName: '가맹점',
    colId: 'franchiseName',
    flex: 1,
    valueGetter: (params) =>
      params.data?.organizationType === 'FRANCHISE'
        ? params.data?.organizationName ?? null
        : null,
    valueFormatter: (params) => dashFallback(params.value),
  },
  {
    headerName: '권한명',
    field: 'authorityName',
    flex: 1,
    valueFormatter: (params) => dashFallback(params.value),
  },
  {
    headerName: '로그인 ID',
    field: 'loginId',
    width: 150,
    valueFormatter: (params) => dashFallback(params.value),
  },
  {
    headerName: '근무여부',
    field: 'userType',
    width: 100,
    valueFormatter: (params) => {
      const label = getWorkStatusLabel(params.value)
      return label && label.length > 0 ? label : EMPTY
    },
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
