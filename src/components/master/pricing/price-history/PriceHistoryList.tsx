'use client'

import { useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, type ColDef } from 'ag-grid-community'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { formatPrice } from '@/util/format-util'
import { formatDateTimeYmdHm } from '@/util/date-util'
import type { PriceHistoryListItem } from '@/types/price-history'

ModuleRegistry.registerModules([AllCommunityModule])

const DEFAULT_COL_DEF: ColDef<PriceHistoryListItem> = {
  sortable: false,
  resizable: false,
  cellStyle: { textAlign: 'center' },
  autoHeight: true,
}

interface PriceHistoryListProps {
  rows: PriceHistoryListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  menuClassCodeMap: Map<string, string>
  operationStatusCodeMap: Map<string, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const PriceHistoryList = ({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  menuClassCodeMap,
  operationStatusCodeMap,
  onPageChange,
  onPageSizeChange,
}: PriceHistoryListProps) => {
  const columnDefs = useMemo<ColDef<PriceHistoryListItem>[]>(() => [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
    },
    {
      field: 'menuName',
      headerName: '메뉴명',
      flex: 1,
    },
    {
      field: 'menuClassificationCode',
      headerName: '메뉴분류',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return menuClassCodeMap.get(params.value) ?? params.value
      },
    },
    {
      field: 'operationStatus',
      headerName: '운영여부',
      width: 100,
      valueFormatter: (params) => {
        if (!params.value) return '-'
        return operationStatusCodeMap.get(params.value) ?? params.value
      },
    },
    {
      field: 'salePrice',
      headerName: '현재 판매가',
      width: 130,
      valueFormatter: (params) => (params.value != null ? formatPrice(params.value) : '-'),
    },
    {
      field: 'previousSalePrice',
      headerName: '이전 판매가',
      width: 130,
      valueFormatter: (params) => (params.value != null ? formatPrice(params.value) : '-'),
    },
    {
      field: 'discountPrice',
      headerName: '현재 할인가',
      width: 130,
      valueFormatter: (params) => (params.value != null ? formatPrice(params.value) : '-'),
    },
    {
      field: 'previousDiscountPrice',
      headerName: '이전 할인가',
      width: 130,
      valueFormatter: (params) => (params.value != null ? formatPrice(params.value) : '-'),
    },
    {
      field: 'priceAppliedAt',
      headerName: '반영 일시',
      width: 160,
      valueFormatter: (params) => formatDateTimeYmdHm(params.value),
    },
    {
      field: 'updatedByName',
      headerName: '수정자',
      width: 100,
      valueFormatter: (params) => params.value ?? '-',
    },
  ], [menuClassCodeMap, operationStatusCodeMap])

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" />
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

export default PriceHistoryList
