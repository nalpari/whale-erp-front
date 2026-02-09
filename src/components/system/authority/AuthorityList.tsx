'use client'

import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { formatDateYmd } from '@/util/date-util'
import type { AuthorityListItem } from '@/lib/schemas/authority'

/**
 * AG Grid용 권한 목록 데이터 타입
 * 행 번호를 포함한 확장 타입
 */
interface AuthorityRowDataInternal extends AuthorityListItem {
  rowNumber: number
}

/**
 * 권한 Group 셀 렌더러
 * PRGRP_001 → 플랫폼, PRGRP_002 → BP
 */
const OwnerGroupCellRenderer = (params: ICellRendererParams<AuthorityRowDataInternal>) => {
  const getDisplayText = (code: string) => {
    switch (code) {
      case 'PRGRP_001':
        return '플랫폼'
      case 'PRGRP_002':
        return 'BP'
      default:
        return code
    }
  }

  return <span>{getDisplayText(params.value)}</span>
}

/**
 * 권한명 셀 렌더러
 */
const NameCellRenderer = (params: ICellRendererParams<AuthorityRowDataInternal>) => {
  return <span>{params.value}</span>
}

/**
 * 운영여부 셀 렌더러
 */
const IsUsedCellRenderer = (params: ICellRendererParams<AuthorityRowDataInternal>) => {
  return <span>{params.value ? '운영' : '미운영'}</span>
}

/**
 * 날짜 셀 렌더러
 * YYYY-MM-DD 형식으로 포맷
 */
const DateCellRenderer = (params: ICellRendererParams<AuthorityRowDataInternal>) => {
  return <span>{formatDateYmd(params.value)}</span>
}

/**
 * 권한 목록 테이블 컴포넌트
 *
 * AG Grid를 사용하여 권한 목록을 표시하고, 클릭 시 상세 페이지로 이동
 *
 * @param authorities - 권한 목록 데이터
 * @param isLoading - 로딩 상태
 * @param currentPage - 현재 페이지 (0-based)
 * @param totalPages - 전체 페이지 수
 * @param pageSize - 페이지당 표시 개수
 * @param onPageChange - 페이지 변경 핸들러
 * @param onPageSizeChange - 페이지 크기 변경 핸들러
 * @param onRegister - 등록 버튼 클릭 핸들러
 */
interface AuthorityListProps {
  authorities?: AuthorityListItem[]
  isLoading?: boolean
  currentPage?: number
  totalPages?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRegister?: () => void
}

export default function AuthorityList({
  authorities = [],
  isLoading = false,
  currentPage = 0,
  totalPages = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onRegister,
}: AuthorityListProps) {
  const router = useRouter()

  // 행 번호 추가
  const rowData = authorities.map((authority, index) => ({
    ...authority,
    rowNumber: index + 1 + currentPage * pageSize,
  }))

  // 권한 상세 페이지로 이동
  const handleNavigateToDetail = (id: number) => {
    router.push(`/system/authority/${id}`)
  }

  // 컬럼 정의
  const columnDefs: ColDef<AuthorityRowDataInternal>[] = [
    {
      headerName: '#',
      width: 60,
      valueGetter: (params) => params.data?.rowNumber ?? 0,
    },
    {
      headerName: '권한 Group',
      field: 'owner_group',
      width: 120,
      cellRenderer: OwnerGroupCellRenderer,
    },
    {
      field: 'head_office_name',
      headerName: '본사',
      flex: 1,
      valueGetter: (params) => params.data?.head_office_name || '-',
    },
    {
      field: 'franchisee_name',
      headerName: '가맹점',
      flex: 1,
      valueGetter: (params) => params.data?.franchisee_name || '-',
    },
    {
      field: 'name',
      headerName: '권한명',
      flex: 1.5,
      cellRenderer: NameCellRenderer,
    },
    {
      field: 'is_used',
      headerName: '운영여부',
      width: 100,
      cellRenderer: IsUsedCellRenderer,
    },
    {
      field: 'description',
      headerName: '권한설명',
      flex: 2,
      valueGetter: (params) => params.data?.description || '-',
    },
    {
      field: 'created_at',
      headerName: '등록일시',
      width: 160,
      cellRenderer: DateCellRenderer,
    },
  ]

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
          <div></div>
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
