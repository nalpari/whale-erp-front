import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DayType, StoreScheduleQuery } from '@/types/work-schedule'

/**
 * 점포별 근무 계획표 화면에서 사용하는 검색 조건 타입.
 * - API 요청 파라미터와 1:1로 매핑되며, 화면 입력 상태를 유지하기 위해 사용한다.
 */
export type StoreScheduleFilters = {
  officeId?: number | null
  franchiseId?: number | null
  storeId?: number | null
  employeeName?: string
  dayType?: DayType | ''
  from?: string
  to?: string
}

/**
 * 검색 조건 초기값.
 * - 본사/가맹/점포는 선택 전 상태로 null
 * - employeeName/dayType는 전체를 의미하는 빈 값
 * - 날짜는 초기 화면에서 별도 로직으로 채운다.
 */
export const defaultStoreScheduleFilters: StoreScheduleFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  employeeName: '',
  dayType: '',
  from: undefined,
  to: undefined,
}

/**
 * 점포별 근무 계획표 화면 상태 저장소.
 * - lastQuery: 실제 조회에 사용된 조건(적용값)
 * - filters: 입력 폼에 바인딩된 조건(입력값)
 * - isUploadOpen: 엑셀 업로드 팝업 표시 여부
 * - hydrated: persist 복원 완료 여부
 */
export type StoreScheduleViewState = {
  lastQuery: StoreScheduleQuery | null
  filters: StoreScheduleFilters
  isUploadOpen: boolean
  hydrated: boolean
  setLastQuery: (query: StoreScheduleQuery | null) => void
  setFilters: (filters: StoreScheduleFilters) => void
  setUploadOpen: (open: boolean) => void
  setHydrated: (state: boolean) => void
  resetFilters: () => void
  reset: () => void
}

/**
 * 세션 스토리지 저장 키.
 * - 새로고침 시 최근 검색 조건을 복원한다.
 */
const STORAGE_KEY = 'store-schedule-search'

/**
 * 점포별 근무 계획표 화면 전용 zustand store.
 * - persist로 lastQuery만 저장 → 새로고침 후에도 “적용된 검색 조건” 유지
 * - onRehydrateStorage에서 filters를 lastQuery로 동기화하여 입력값도 복원
 */
export const useStoreScheduleViewStore = create<StoreScheduleViewState>()(
  persist(
    (set) => ({
      lastQuery: null,
      filters: defaultStoreScheduleFilters,
      isUploadOpen: false,
      hydrated: false,
      setLastQuery: (query) => set({ lastQuery: query }),
      setFilters: (filters) => set({ filters }),
      setUploadOpen: (open) => set({ isUploadOpen: open }),
      setHydrated: (state) => set({ hydrated: state }),
      resetFilters: () => set({ filters: defaultStoreScheduleFilters }),
      reset: () => set({ lastQuery: null, filters: defaultStoreScheduleFilters, isUploadOpen: false }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      // lastQuery만 저장하여 불필요한 상태 저장을 최소화
      partialize: (state) => ({ lastQuery: state.lastQuery }),
      // 복원 직후 입력값(filters)을 lastQuery로 맞춘다.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.setFilters(state.lastQuery ?? defaultStoreScheduleFilters)
        state.setHydrated(true)
      },
    }
  )
)
