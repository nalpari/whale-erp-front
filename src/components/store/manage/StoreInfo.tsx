'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import StoreList from '@/components/store/manage/StoreList'
import StoreSearch, { StoreSearchFilters } from '@/components/store/manage/StoreSearch'
import Location from '@/components/ui/Location'
import { StoreListParams, useStoreList, useStoreOptions } from '@/hooks/store/useStore'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmdOrUndefined } from '@/util/date-util'

const defaultFilters: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

const STORE_SEARCH_STATE_KEY = 'store-search-state'

const BREADCRUMBS = ['Home', '가맹점 및 점포 관리', '점포 정보 관리']

// sessionStorage에 저장된 검색 상태를 읽고, 실패 시 기본값으로 복구
const readStoredSearchState = () => {
  if (typeof window === 'undefined') {
    return { filters: defaultFilters, page: 0, pageSize: 50 }
  }

  const stored = sessionStorage.getItem(STORE_SEARCH_STATE_KEY)
  if (!stored) {
    return { filters: defaultFilters, page: 0, pageSize: 50 }
  }

  try {
    const parsed = JSON.parse(stored) as {
      filters?: StoreSearchFilters
      page?: number
      pageSize?: number
    }
    return {
      filters: parsed.filters ?? defaultFilters,
      page: parsed.page ?? 0,
      pageSize: parsed.pageSize ?? 50,
    }
  } catch {
    sessionStorage.removeItem(STORE_SEARCH_STATE_KEY)
    return { filters: defaultFilters, page: 0, pageSize: 50 }
  }
}

// 페이지 검색 상태 타입 (검색값 + 적용된 검색값 + 페이지네이션)
type StoreSearchState = {
  filters: StoreSearchFilters
  appliedFilters: StoreSearchFilters
  page: number
  pageSize: number
  hydrated: boolean
}

// 서버 렌더링 시에도 동일한 스냅샷을 반환하기 위한 기본값
const defaultState: StoreSearchState = {
  filters: defaultFilters,
  appliedFilters: defaultFilters,
  page: 0,
  pageSize: 50,
  hydrated: false,
}

// useSyncExternalStore를 위한 외부 저장소 (setState-in-effect 규칙 회피)
let storeState: StoreSearchState = defaultState
const listeners = new Set<() => void>()

// 상태 변경 후 구독자에게 알림
const setStoreState = (updater: (prev: StoreSearchState) => StoreSearchState) => {
  storeState = updater(storeState)
  listeners.forEach((listener) => listener())
}

// 스토어 구독/해지
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// 클라이언트 스냅샷
const getSnapshot = () => storeState
// 서버 스냅샷 (SSR에서 window 접근 방지)
const getServerSnapshot = () => defaultState

export default function StoreInfo() {
  const router = useRouter()
  // 외부 스토어에서 상태 읽기 (SSR/CSR 안정적으로 동기화)
  const { filters, appliedFilters, page, pageSize, hydrated } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  // 마운트 후 sessionStorage 값으로 동기화 (SSR에서는 기본값 렌더링)
  useEffect(() => {
    const stored = readStoredSearchState()
    setStoreState((prev) => ({
      ...prev,
      filters: stored.filters,
      appliedFilters: stored.filters,
      page: stored.page,
      pageSize: stored.pageSize,
      hydrated: true,
    }))
  }, [])

  // 검색 상태를 sessionStorage에 저장
  const persistSearchState = (nextFilters: StoreSearchFilters, nextPage: number, nextPageSize: number) => {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(
      STORE_SEARCH_STATE_KEY,
      JSON.stringify({ filters: nextFilters, page: nextPage, pageSize: nextPageSize })
    )
  }

  const storeParams: StoreListParams = useMemo(
    () => ({
      office: appliedFilters.officeId ?? undefined,
      franchise: appliedFilters.franchiseId ?? undefined,
      store: appliedFilters.storeId ?? undefined,
      status: appliedFilters.status === 'ALL' ? undefined : appliedFilters.status,
      from: formatDateYmdOrUndefined(appliedFilters.from),
      to: formatDateYmdOrUndefined(appliedFilters.to),
      page,
      size: pageSize,
      sort: 'createdAt,desc',
    }),
    [appliedFilters, page, pageSize]
  )

  const { options: storeOptionList } = useStoreOptions(filters.officeId ?? undefined, filters.franchiseId ?? undefined)
  // 세션 동기화가 완료된 뒤에만 목록 API 호출
  const { data: response, loading, error } = useStoreList(storeParams, hydrated)
  const { getHierarchyChildren, getChildren } = useCommonCode()
  const statusChildren = getChildren('STOPR')

  // 선택된 storeId가 옵션 목록에서 사라졌으면 필터에서 제거
  useEffect(() => {
    const targetStoreId = filters.storeId ?? appliedFilters.storeId
    if (!targetStoreId) return
    const isValid = storeOptionList.some((option) => option.id === targetStoreId)
    if (isValid) return
    setStoreState((prev) => ({
      ...prev,
      filters: { ...prev.filters, storeId: null },
      appliedFilters: { ...prev.appliedFilters, storeId: null },
    }))
  }, [filters.storeId, appliedFilters.storeId, storeOptionList])

  useEffect(() => {
    if (statusChildren.length === 0) {
      void getHierarchyChildren('STOPR')
    }
  }, [statusChildren.length, getHierarchyChildren])

  // 검색 적용: 현재 입력값을 적용값으로 확정하고 1페이지부터 조회
  const handleSearch = () => {
    const nextFilters = filters
    setStoreState((prev) => ({ ...prev, appliedFilters: nextFilters, page: 0 }))
    persistSearchState(nextFilters, 0, pageSize)
  }

  // 초기화: 입력값만 기본값으로 복원 (적용값은 사용자가 다시 검색할 때 변경)
  const handleReset = () => {
    setStoreState((prev) => ({ ...prev, filters: defaultFilters }))
    // 적용된 검색 결과는 유지하고 입력값만 초기화
    persistSearchState(appliedFilters, page, pageSize)
  }

  // 등록 페이지로 이동 전에 현재 검색 상태 저장
  const handleRegister = () => {
    persistSearchState(appliedFilters, page, pageSize)
    router.push('/store/info/detail')
  }

  // 상세 페이지로 이동 전에 현재 검색 상태 저장
  const handleOpenDetail = (storeId: number) => {
    persistSearchState(appliedFilters, page, pageSize)
    router.push(`/store/info/header?id=${storeId}`)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1
  const statusMap = statusChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {})

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={BREADCRUMBS} />
      <StoreSearch
        filters={filters}
        statusOptions={statusChildren.map((item) => ({ value: item.code, label: item.name }))}
        resultCount={totalCount}
        onChange={(next) =>
          setStoreState((prev) => ({ ...prev, filters: { ...prev.filters, ...next } }))
        }
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <StoreList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={error}
        statusMap={statusMap}
        onPageChange={(nextPage) => {
          setStoreState((prev) => ({ ...prev, page: nextPage }))
          persistSearchState(appliedFilters, nextPage, pageSize)
        }}
        onPageSizeChange={(size) => {
          setStoreState((prev) => ({ ...prev, pageSize: size, page: 0 }))
          persistSearchState(appliedFilters, 0, size)
        }}
        onRegister={handleRegister}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}