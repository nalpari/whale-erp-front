'use client'

import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, ColDef } from 'ag-grid-community'

// AG Grid 모듈 등록 (필수!)
ModuleRegistry.registerModules([AllCommunityModule])
export default function AgGrid() {
  interface IRow {
    make: number
    model: string
    price: string
    phone: string
    auth: string
    regDate: string
  }
  const rowData = [
    {
      make: 1,
      model: 'user01',
      price: '홍길동',
      phone: '010-1234-5678',
      auth: 'PASS',
      regDate: '2024-06-05 10:00',
    },
    {
      make: 2,
      model: 'user02',
      price: '김철수',
      phone: '010-9876-5432',
      auth: 'PASS',
      regDate: '2024-06-05 10:10',
    },
    {
      make: 3,
      model: 'user03',
      price: '이영희',
      phone: '010-5555-6666',
      auth: 'PASS',
      regDate: '2024-06-05 10:20',
    },
  ]
  const colDefs = [
    {
      width: 60,
      cellRenderer: () => {
        return (
          <div className="check-form-box no-txt ">
            <input type="checkbox" id="checkbox" />
            <label htmlFor="checkbox"></label>
          </div>
        )
      },
      headerComponent: () => {
        return (
          <div className="check-form-box no-txt header">
            <input type="checkbox" id="checkbox-all" />
            <label htmlFor="checkbox-all"></label>
          </div>
        )
      },
    },
    { field: 'make', headerName: '번호', width: 60 },
    {
      headerName: '변환',
      cellRenderer: () => {
        return (
          <div className="filed-input">
            <input type="text" className="input-frame small" />
          </div>
        )
      },
    },
    { field: 'model', headerName: '아이디', flex: 1 },
    { field: 'price', headerName: '회원명' },
    { field: 'phone', headerName: '휴대폰 번호' },
    { field: 'auth', headerName: '간편인증 ' },
    { field: 'regDate', headerName: '가입일시 ' },
    {
      headerName: '가입일시 ',
      cellRenderer: () => {
        return (
          <div className="filed-select">
            <select name="" id="" className="select-form small">
              <option value="">10</option>
              <option value="">20</option>
              <option value="">30</option>
              <option value="">40</option>
              <option value="">50</option>
            </select>
          </div>
        )
      },
    },
    {
      headerName: '가입일시 ',
      cellRenderer: () => {
        return (
          <div className="filed-btn">
            <button className="btn-form outline grid">변환</button>
          </div>
        )
      },
    },
  ]

  const defaultColDef = {
    sortable: false,
    resizable: false,
    cellStyle: { textAlign: 'center' },
    autoHeight: true,
  }

  return (
    <div className="erp-grid" style={{ width: '100%' }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={colDefs as ColDef<IRow>[]}
        domLayout="autoHeight"
        defaultColDef={defaultColDef}
      />
    </div>
  )
}
