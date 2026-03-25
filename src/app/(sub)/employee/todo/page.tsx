'use client'

import { Suspense } from 'react'
import EmployeeTodoManage from '@/components/employee/todo/EmployeeTodoManage'

export default function EmployeeTodoPage() {
  return (
    <Suspense>
      <EmployeeTodoManage />
    </Suspense>
  )
}
