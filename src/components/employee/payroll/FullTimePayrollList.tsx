'use client'
import '@/components/common/custom-css/FormHelper.css'
import { useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import { useUploadFullTimePayrollExcel, useSendFullTimePayrollEmail } from '@/hooks/queries/use-payroll-queries'
import { useAlert } from '@/components/common/ui'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'

// 급여명세서 데이터 타입
interface PayrollRowData {
  id: number
  rowNumber: number
  workStatus: string
  headOffice: string
  franchise: string
  store: string
  employeeName: string
  employeeClassification: string
  payrollDate: string
  registrationDate: string
  emailStatus: string
}

// 상태별 스타일 렌더러
const StatusCellRenderer = (params: ICellRendererParams<PayrollRowData>) => {
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


interface FullTimePayrollListProps {
  payrolls: PayrollRowData[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
}

export default function FullTimePayrollList({
  payrolls,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh
}: FullTimePayrollListProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showYearMonthModal, setShowYearMonthModal] = useState(false)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)
  const [duplicateEmployees, setDuplicateEmployees] = useState<{ employeeNumber: string; employeeName: string }[]>([])
  const [payrollYearMonth, setPayrollYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  // TanStack Query mutations
  const uploadMutation = useUploadFullTimePayrollExcel()
  const sendEmailMutation = useSendFullTimePayrollEmail()

  // PageSize select options
  const pageSizeOptions: SelectOption[] = useMemo(() => [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
  ], [])

  // React 19: derived state
  const rowData = payrolls.map((payroll, index) => ({
    ...payroll,
    rowNumber: index + 1 + currentPage * pageSize
  }))

  // 상세 페이지로 이동
  const handleNavigateToDetail = (id: number) => {
    router.push(`/employee/payroll/regular/${id}`)
  }

  // 신규 등록 페이지로 이동
  const handleNavigateToNew = () => {
    router.push('/employee/payroll/regular/new')
  }

  // 엑셀 업로드 버튼 클릭
  const handleExcelUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 엑셀 파일 선택 시 모달 표시
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validExtensions = ['.xlsx', '.xls']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!validExtensions.includes(fileExtension)) {
      await alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      e.target.value = ''
      return
    }

    setPendingFile(file)
    setShowYearMonthModal(true)
    e.target.value = ''
  }

  // 급여년월 확인 후 업로드
  const handleConfirmUpload = async (overwrite: boolean = false) => {
    if (!pendingFile) return

    setShowYearMonthModal(false)
    setShowOverwriteModal(false)
    try {
      const formattedYearMonth = payrollYearMonth.replace('-', '')
      const response = await uploadMutation.mutateAsync({
        file: pendingFile,
        payrollYearMonth: formattedYearMonth,
        overwrite
      })

      if (response.hasDuplicates && !overwrite) {
        setDuplicateEmployees(response.duplicateEmployees)
        setShowOverwriteModal(true)
        return
      }

      if (response.successCount > 0) {
        await alert(`엑셀 업로드가 완료되었습니다.\n성공: ${response.successCount}건`)
        onRefresh?.()
      }

      if (response.failedCount > 0) {
        const failureMessages = response.failures
          .map(f => `행 ${f.rowNumber}: ${f.errorMessage}`)
          .join('\n')
        await alert(`일부 데이터 업로드 실패:\n${failureMessages}`)
      }

      setPendingFile(null)
    } catch (error) {
      console.error('엑셀 업로드 실패:', error)
      await alert('엑셀 업로드에 실패했습니다.')
      setPendingFile(null)
    }
  }

  const handleConfirmOverwrite = () => {
    handleConfirmUpload(true)
  }

  const handleCancelOverwrite = () => {
    setShowOverwriteModal(false)
    setDuplicateEmployees([])
    setPendingFile(null)
  }

  const handleCancelUpload = () => {
    setShowYearMonthModal(false)
    setPendingFile(null)
  }

  // 이메일 전송 핸들러
  const handleSendEmail = async (id: number, employeeName: string) => {
    if (!(await confirm(`${employeeName}님에게 급여명세서를 이메일로 전송하시겠습니까?`))) return

    try {
      await sendEmailMutation.mutateAsync(id)
      await alert('이메일 전송이 완료되었습니다.')
      onRefresh?.()
    } catch (error) {
      console.error('이메일 전송 실패:', error)
      await alert('이메일 전송에 실패했습니다.')
    }
  }

  // 직원명 렌더러 (클릭 시 상세 페이지 이동) - 클로저로 핸들러 접근
  const EmployeeNameCellRenderer = (params: ICellRendererParams<PayrollRowData>) => {
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
  const EmailStatusCellRenderer = (params: ICellRendererParams<PayrollRowData>) => {
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
  const columnDefs: ColDef<PayrollRowData>[] = [
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
    { field: 'employeeClassification', headerName: '직원분류', width: 90 },
    { field: 'payrollDate', headerName: '급여일', width: 100 },
    { field: 'registrationDate', headerName: '등록일', width: 100 },
    {
      headerName: '급여명세서',
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
          />
          <button
            className="btn-form basic"
            onClick={handleExcelUploadClick}
            disabled={uploadMutation.isPending}
            type="button"
          >
            {uploadMutation.isPending ? '업로드 중...' : '엑셀 업로드'}
          </button>
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

      {/* 급여년월 선택 모달 */}
      {showYearMonthModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '320px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              급여년월 선택
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#666' }}>
              업로드할 급여명세서의 급여년월을 선택해주세요.
            </p>
            <input
              type="month"
              className="input-form"
              value={payrollYearMonth}
              onChange={(e) => setPayrollYearMonth(e.target.value)}
              style={{ width: '100%', marginBottom: '20px', padding: '10px', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-form gray" onClick={handleCancelUpload} type="button">
                취소
              </button>
              <button className="btn-form basic" onClick={() => handleConfirmUpload(false)} type="button">
                업로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 덮어쓰기 확인 모달 */}
      {showOverwriteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: '#e74c3c' }}>
              중복 데이터 발견
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
              다음 직원의 {payrollYearMonth.replace('-', '년 ')}월 급여명세서가 이미 존재합니다.
            </p>
            <div
              style={{
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                maxHeight: '150px',
                overflowY: 'auto'
              }}
            >
              {duplicateEmployees.map((emp, index) => (
                <div key={index} style={{ fontSize: '13px', padding: '4px 0' }}>
                  {emp.employeeName} ({emp.employeeNumber})
                </div>
              ))}
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#e74c3c', fontWeight: 500 }}>
              기존 데이터를 새로운 엑셀 내용으로 덮어쓰시겠습니까?
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button className="btn-form gray" onClick={handleCancelOverwrite} type="button">
                취소
              </button>
              <button
                className="btn-form basic"
                onClick={handleConfirmOverwrite}
                style={{ backgroundColor: '#e74c3c', borderColor: '#e74c3c' }}
                type="button"
              >
                덮어쓰기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
