'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, ColDef, RowClickedEvent, RowClassRules } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

interface AgGridProps<T extends object> {
  rowData?: T[]
  columnDefs?: ColDef<T>[]
  defaultColDef?: ColDef<T>
  rowSelection?: 'single' | 'multiple'
  suppressRowClickSelection?: boolean
  onRowClicked?: (event: RowClickedEvent<T>) => void
  rowClassRules?: RowClassRules<T>
}

export default function AgGrid<T extends object>({
  rowData,
  columnDefs,
  defaultColDef,
  rowSelection,
  suppressRowClickSelection,
  onRowClicked,
  rowClassRules,
}: AgGridProps<T>) {
  const resolvedRowData = rowData ?? ([] as T[])
  const resolvedColumnDefs = columnDefs ?? ([] as ColDef<T>[])
  const resolvedDefaultColDef: ColDef<T> = {
    sortable: false,
    resizable: false,
    cellStyle: { textAlign: 'center' },
    autoHeight: true,
    ...defaultColDef,
  }

  return (
    <div className="erp-grid" style={{ width: '100%' }}>
      <AgGridReact
        rowData={resolvedRowData}
        columnDefs={resolvedColumnDefs}
        domLayout="autoHeight"
        defaultColDef={resolvedDefaultColDef}
        rowSelection={rowSelection}
        suppressRowClickSelection={suppressRowClickSelection}
        onRowClicked={onRowClicked}
        rowClassRules={rowClassRules}
      />
    </div>
  )
}
