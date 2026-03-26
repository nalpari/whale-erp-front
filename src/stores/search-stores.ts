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

// ────────────────────────────────────────────
// 아래 스토어들은 filters/appliedFilters 패턴에서 사용
// 구체 타입을 받는 별도 팩토리로 unknown 캐스팅 없이 타입 안전하게 사용
// ────────────────────────────────────────────

import type { StoreSearchFilters } from '@/components/store/manage/StoreSearch'
import type { StoreMenuSearchFilters } from '@/components/master/store-menu/StoreMenuSearch'
import type { PromotionSearchFilters } from '@/components/master/pricing/store-promotion/PromotionSearch'
import type { HolidaySearchFilters } from '@/components/system/holiday/HolidaySearch'
import type { EmployeeTodoSearchFilters } from '@/components/employee/todo/EmployeeTodoSearch'
import type { AttendanceSearchFilters } from '@/components/employee/attendance/AttendanceSearch'
import type { StoreScheduleQuery } from '@/types/work-schedule'
import type { AdminSearchParams } from '@/types/admin'

interface FilterStoreState<T> {
  searchParams: T
  hasSearched: boolean
  setSearchParams: (params: T) => void
  setHasSearched: (value: boolean) => void
  reset: () => void
}

function createFilterStore<T extends object>(defaultParams: T) {
  return create<FilterStoreState<T>>()((set) => ({
    searchParams: { ...defaultParams },
    hasSearched: false,
    setSearchParams: (params) => set({ searchParams: params }),
    setHasSearched: (value) => set({ hasSearched: value }),
    reset: () => set({ searchParams: { ...defaultParams }, hasSearched: false }),
  }))
}

// 점포 관리 (store/manage)
export const useStoreManageSearchStore = createFilterStore<StoreSearchFilters>({
  officeId: null, franchiseId: null, storeId: null, status: 'ALL', from: null, to: null,
})

// 점포별 메뉴 (master/store-menu)
export const useStoreMenuSearchStore = createFilterStore<StoreMenuSearchFilters>({
  officeId: null, storeId: null, menuName: '', operationStatus: 'ALL',
  menuType: 'ALL', menuClassificationCode: '', categoryId: null, from: null, to: null,
})

// 점포별 프로모션 (master/pricing/store-promotion)
export const useStorePromotionSearchStore = createFilterStore<PromotionSearchFilters>({
  officeId: null, franchiseId: null, storeId: null,
  promotionStatus: '', menuName: '', from: null, to: null,
})

// 휴일 관리 (system/holiday)
export const useHolidaySearchStore = createFilterStore<HolidaySearchFilters>({
  year: new Date().getFullYear(), officeId: null, franchiseId: null, storeId: null, holidayType: null,
})

// 직원별 TODO (employee/todo)
export const useEmployeeTodoSearchStore = createFilterStore<EmployeeTodoSearchFilters>({
  officeId: null, franchiseId: null, storeId: null,
  employeeName: '', isCompleted: 'ALL', startDate: '', endDate: '', content: '',
})

// 매장별 근무 계획 (employee/work-status)
export const useWorkScheduleSearchStore = createFilterStore<StoreScheduleQuery>({
  officeId: 0, from: '', to: '',
})

// 출퇴근 관리 (employee/attendance)
export const useAttendanceSearchStore = createFilterStore<AttendanceSearchFilters>({
  officeId: null, franchiseId: null, storeId: null,
  workStatus: 'ALL', employeeName: '', workDays: [],
  employeeClassification: 'ALL', contractClassification: 'ALL',
})

// 관리자 관리 (system/admin)
export const useAdminManageSearchStore = createFilterStore<AdminSearchParams>({})
