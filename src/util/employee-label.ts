import type { EmployeeTodoSelectItem } from '@/types/employee-todo'

/** 직원 selectbox 라벨 포맷: "이름 (사번)" — 빈 문자열도 fallback 대상 */
export function formatEmployeeLabel(e: Pick<EmployeeTodoSelectItem, 'employeeName' | 'employeeNumber'>): string {
  return `${e.employeeName} (${e.employeeNumber || '사번 미지정'})`
}
