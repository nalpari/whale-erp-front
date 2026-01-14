'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, ColDef, RowClickedEvent } from 'ag-grid-community'

ModuleRegistry.registerModules([AllCommunityModule])

interface DefaultRow {
  id: number
  name: string
  phone: string
  status: string
  createdAt: string
}

const fallbackRowData: DefaultRow[] = [
  {
    id: 1,
    name: 'Sample 01',
    phone: '010-0000-0001',
    status: 'READY',
    createdAt: '2024-06-05 10:00',
  },
  {
    id: 2,
    name: 'Sample 02',
    phone: '010-0000-0002',
    status: 'READY',
    createdAt: '2024-06-05 10:10',
  },
]

const fallbackColumnDefs: ColDef<DefaultRow>[] = [
  { field: 'id', headerName: '#', width: 60 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'phone', headerName: 'Phone' },
  { field: 'status', headerName: 'Status' },
  { field: 'createdAt', headerName: 'Created At' },
]

interface AgGridProps<T extends object> {
  rowData?: T[]
  columnDefs?: ColDef<T>[]
  defaultColDef?: ColDef<T>
  rowSelection?: 'single' | 'multiple'
  suppressRowClickSelection?: boolean
  onRowClicked?: (event: RowClickedEvent<T>) => void
}

export default function AgGrid<T extends object>({
  rowData,
  columnDefs,
  defaultColDef,
  rowSelection,
  suppressRowClickSelection,
  onRowClicked,
}: AgGridProps<T>) {
  const resolvedRowData = (rowData ?? fallbackRowData) as T[]
  const resolvedColumnDefs = (columnDefs ?? fallbackColumnDefs) as ColDef<T>[]
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
      />
    </div>
  )
}
