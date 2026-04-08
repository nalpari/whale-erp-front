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

function parsePayrollYearMonth(payrollYearMonth: string): { year: number; month: number } | null {
  if (!payrollYearMonth) return null

  const normalized = payrollYearMonth.replace('-', '')
  if (normalized.length !== 6) return null

  const year = parseInt(normalized.substring(0, 4), 10)
  const month = parseInt(normalized.substring(4, 6), 10)

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export interface PayrollPeriod {
  startDate: string
  endDate: string
  paymentDate: string
}

/**
 * 급여 계약의 지급 기준(당월/익월)과 지급일에 따라 자동 정산 기간을 계산한다.
 *
 * - 익월(SLRCF_002): 지난달 1일 ~ 지난달 말일
 * - 당월(SLRCF_001): 지난 지급일 ~ 이번 지급일 - 1일
 */
export function calculatePayrollPeriod(
  payrollYearMonth: string,
  salaryMonth: string,
  salaryDay: number
): PayrollPeriod {
  const parsed = parsePayrollYearMonth(payrollYearMonth)
  if (!parsed) {
    return { startDate: '', endDate: '', paymentDate: '' }
  }

  const { year, month } = parsed
  const paymentDate = calculatePaymentDate(year, month, salaryDay)

  if (salaryMonth === 'SLRCF_002') {
    const settlementMonth = month === 1 ? 12 : month - 1
    const settlementYear = month === 1 ? year - 1 : year
    const lastDay = new Date(settlementYear, settlementMonth, 0).getDate()

    return {
      startDate: `${settlementYear}-${String(settlementMonth).padStart(2, '0')}-01`,
      endDate: `${settlementYear}-${String(settlementMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
      paymentDate,
    }
  }

  const previousMonth = month === 1 ? 12 : month - 1
  const previousYear = month === 1 ? year - 1 : year
  const previousPaymentDate = calculatePaymentDate(previousYear, previousMonth, salaryDay)
  const endDateValue = new Date(year, month - 1, Math.min(salaryDay, new Date(year, month, 0).getDate()))
  endDateValue.setDate(endDateValue.getDate() - 1)

  return {
    startDate: previousPaymentDate,
    endDate: formatDate(endDateValue),
    paymentDate,
  }
}
