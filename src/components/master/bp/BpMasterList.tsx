'use client'

import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, type ColDef } from 'ag-grid-community'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { formatDateTimeYmdHm } from '@/util/date-util'
import type { BpDetailResponse } from '@/types/bp'

ModuleRegistry.registerModules([AllCommunityModule])

const DEFAULT_COL_DEF: ColDef<BpDetailResponse> = {
  sortable: false,
  resizable: false,
  cellStyle: { textAlign: 'center' },
  autoHeight: true,
}

interface BpMasterListProps {
  rows: BpDetailResponse[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  operationStatusCodeMap: Map<string, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRegister: () => void
  onRowClick: (id: number) => void
}

const BpMasterList = ({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  operationStatusCodeMap,
  onPageChange,
  onPageSizeChange,
  onRegister,
  onRowClick,
}: BpMasterListProps) => {

  const columnDefs = useMemo<ColDef<BpDetailResponse>[]>(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'bpoprType',
      headerName: '운영여부',
      width: 100,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return operationStatusCodeMap.get(params.value) ?? params.value
      },
    },
    {
      field: 'headOfficeName',
      headerName: '본사',
      flex: 1,
      valueFormatter: (params) => params.value ?? '-',
    },
    {
      field: 'franchiseStoreName',
      headerName: '가맹점',
      flex: 1,
      valueFormatter: (params) => params.value ?? '-',
    },
    {
      field: 'representativeName',
      headerName: '대표자',
      width: 120,
      valueFormatter: (params) => params.value ?? '-',
    },
    {
      field: 'createdByName',
      headerName: '등록자',
      width: 100,
      valueFormatter: (params) => params.value ?? '-',
    },
    {
      field: 'createdAt',
      headerName: '등록일',
      width: 160,
      valueFormatter: (params) => formatDateTimeYmdHm(params.value),
    },
    {
      headerName: '구독정보',
      width: 120,
      valueFormatter: () => '-',
      // TODO: API에 구독 정보 필드 추가 후 구현
    },
  ], [operationStatusCodeMap])

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left">
          <button className="btn-form basic" onClick={onRegister} type="button">
            등록
          </button>
        </div>
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
        {loading ? (
          <div className="cube-loader-overlay"><CubeLoader /></div>
        ) : rows.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <div className="erp-grid w-full">
            <AgGridReact
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={DEFAULT_COL_DEF}
              domLayout="autoHeight"
              onRowClicked={(event) => {
                if (event.data?.id) onRowClick(event.data.id)
              }}
            />
          </div>
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}

export default BpMasterList
