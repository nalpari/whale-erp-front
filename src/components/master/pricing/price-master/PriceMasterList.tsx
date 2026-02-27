'use client'

import { useState, useRef, useMemo, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, type ColDef, type SelectionChangedEvent, type ICellRendererParams } from 'ag-grid-community'
import Pagination from '@/components/ui/Pagination'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { formatPrice } from '@/util/format-util'
import { formatDateTimeYmdHm } from '@/util/date-util'
import type { PriceMasterListItem } from '@/types/price-master'

ModuleRegistry.registerModules([AllCommunityModule])

const DEFAULT_COL_DEF: ColDef<PriceMasterListItem> = {
  sortable: false,
  resizable: false,
  cellStyle: { textAlign: 'center' },
  autoHeight: true,
}

const formatCurrency = (value: string): string => {
  const clean = value.replace(/[^\d]/g, '')
  if (clean === '') return ''
  return parseInt(clean, 10).toLocaleString('ko-KR')
}

const PriceInput = ({ defaultValue, onChange }: { defaultValue: number | null; onChange: (value: string) => void }) => {
  const [display, setDisplay] = useState(() =>
    defaultValue != null ? defaultValue.toLocaleString('ko-KR') : ''
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    setDisplay(formatCurrency(e.target.value))
    onChange(raw)
  }

  return (
    <div className="input-icon-frame">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
      />
    </div>
  )
}

export interface PriceMasterListHandle {
  getSelectedRows: () => PriceMasterListItem[]
  getPriceChanges: () => Map<number, { salePrice?: string; discountPrice?: string }>
  clearSelection: () => void
}

interface PriceMasterListProps {
  rows: PriceMasterListItem[]
  page: number
  pageSize: number
  totalPages: number
  loading: boolean
  menuClassCodeMap: Map<string, string>
  operationStatusCodeMap: Map<string, string>
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  scheduledCount: number
  onSelectionChange: (hasChecked: boolean) => void
}

const PriceMasterList = forwardRef<PriceMasterListHandle, PriceMasterListProps>(({
  rows,
  page,
  pageSize,
  totalPages,
  loading,
  menuClassCodeMap,
  operationStatusCodeMap,
  onPageChange,
  onPageSizeChange,
  scheduledCount,
  onSelectionChange,
}, ref) => {
  const gridRef = useRef<AgGridReact<PriceMasterListItem>>(null)
  const priceChangesRef = useRef<Map<number, { salePrice?: string; discountPrice?: string }>>(new Map())
  const selectedRowsRef = useRef<PriceMasterListItem[]>([])
  const suppressSelectionEventRef = useRef(false)

  // rows 변경 시 수정된 가격 및 선택 상태 초기화 (페이지 변경, 재검색 시)
  useEffect(() => {
    priceChangesRef.current.clear()
    selectedRowsRef.current = []
    suppressSelectionEventRef.current = true
    gridRef.current?.api?.deselectAll()
    suppressSelectionEventRef.current = false
  }, [rows])

  useImperativeHandle(ref, () => ({
    getSelectedRows: () => selectedRowsRef.current,
    getPriceChanges: () => priceChangesRef.current,
    clearSelection: () => {
      selectedRowsRef.current = []
      priceChangesRef.current.clear()
      suppressSelectionEventRef.current = true
      gridRef.current?.api?.deselectAll()
      suppressSelectionEventRef.current = false
    },
  }))

  const handleSelectionChanged = useCallback((event: SelectionChangedEvent<PriceMasterListItem>) => {
    if (suppressSelectionEventRef.current) return
    selectedRowsRef.current = event.api.getSelectedRows()
    onSelectionChange(selectedRowsRef.current.length > 0)
  }, [onSelectionChange])

  const columnDefs = useMemo<ColDef<PriceMasterListItem>[]>(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 50,
      suppressSizeToFit: true,
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
      headerName: '판매가 수정',
      width: 150,
      cellRenderer: (params: ICellRendererParams<PriceMasterListItem>) => {
        const row = params.data
        if (!row) return null
        return (
          <PriceInput
            key={`${row.id}-${row.salePrice}`}
            defaultValue={row.salePrice}
            onChange={(value) => {
              const current = priceChangesRef.current.get(row.id) ?? {}
              current.salePrice = value
              priceChangesRef.current.set(row.id, current)
              setTimeout(() => params.node.setSelected(true), 0)
            }}
          />
        )
      },
    },
    {
      field: 'discountPrice',
      headerName: '현재 할인가',
      width: 130,
      valueFormatter: (params) => (params.value != null ? formatPrice(params.value) : '-'),
    },
    {
      headerName: '할인가 수정',
      width: 150,
      cellRenderer: (params: ICellRendererParams<PriceMasterListItem>) => {
        const row = params.data
        if (!row) return null
        return (
          <PriceInput
            key={`${row.id}-${row.discountPrice}`}
            defaultValue={row.discountPrice}
            onChange={(value) => {
              const current = priceChangesRef.current.get(row.id) ?? {}
              current.discountPrice = value
              priceChangesRef.current.set(row.id, current)
              setTimeout(() => params.node.setSelected(true), 0)
            }}
          />
        )
      },
    },
    {
      field: 'scheduledAt',
      headerName: '반영 예약',
      width: 160,
      valueFormatter: (params) => formatDateTimeYmdHm(params.value),
    },
  ], [menuClassCodeMap, operationStatusCodeMap])

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left" />
        <div className="data-header-right">
          <span>반영예약 {scheduledCount.toLocaleString()}건 (현재 페이지)</span>
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
              ref={gridRef}
              rowData={rows}
              columnDefs={columnDefs}
              defaultColDef={DEFAULT_COL_DEF}
              domLayout="autoHeight"
              rowSelection={{ mode: 'multiRow' }}
              suppressRowClickSelection={true}
              onSelectionChanged={handleSelectionChanged}
            />
          </div>
        )}
        {!loading && rows.length > 0 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
})

PriceMasterList.displayName = 'PriceMasterList'

export default PriceMasterList
