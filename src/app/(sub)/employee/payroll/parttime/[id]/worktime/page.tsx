'use client'
import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import PartTimeWorkTimeEdit from '@/components/employee/payroll/PartTimeWorkTimeEdit'
import { useDailyWorkHours } from '@/hooks/queries/use-payroll-queries'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function PartTimeWorkTimeEditPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()

  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const employeeInfoId = searchParams.get('employeeInfoId') || ''
  const payrollMonth = searchParams.get('payrollMonth') || ''
  const returnToDetail = searchParams.get('returnToDetail') === 'true'
  const headOfficeId = searchParams.get('headOfficeId') || ''
  const franchiseId = searchParams.get('franchiseId') || ''

  // 쿼리 활성 조건: 필수 파라미터가 모두 있을 때만 fetch
  const isQueryEnabled = !!startDate && !!endDate && !!employeeInfoId
  const { data: initialPayrollData, isPending } = useDailyWorkHours(
    {
      employeeInfoId: parseInt(employeeInfoId) || 0,
      startDate,
      endDate,
      headOfficeId: parseInt(headOfficeId) || undefined,
      franchiseId: parseInt(franchiseId) || undefined,
    },
    isQueryEnabled,
  )

  return (
    <>
      <Location
        title="파트타이머 근무시간 수정"
        list={['홈', '직원 관리', '급여 명세서', '파트타이머 급여명세서', '근무시간 수정']}
      />
      {isQueryEnabled && isPending ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          데이터를 불러오는 중...
        </div>
      ) : (
        // key prop: employeeInfoId·startDate·endDate 변경 시 컴포넌트 리마운트
        // → PartTimeWorkTimeEdit 내부에서 useEffect+setState 없이 lazy useState로 초기화 가능
        <PartTimeWorkTimeEdit
          key={`${employeeInfoId}-${startDate}-${endDate}`}
          id={id}
          startDate={startDate}
          endDate={endDate}
          employeeInfoId={employeeInfoId}
          payrollMonth={payrollMonth}
          returnToDetail={returnToDetail}
          headOfficeId={headOfficeId}
          franchiseId={franchiseId}
          initialPayrollData={initialPayrollData ?? null}
        />
      )}
    </>
  )
}
