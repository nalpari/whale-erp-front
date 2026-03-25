'use client'

import { useParams } from 'next/navigation'
import EmployeeTodoForm from '@/components/employee/todo/EmployeeTodoForm'

export default function EmployeeTodoDetailPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined

  return <EmployeeTodoForm key={id} todoId={id} />
}
