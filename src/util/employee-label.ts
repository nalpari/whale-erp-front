import type { EmployeeTodoSelectItem } from '@/types/employee-todo'
import type { SelectOption } from '@/components/ui/common/SearchSelect'

/** 직원 selectbox 라벨 포맷: "이름 (사번)" — 빈 문자열도 fallback 대상 */
export function formatEmployeeLabel(e: Pick<EmployeeTodoSelectItem, 'employeeName' | 'employeeNumber'>): string {
  return `${e.employeeName} (${e.employeeNumber || '사번 미지정'})`
}

/**
 * SearchSelect onChange에서 직원 이름을 안전하게 추출.
 * - null(클리어) → 빈 문자열
 * - __isNew__(자유 입력) → 입력값 그대로
 * - 목록 선택 → employeeList에서 ID 조회 후 employeeName 반환, 못 찾으면 label fallback
 */
export function resolveEmployeeName(
  option: SelectOption | null,
  employeeList: EmployeeTodoSelectItem[] | undefined,
): string {
  if (!option) return ''
  if (option.__isNew__) return option.value
  const emp = employeeList?.find((e) => String(e.employeeInfoId) === option.value)
  return emp?.employeeName ?? option.label
}
