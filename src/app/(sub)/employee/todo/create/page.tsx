'use client'

import { useBpHeadOfficeTree } from '@/hooks/queries'
import EmployeeTodoForm from '@/components/employee/todo/EmployeeTodoForm'

export default function EmployeeTodoCreatePage() {
  // bpTree 로딩 완료 시 key 변경으로 Form 리마운트 → initialForm에 본사 자동 반영
  const { data: bpTree = [] } = useBpHeadOfficeTree()

  return <EmployeeTodoForm key={bpTree.length} />
}
