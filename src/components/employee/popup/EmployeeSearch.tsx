'use client'

import { useState } from 'react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import { useAlert } from '@/components/common/ui'
import { useEmployeeInfoList } from '@/hooks/queries'
import HeadOfficeFranchiseStoreSelect from '@/components/common/HeadOfficeFranchiseStoreSelect'

type EmployeeRow = {
  id: string
  workerId: number | null
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  status: string
  office: string
  franchise: string
  store: string
  name: string
  contractType: string
  isSelected: boolean
}

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

const getContractTypeLabel = (code?: string | null) => {
  if (code === 'CNTCFWK_001' || code === 'CNTCFWK_002') return '정직원'
  if (code === 'CNTCFWK_003') return '파트타이머'
  return '임시근무'
}

export default function EmployeeSearch({ onClose, onApply }: EmployeeSearchProps) {
  const { alert } = useAlert()
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
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 쿼리 파라미터 (React Compiler 자동 메모이제이션)
  const queryParams = {
    officeId: filters.officeId ?? undefined,
    franchiseId: filters.franchiseId ?? undefined,
    storeId: filters.storeId ?? undefined,
    employeeName: filters.name ? filters.name : undefined,
    page: 0,
    size: 100,
  }
  const { data: employeePage, isPending, error } = useEmployeeInfoList(queryParams, true)

  // 행 데이터 변환 (React Compiler 자동 메모이제이션)
  // memberId가 있는 직원만 선택 가능하도록 필터링 - 가입 요청 상태이고 가입되지 않은 직원들은 보이지 않음
  const rowData: EmployeeRow[] = (employeePage?.content ?? [])
    .filter((employee) => employee.memberId != null)
    .map((employee, index) => {
      const id = `${employee.employeeInfoId ?? ''}-${employee.memberId ?? ''}-${employee.rowNumber ?? index}`
      const workerId = employee.memberId ?? null
      return {
        id,
        workerId,
        status: employee.workStatusName ?? employee.workStatus ?? '',
        office: employee.headOfficeName ?? '',
        franchise: employee.franchiseName ?? '',
        store: employee.storeName ?? '',
        name: employee.employeeName,
        contractType: getContractTypeLabel(employee.contractClassification),
        isSelected: selectedId === id,
      }
    })

  // 필터링된 행 (React Compiler 자동 메모이제이션)
  const filteredRows = rowData.filter((row) => {
    if (filters.status && row.status && !row.status.includes(filters.status)) return false
    return true
  })

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
  // 컬럼 정의 (정적 데이터)
  const columnDefs: ColDef<EmployeeRow>[] = [
    {
      headerName: '선택',
      width: 80,
      cellRenderer: (params: ICellRendererParams<EmployeeRow>) => (
        <div className="radio-form-box">
          <input
            type="radio"
            name="employee-select"
            id={`employee-${params.data?.id}`}
            checked={params.data?.isSelected ?? false}
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
  ]

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

            <div className="search-result-wrap" style={{ marginTop: 12 }}>
              <div className="search-result">
                {isPending
                  ? '검색결과 조회 중'
                  : error
                    ? '검색결과 조회 실패'
                    : `검색결과 ${filteredRows.length}건`}
              </div>
            </div>

            <div
              className="data-list-bx"
              style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto' }}
            >
              {isPending ? (
                <div className="empty-wrap">
                  <div className="empty-data">직원 목록을 불러오는 중입니다.</div>
                </div>
              ) : error ? (
                <div className="empty-wrap">
                  <div className="empty-data">
                    {error instanceof Error ? error.message : '직원 목록을 불러오지 못했습니다.'}
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
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
                onClick={async () => {
                  const selected = rowData.find((row) => row.id === selectedId)
                  if (!selected) {
                    await alert('직원을 선택해주세요.')
                    return
                  }
                  if (!selected.workerId) {
                    await alert('직원 정보가 올바르지 않습니다.')
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
