/**
 * 급여 지급일을 월말 클램핑하여 계산
 * salaryDay가 해당 월의 마지막 날보다 큰 경우 마지막 날로 보정
 * 예: salaryDay=31, 2월 → 2025-02-28
 *
 * @param year 연도
 * @param month 월 (1-12)
 * @param salaryDay 급여 지급일
 * @returns YYYY-MM-DD 형식 문자열
 */
export function calculatePaymentDate(year: number, month: number, salaryDay: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(salaryDay, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * YYYYMM 형식 문자열에서 지급일 계산
 * FullTimePayStub에서 사용하는 6자리 형식 전용
 *
 * @param payrollYearMonth YYYYMM 형식 (예: "202502")
 * @param salaryDay 급여 지급일
 * @returns YYYY-MM-DD 형식 문자열, 유효하지 않은 입력이면 빈 문자열
 */
export function calculatePaymentDateFromYearMonth(payrollYearMonth: string, salaryDay: number): string {
  if (!payrollYearMonth || payrollYearMonth.length !== 6) return ''
  const year = parseInt(payrollYearMonth.substring(0, 4), 10)
  const month = parseInt(payrollYearMonth.substring(4, 6), 10)
  return calculatePaymentDate(year, month, salaryDay)
}
