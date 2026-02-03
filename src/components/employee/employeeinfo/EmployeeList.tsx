'use client'
import '@/components/common/custom-css/FormHelper.css'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import StaffInvitationPop from './StaffInvitationPop'
import type { EmployeeListItem } from '@/types/employee'

// 직원 데이터 타입 (AG Grid 용)
interface EmployeeRowData {
  id: number
  rowNumber: number
  workStatus: string
  memberStatus: string
  headOffice: string
  franchise: string
  store: string
  employeeName: string
  employeeClassification: string
  contractClassification: string
  hireDate: string
  healthCheckExpiry: string
  memo: string
}

// 상태별 스타일 렌더러
const StatusCellRenderer = (params: ICellRendererParams<EmployeeRowData>) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case '근무':
        return 'status-working'
      case '퇴사':
        return 'status-retired'
      case '휴직':
        return 'status-leave'
      default:
        return ''
    }
  }

  return <span className={getStatusClass(params.value)}>{params.value}</span>
}

// 회원 상태 렌더러 (백엔드에서 가입완료/가입요청/가입요청전 반환)
const MemberStatusCellRenderer = (params: ICellRendererParams<EmployeeRowData>) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '가입완료':
        return { color: '#28a745' }
      case '가입요청':
        return { color: '#ffc107' }
      case '가입요청전':
        return { color: '#dc3545' }
      default:
        return {}
    }
  }

  return <span style={getStatusStyle(params.value)}>{params.value}</span>
}

// 직원명 렌더러 (클릭 시 상세 페이지 이동, 메모 hover 툴팁)
const EmployeeNameCellRenderer = (params: ICellRendererParams<EmployeeRowData>) => {
  const [showMemo, setShowMemo] = useState(false)
  const [memoPosition, setMemoPosition] = useState({ x: 0, y: 0 })
  const hasMemo = params.data?.memo && params.data.memo.trim() !== ''
  // typeof window 체크로 SSR 안전하게 처리 (useEffect 대체)
  const isBrowser = typeof window !== 'undefined'

  // 건강진단 만료일이 없거나 지났는지 확인
  const isHealthCheckExpiredOrMissing = () => {
    if (!params.data?.healthCheckExpiry) return true
    const expiryDate = new Date(params.data.healthCheckExpiry)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return expiryDate < today
  }

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (params.data && params.context?.onNavigate) {
      params.context.onNavigate(params.data.id)
    }
  }

  const handleMemoMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMemoPosition({
      x: rect.right + 10,
      y: rect.top + rect.height / 2
    })
    setShowMemo(true)
  }

  const memoTooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: memoPosition.x,
        top: memoPosition.y,
        transform: 'translateY(-50%)',
        background: '#333',
        color: '#fff',
        borderRadius: '6px',
        padding: '10px 14px',
        zIndex: 9999,
        minWidth: '150px',
        maxWidth: '300px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '13px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#aaa' }}>메모</div>
      <div>{params.data?.memo}</div>
      <div
        style={{
          position: 'absolute',
          left: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid #333',
        }}
      />
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', lineHeight: 'normal' }}>
        <button
          type="button"
          className="btn-link"
          onClick={handleClick}
        >
          {params.value}
        </button>
        {hasMemo && (
          <span
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              lineHeight: '1'
            }}
            onMouseEnter={handleMemoMouseEnter}
            onMouseLeave={() => setShowMemo(false)}
            title="메모"
          >
            📋
          </span>
        )}
        {isHealthCheckExpiredOrMissing() && (
          <span style={{ color: '#ffc107', fontSize: '14px', lineHeight: '1' }} title="건강진단 만료 또는 미등록">⚠️</span>
        )}
      </div>
      {isBrowser && showMemo && hasMemo && createPortal(memoTooltipContent, document.body)}
    </>
  )
}

// 더보기 버튼 렌더러 (hover 툴팁 - React Portal 사용)
const ActionCellRenderer = (params: ICellRendererParams<EmployeeRowData>) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  // typeof window 체크로 SSR 안전하게 처리 (useEffect 대체)
  const isBrowser = typeof window !== 'undefined'

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.left - 10,
      y: rect.top + rect.height / 2
    })
    setShowTooltip(true)
  }

  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translate(-100%, -50%)',
        background: '#333',
        color: '#fff',
        borderRadius: '6px',
        padding: '10px 14px',
        zIndex: 9999,
        minWidth: '160px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: '13px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#aaa' }}>입사일:</span>{' '}
        <span style={{ fontWeight: 500 }}>{params.data?.hireDate || '-'}</span>
      </div>
      <div>
        <span style={{ color: '#aaa' }}>건강진단 만료일:</span>{' '}
        <span style={{ fontWeight: 500 }}>{params.data?.healthCheckExpiry || '-'}</span>
      </div>
      <div
        style={{
          position: 'absolute',
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '6px solid #333',
        }}
      />
    </div>
  )

  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span style={{ fontSize: '16px' }}>⋮</span>
      </div>
      {isBrowser && showTooltip && createPortal(tooltipContent, document.body)}
    </>
  )
}

interface EmployeeListProps {
  employees: EmployeeListItem[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
}

export default function EmployeeList({
  employees,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh
}: EmployeeListProps) {
  const router = useRouter()
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // API 응답을 AG Grid 데이터로 변환 (React Compiler가 자동 메모이제이션)
  const rowData: EmployeeRowData[] = employees.map((emp, index) => ({
    id: emp.employeeInfoId,
    rowNumber: index + 1 + currentPage * pageSize,
    workStatus: emp.workStatusName || emp.workStatus || '',
    memberStatus: emp.memberStatus || '',
    headOffice: emp.headOfficeName,
    franchise: emp.franchiseName || '',
    store: emp.storeName || '',
    employeeName: emp.employeeName,
    employeeClassification: emp.employeeClassificationName || emp.employeeClassification || '',
    contractClassification: emp.contractClassificationName || emp.contractClassification || '',
    hireDate: emp.hireDate,
    healthCheckExpiry: emp.healthCheckExpiryDate || '',
    memo: emp.memo || ''
  }))

  // 직원 상세 페이지로 이동
  const handleNavigateToDetail = (id: number) => {
    router.push(`/employee/info/${id}`)
  }

  // 컬럼 정의
  const columnDefs: ColDef<EmployeeRowData>[] = [
    {
      headerName: '#',
      width: 50,
      valueGetter: (params) => params.data?.rowNumber ?? 0,
    },
    {
      headerName: '근무여부',
      field: 'workStatus',
      width: 90,
      cellRenderer: StatusCellRenderer,
    },
    {
      headerName: '직원 회원 상태',
      field: 'memberStatus',
      width: 110,
      cellRenderer: MemberStatusCellRenderer,
    },
    { field: 'headOffice', headerName: '본사', flex: 1 },
    { field: 'franchise', headerName: '가맹점', flex: 1 },
    { field: 'store', headerName: '점포', flex: 1 },
    {
      field: 'employeeName',
      headerName: '직원명',
      width: 120,
      cellRenderer: EmployeeNameCellRenderer,
    },
    { field: 'employeeClassification', headerName: '직원분류', width: 90 },
    { field: 'contractClassification', headerName: '계약분류', width: 90 },
    {
      headerName: '',
      field: 'id',
      width: 50,
      cellRenderer: ActionCellRenderer,
      sortable: false,
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={() => setIsPopupOpen(true)} type="button">
            등록
          </button>
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
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
      <StaffInvitationPop
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  )
}
