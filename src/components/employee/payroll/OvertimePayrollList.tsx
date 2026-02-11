'use client'
import '@/components/common/custom-css/FormHelper.css'
import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { useSendOvertimePayrollEmail } from '@/hooks/queries/use-payroll-queries'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import { useMemo } from 'react'

// 연장근무 수당명세서 데이터 타입
interface OvertimePayrollRowData {
  id: number
  rowNumber: number
  workStatus: string
  headOffice: string
  franchise: string
  store: string
  employeeName: string
  employeeClassification: string
  workDays: string
  payrollDate: string
  registrationDate: string
  emailStatus: string
}

// 상태별 스타일 렌더러
const StatusCellRenderer = (params: ICellRendererParams<OvertimePayrollRowData>) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case '근무':
      case 'EMPWK_001':
        return 'status-working'
      case '퇴사':
      case 'EMPWK_003':
        return 'status-retired'
      case '휴직':
      case 'EMPWK_002':
        return 'status-leave'
      default:
        return ''
    }
  }

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'EMPWK_001':
        return '근무'
      case 'EMPWK_003':
        return '퇴사'
      case 'EMPWK_002':
        return '휴직'
      default:
        return status
    }
  }

  return <span className={getStatusClass(params.value)}>{getDisplayStatus(params.value)}</span>
}

interface OvertimePayrollListProps {
  payrolls: OvertimePayrollRowData[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
}

export default function OvertimePayrollList({
  payrolls,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh
}: OvertimePayrollListProps) {
  const router = useRouter()
  const sendEmailMutation = useSendOvertimePayrollEmail()
  const { alert, confirm } = useAlert()

  // React 19: derived state
  const rowData = payrolls.map((payroll, index) => ({
    ...payroll,
    rowNumber: index + 1 + currentPage * pageSize
  }))

  // 페이지 크기 선택 옵션
  const pageSizeOptions: SelectOption[] = useMemo(() => [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
  ], [])

  // 상세 페이지로 이동
  const handleNavigateToDetail = (id: number) => {
    router.push(`/employee/payroll/overtime/${id}`)
  }

  // 신규 등록 페이지로 이동
  const handleNavigateToNew = () => {
    router.push('/employee/payroll/overtime/new')
  }

  // 이메일 전송 핸들러
  const handleSendEmail = async (id: number, employeeName: string) => {
    if (!(await confirm(`${employeeName}님에게 수당명세서를 이메일로 전송하시겠습니까?`))) return

    try {
      await sendEmailMutation.mutateAsync(id)
      await alert('이메일 전송이 완료되었습니다.')
      onRefresh?.()
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      await alert('이메일 전송에 실패했습니다.')
    }
  }

  // 직원명 렌더러 - 클로저로 핸들러 접근
  const EmployeeNameCellRenderer = (params: ICellRendererParams<OvertimePayrollRowData>) => {
    return (
      <button
        type="button"
        className="btn-link"
        onClick={(e) => {
          e.stopPropagation()
          if (params.data) handleNavigateToDetail(params.data.id)
        }}
      >
        {params.value}
      </button>
    )
  }

  // 이메일 전송 상태 렌더러 - 클로저로 핸들러 접근
  const EmailStatusCellRenderer = (params: ICellRendererParams<OvertimePayrollRowData>) => {
    if (params.value === '전송 완료') {
      return <span style={{ color: '#666' }}>전송 완료</span>
    }
    return (
      <button
        className="btn-form basic s"
        style={{
          height: '28px',
          padding: '0 12px',
          fontSize: '13px',
          lineHeight: '28px'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (params.data) handleSendEmail(params.data.id, params.data.employeeName)
        }}
      >
        이메일 전송
      </button>
    )
  }

  // 컬럼 정의
  const columnDefs: ColDef<OvertimePayrollRowData>[] = [
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
    { field: 'headOffice', headerName: '본사', flex: 1 },
    { field: 'franchise', headerName: '가맹점', flex: 1 },
    { field: 'store', headerName: '점포', flex: 1 },
    {
      field: 'employeeName',
      headerName: '직원명',
      width: 120,
      cellRenderer: EmployeeNameCellRenderer,
    },
    { field: 'employeeClassification', headerName: '직원 분류', width: 90 },
    { field: 'workDays', headerName: '근무요일', width: 90 },
    { field: 'payrollDate', headerName: '급여일', width: 100 },
    { field: 'registrationDate', headerName: '등록일', width: 100 },
    {
      headerName: '수당명세서',
      field: 'emailStatus',
      width: 110,
      cellRenderer: EmailStatusCellRenderer,
      sortable: false,
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <button className="btn-form basic" onClick={handleNavigateToNew} type="button">등록</button>
          <div className="data-count-select">
            <SearchSelect
              options={pageSizeOptions}
              value={pageSizeOptions.find(o => o.value === String(pageSize)) || null}
              onChange={(opt) => onPageSizeChange(Number(opt?.value || '50'))}
              placeholder="선택"
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
              // 이메일 전송 버튼 클릭 시 상세 페이지로 이동하지 않음
              const target = event.event?.target as HTMLElement
              if (target?.closest('button')) return
              if (event.data) handleNavigateToDetail(event.data.id)
            }}
          />
        )}
        {!isLoading && rowData.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
