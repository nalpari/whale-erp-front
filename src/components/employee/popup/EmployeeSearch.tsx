'use client'

import { useMemo, useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'

type EmployeeRow = {
  id: number
  workerId: number
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  status: string
  office: string
  franchise: string
  store: string
  name: string
  contractType: string
}

const EMPLOYEES: EmployeeRow[] = [
  {
    id: 1,
    workerId: 1,
    status: '근무',
    office: '따름인',
    franchise: '을지로1가점',
    store: '을지로1가점',
    name: '관리자',
    contractType: '정직원',
  },
  {
    id: 2,
    workerId: 2,
    status: '근무',
    office: '따름인',
    franchise: '을지로2가점',
    store: '을지로2가점',
    name: '본사 마스터',
    contractType: '정직원',
  },
  {
    id: 3,
    workerId: 3,
    status: '근무',
    office: '따름인',
    franchise: '을지로3가점',
    store: '을지로3가점',
    name: '가맹점 마스터',
    contractType: '파트타이머',
  },
  {
    id: 4,
    workerId: 4,
    status: '휴직',
    office: '따름인',
    franchise: '을지로3가점',
    store: '을지로3가점',
    name: '일반사용자',
    contractType: '파트타이머',
  }
]

type EmploymentStatus = '근무' | '휴직' | '퇴사'

type SearchForm = {
  officeId: number | null
  franchiseId: number | null
  storeId: number | null
  status: EmploymentStatus
  name: string
}

type EmployeeSearchProps = {
  onClose: () => void
  onApply: (employee: { workerId: number; workerName: string; contractType: string }) => void
}

export default function EmployeeSearch({ onClose, onApply }: EmployeeSearchProps) {
  const [form, setForm] = useState<SearchForm>({
    officeId: null,
    franchiseId: null,
    storeId: null,
    status: '근무',
    name: '',
  })
  const [filters, setFilters] = useState<SearchForm>({
    officeId: null,
    franchiseId: null,
    storeId: null,
    status: '근무',
    name: '',
  })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const rowData = useMemo(() => EMPLOYEES, [])
  const filteredRows = useMemo(() => {
    return rowData.filter((row) => {
      if (filters.status && row.status !== filters.status) return false
      if (filters.name && !row.name.includes(filters.name)) return false
      if (filters.officeId && row.officeId && row.officeId !== filters.officeId) return false
      if (filters.franchiseId && row.franchiseId && row.franchiseId !== filters.franchiseId) return false
      if (filters.storeId && row.storeId && row.storeId !== filters.storeId) return false
      return true
    })
  }, [filters, rowData])

  const handleSearch = () => {
    setFilters(form)
  }

  const handleReset = () => {
    const nextForm: SearchForm = {
      officeId: null,
      franchiseId: null,
      storeId: null,
      status: '근무',
      name: '',
    }
    setForm(nextForm)
    setFilters(nextForm)
    setSelectedId(null)
  }
  const columnDefs = useMemo<ColDef<EmployeeRow>[]>(
    () => [
      {
        headerName: '선택',
        width: 80,
        cellRenderer: (params: ICellRendererParams<EmployeeRow>) => (
          <div className="radio-form-box">
            <input
              type="radio"
              name="employee-select"
              id={`employee-${params.data?.id}`}
              checked={selectedId === params.data?.id}
              onChange={() => setSelectedId(params.data?.id ?? null)}
            />
            <label htmlFor={`employee-${params.data?.id}`}></label>
          </div>
        ),
      },
      { field: 'status', headerName: '운영여부', width: 120 },
      { field: 'office', headerName: '본사', width: 180 },
      { field: 'franchise', headerName: '가맹점', width: 180 },
      { field: 'store', headerName: '점포', width: 180 },
      { field: 'name', headerName: '직원명', flex: 1 },
    ],
    [selectedId]
  )

  return (
    <div className="modal-popup">
      <div className="modal-dialog xl">
        <div className="modal-content">
          <div className="modal-header">
            <h2>직원 검색</h2>
            <button className="modal-close" aria-label="닫기" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="search-filed">
              <table className="default-table">
                <colgroup>
                  <col width="120px" />
                  <col />
                  <col width="120px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <HeadOfficeFranchiseStoreSelect
                      officeId={form.officeId}
                      franchiseId={form.franchiseId}
                      storeId={form.storeId}
                      fields={['office', 'franchise']}
                      onChange={(next) => {
                        setForm((prev) => ({
                          ...prev,
                          officeId: next.head_office,
                          franchiseId: next.franchise,
                          storeId: next.store,
                        }))
                      }}
                    />
                  </tr>
                  <tr>
                    <HeadOfficeFranchiseStoreSelect
                      officeId={form.officeId}
                      franchiseId={form.franchiseId}
                      storeId={form.storeId}
                      fields={['store']}
                      onChange={(next) => {
                        setForm((prev) => ({
                          ...prev,
                          officeId: next.head_office,
                          franchiseId: next.franchise,
                          storeId: next.store,
                        }))
                      }}
                    />
                    <th>근무여부</th>
                    <td>
                      <div className="filed-check-flx">
                        {(['근무', '휴직', '퇴사'] as EmploymentStatus[]).map((item) => (
                          <div key={item} className="radio-form-box">
                            <input
                              type="radio"
                              name="employment-status"
                              id={`status-${item}`}
                              checked={form.status === item}
                              onChange={() => setForm((prev) => ({ ...prev, status: item }))}
                            />
                            <label htmlFor={`status-${item}`}>{item}</label>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>직원명</th>
                    <td>
                      <input
                        className="input-frame"
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                      />
                    </td>
                    <th></th>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              <div className="btn-filed">
                <button className="btn-form gray" onClick={handleReset}>초기화</button>
                <button className="btn-form basic" onClick={handleSearch}>검색</button>
              </div>
            </div>

            <div className="searh-result-wrap" style={{ marginTop: 12 }}>
              <div className="search-result">검색결과 {filteredRows.length}건</div>
            </div>

            <div
              className="data-list-bx"
              style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto' }}
            >
              {filteredRows.length === 0 ? (
                <div className="empty-wrap">
                  <div className="empty-data">검색 결과 없습니다</div>
                </div>
              ) : (
                <AgGrid
                  rowData={filteredRows}
                  columnDefs={columnDefs}
                  onRowClicked={(event) => setSelectedId(event.data?.id ?? null)}
                />
              )}
            </div>

            <div className="pop-btn-content" style={{ marginTop: 16 }}>
              <button className="btn-form gray" onClick={onClose}>닫기</button>
              <button
                className="btn-form basic"
                onClick={() => {
                  const selected = rowData.find((row) => row.id === selectedId)
                  if (!selected) {
                    alert('직원을 선택해주세요.')
                    return
                  }
                  onApply({
                    workerId: selected.workerId,
                    workerName: selected.name,
                    contractType: selected.contractType,
                  })
                }}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
