'use client'
import '@/components/common/custom-css/FormHelper.css'
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

// 근로 계약 데이터 타입 (AG Grid 용)
export interface EmployContractRowData {
  id: number
  workStatus: string
  contractStatus: string
  electronicContract: string
  headOffice: string
  franchise: string
  store: string
  employeeName: string
  contractClassification: string
  workDays: string
  employeeClassification?: string
  salaryDay?: string
  contractDate?: string
  contractEndDate?: string
}

// 내부용 타입 (rowNumber 포함)
interface EmployContractRowDataInternal extends EmployContractRowData {
  rowNumber: number
}

// 근무여부 렌더러
const WorkStatusCellRenderer = (params: ICellRendererParams<EmployContractRowDataInternal>) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case '근무':
      case 'WORKING':
        return 'status-working'
      case '퇴사':
      case 'RETIRED':
        return 'status-retired'
      case '휴직':
      case 'LEAVE':
        return 'status-leave'
      default:
        return ''
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'WORKING':
        return '근무'
      case 'RETIRED':
        return '퇴사'
      case 'LEAVE':
        return '휴직'
      default:
        return status
    }
  }

  return <span className={getStatusClass(params.value)}>{getDisplayStatus(params.value)}</span>
}

// 계약상태 렌더러
const ContractStatusCellRenderer = (params: ICellRendererParams<EmployContractRowDataInternal>) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '작성중':
      case 'drafting':
        return { color: '#ffc107', fontWeight: 'bold' }
      case '진행중':
      case 'in_progress':
        return { color: '#007bff', fontWeight: 'bold' }
      case '계약완료':
      case 'completed':
        return { color: '#28a745', fontWeight: 'bold' }
      default:
        return {}
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'drafting':
        return '작성중'
      case 'in_progress':
        return '진행중'
      case 'completed':
        return '계약완료'
      default:
        return status
    }
  }

  return <span style={getStatusStyle(params.value)}>{getDisplayStatus(params.value)}</span>
}

// 직원명 렌더러 (클릭 시 상세 페이지 이동 + 경고 아이콘)
const EmployeeNameCellRenderer = (params: ICellRendererParams<EmployContractRowDataInternal>) => {
  // 계약종료일이 지난 경우에만 느낌표 표시
  const isContractExpired = (() => {
    if (!params.data?.contractEndDate) return false
    if (params.data.contractEndDate === '2999-12-31') return false
    const endDate = new Date(params.data.contractEndDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  })()

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (params.data && params.context?.onNavigate) {
      params.context.onNavigate(params.data.id)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', lineHeight: 'normal' }}>
      <button
        type="button"
        className="btn-link"
        onClick={handleClick}
      >
        {params.value}
      </button>
      {isContractExpired && <span style={{ color: '#dc3545', fontSize: '14px', lineHeight: '1' }}>!</span>}
    </div>
  )
}

// 더보기 버튼 렌더러 (hover 툴팁 - React Portal 사용)
const ActionCellRenderer = (params: ICellRendererParams<EmployContractRowDataInternal>) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

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
        <span style={{ color: '#aaa' }}>계약 분류:</span>{' '}
        <span style={{ fontWeight: 500 }}>{params.data?.employeeClassification || '본사 직원'}</span>
      </div>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#aaa' }}>급여일:</span>{' '}
        <span style={{ fontWeight: 500 }}>{params.data?.salaryDay || '-'}</span>
      </div>
      <div>
        <span style={{ color: '#aaa' }}>계약일:</span>{' '}
        <span style={{ fontWeight: 500 }}>{params.data?.contractDate || '-'}</span>
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
        role="button"
        tabIndex={0}
        aria-label="상세 정보 보기"
      >
        <span style={{ fontSize: '16px' }}>⋮</span>
      </div>
      {typeof document !== 'undefined' && showTooltip && createPortal(tooltipContent, document.body)}
    </>
  )
}

interface EmployContractListProps {
  contracts?: EmployContractRowData[]
  isLoading?: boolean
  currentPage?: number
  totalPages?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRegister?: () => void
}

export default function EmployContractList({
  contracts = [],
  isLoading = false,
  currentPage = 0,
  totalPages = 0,
  pageSize = 50,
  onPageChange,
  onPageSizeChange,
  onRegister
}: EmployContractListProps) {
  const router = useRouter()

  // 페이지 사이즈 옵션
  const pageSizeOptions: SelectOption[] = useMemo(() => [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' }
  ], [])

  // 행 번호 추가 - React 19: 단순 계산은 직접 수행 (React Compiler가 최적화)
  const rowData = contracts.map((contract, index) => ({
    ...contract,
    rowNumber: index + 1 + currentPage * pageSize
  }))

  // 근로 계약 상세 페이지로 이동
  const handleNavigateToDetail = (id: number) => {
    router.push(`/employee/contract/${id}`)
  }

  // 컬럼 정의
  const columnDefs: ColDef<EmployContractRowDataInternal>[] = [
    {
      headerName: '#',
      width: 50,
      valueGetter: (params) => params.data?.rowNumber ?? 0,
    },
    {
      headerName: '근무여부',
      field: 'workStatus',
      width: 90,
      cellRenderer: WorkStatusCellRenderer,
    },
    {
      headerName: '계약 상태',
      field: 'contractStatus',
      width: 90,
      cellRenderer: ContractStatusCellRenderer,
    },
    { headerName: '전자계약', field: 'electronicContract', width: 90 },
    { field: 'headOffice', headerName: '본사', flex: 1 },
    { field: 'franchise', headerName: '가맹점', flex: 1 },
    { field: 'store', headerName: '점포', flex: 1 },
    {
      field: 'employeeName',
      headerName: '직원명',
      width: 120,
      cellRenderer: EmployeeNameCellRenderer,
    },
    { field: 'contractClassification', headerName: '계약분류', width: 90 },
    { field: 'workDays', headerName: '근무요일', width: 90 },
    {
      headerName: '',
      field: 'id',
      width: 50,
      cellRenderer: ActionCellRenderer,
      sortable: false,
    },
  ]

  const handlePageSizeChangeInternal = (size: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(size)
    }
  }

  const handlePageChangeInternal = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={onRegister} type="button">
            등록
          </button>
          <div className="data-count-select">
            <SearchSelect
              options={pageSizeOptions}
              value={pageSizeOptions.find(opt => opt.value === String(pageSize)) || null}
              onChange={(opt) => handlePageSizeChangeInternal(opt?.value ? Number(opt.value) : 50)}
              placeholder="50"
              isClearable={false}
              isSearchable={false}
            />
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
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChangeInternal} />
        )}
      </div>
    </div>
  )
}
