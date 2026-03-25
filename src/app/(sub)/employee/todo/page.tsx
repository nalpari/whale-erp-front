'use client'

import { Suspense } from 'react'
import EmployeeTodoManage from '@/components/employee/todo/EmployeeTodoManage'
import CubeLoader from '@/components/common/ui/CubeLoader'

export default function EmployeeTodoPage() {
  return (
    <Suspense fallback={<div className="cube-loader-overlay"><CubeLoader /></div>}>
      <EmployeeTodoManage />
    </Suspense>
  )
}
