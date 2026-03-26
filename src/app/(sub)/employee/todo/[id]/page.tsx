'use client'

import { useParams } from 'next/navigation'
import CubeLoader from '@/components/common/ui/CubeLoader'
import Location from '@/components/ui/Location'
import EmployeeTodoForm from '@/components/employee/todo/EmployeeTodoForm'
import { useEmployeeTodoDetail } from '@/hooks/queries'
import { useQueryError } from '@/hooks/useQueryError'

const BREADCRUMBS = ['Home', '직원 관리', '직원별 TO-DO 관리']

export default function EmployeeTodoDetailPage() {
  const params = useParams()
  const parsed = params.id ? Number(params.id) : NaN
  const id = Number.isNaN(parsed) ? undefined : parsed

  // detail 로딩 완료 후에만 Form 렌더링 → useState 초기값에 detail 반영 보장
  const { isPending, error } = useEmployeeTodoDetail(id ?? null)
  const errorMessage = useQueryError(error)

  if (isPending) {
    return (
      <div className="data-wrap">
        <Location title="TO-DO 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="data-wrap">
        <Location title="TO-DO 관리" list={BREADCRUMBS} />
        <div className="warning-txt">{errorMessage}</div>
      </div>
    )
  }

  return <EmployeeTodoForm key={id} todoId={id} />
}
