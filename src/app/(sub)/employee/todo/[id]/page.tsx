'use client'

import { useParams } from 'next/navigation'
import EmployeeTodoForm from '@/components/employee/todo/EmployeeTodoForm'

export default function EmployeeTodoDetailPage() {
  const params = useParams()
  const parsed = params.id ? Number(params.id) : NaN
  const id = Number.isNaN(parsed) ? undefined : parsed

  return <EmployeeTodoForm key={id} todoId={id} />
}
