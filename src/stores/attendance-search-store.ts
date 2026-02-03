import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AttendanceSearchFilters } from '@/components/employee/attendance/AttendanceSearch'

/**
 * 근태 기록 검색 조건 기본값.
 * - 모든 필터는 초기값으로 시작
 */
export const defaultAttendanceSearchFilters: AttendanceSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  workStatus: 'ALL',
  employeeName: '',
  workDays: [],
  employeeClassification: 'ALL',
  contractClassification: 'ALL',
}

/**
 * 근태 기록 화면 전용 상태 저장소.
 * - filters: 입력 중인 값
 * - appliedFilters: 실제 조회에 적용된 값
 * - page/pageSize: 페이징 상태
 * - hydrated: persist 복원 완료 여부
 */
export type AttendanceSearchState = {
  filters: AttendanceSearchFilters
  appliedFilters: AttendanceSearchFilters
  page: number
  pageSize: number
  hydrated: boolean
  setFilters: (filters: AttendanceSearchFilters) => void
  setAppliedFilters: (filters: AttendanceSearchFilters) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setHydrated: (state: boolean) => void
  resetFilters: () => void
}

/**
 * 세션 스토리지 저장 키.
 * - 새로고침 후에도 마지막 조회 조건/페이지를 유지한다.
 */
const STORAGE_KEY = 'attendance-search-state'

/**
 * 근태 기록 화면 전용 zustand store.
 * - appliedFilters/page/pageSize만 저장하여 상태 저장 범위를 최소화
 * - 복원 시 filters를 appliedFilters로 동기화하여 입력값과 적용값을 일치시킨다.
 */
export const useAttendanceSearchStore = create<AttendanceSearchState>()(
  persist(
    (set) => ({
      filters: defaultAttendanceSearchFilters,
      appliedFilters: defaultAttendanceSearchFilters,
      page: 0,
      pageSize: 50,
      hydrated: false,
      setFilters: (filters) => set({ filters }),
      setAppliedFilters: (filters) => set({ appliedFilters: filters }),
      setPage: (page) => set({ page }),
      setPageSize: (pageSize) => set({ pageSize }),
      setHydrated: (state) => set({ hydrated: state }),
      resetFilters: () => set({ filters: defaultAttendanceSearchFilters }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        appliedFilters: state.appliedFilters,
        page: state.page,
        pageSize: state.pageSize,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        // appliedFilters를 filters로 동기화하여 입력값과 적용값을 일치시킴
        state.setFilters(state.appliedFilters)
        state.setHydrated(true)
      },
    }
  )
)
