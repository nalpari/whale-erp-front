import { create } from 'zustand'

interface SearchState<T extends Record<string, unknown>> {
  searchParams: T
  page: number
  pageSize: number
  hasSearched: boolean

  setSearchParams: (params: T) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setHasSearched: (value: boolean) => void
  reset: (defaultSize?: number) => void
}

function createSearchStore<T extends Record<string, unknown>>(initialParams: T) {
  return create<SearchState<T>>()((set) => ({
    searchParams: { ...initialParams },
    page: 0,
    pageSize: 50,
    hasSearched: false,

    setSearchParams: (params) => set({ searchParams: params }),
    setPage: (page) => set({ page }),
    setPageSize: (size) => set({ pageSize: size, page: 0 }),
    setHasSearched: (value) => set({ hasSearched: value }),
    reset: (defaultSize) =>
      set((state) => ({
        searchParams: { ...initialParams },
        page: 0,
        pageSize: defaultSize ?? state.pageSize,
        hasSearched: false,
      })),
  }))
}

// 회원 관리 (master/customer/account)
export const useCustomerSearchStore = createSearchStore<Record<string, unknown>>({})

// 직원 정보 관리 (employee/info)
export const useEmployeeInfoSearchStore = createSearchStore<Record<string, unknown>>({})

// 근로 계약 관리 (employee/contract)
export const useEmployContractSearchStore = createSearchStore<Record<string, unknown>>({})

// 정직원 급여명세서 (employee/payroll/regular)
export const useFullTimePayrollSearchStore = createSearchStore<Record<string, unknown>>({})

// 파트타이머 급여명세서 (employee/payroll/parttime)
export const usePartTimePayrollSearchStore = createSearchStore<Record<string, unknown>>({})

// 연장근무 수당명세서 (employee/payroll/overtime)
export const useOvertimePayrollSearchStore = createSearchStore<Record<string, unknown>>({})
