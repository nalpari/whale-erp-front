import type { EmployeeTodoSelectItem } from '@/types/employee-todo'

/** 직원 selectbox 라벨 포맷: "이름 (사번)" */
export function formatEmployeeLabel(e: EmployeeTodoSelectItem): string {
  return `${e.employeeName} (${e.employeeNumber || '사번 미지정'})`
}
