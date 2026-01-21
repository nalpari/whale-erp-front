'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import StoreList from '@/components/store/manage/StoreList'
import StoreSearch, { StoreSearchFilters } from '@/components/store/manage/StoreSearch'
import Location from '@/components/ui/Location'
import { StoreListParams, useStoreList, useStoreOptions } from '@/hooks/store/useStore'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useAuthStore } from '@/stores/auth-store'

const defaultFilters: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

const STORE_SEARCH_STATE_KEY = 'store-search-state'

const formatDateParam = (value: Date | null) => {
  if (!value) return undefined
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const date = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${date}`
}

export default function StoreInfoPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<StoreSearchFilters>(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState<StoreSearchFilters>(defaultFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = sessionStorage.getItem(STORE_SEARCH_STATE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as {
        filters?: StoreSearchFilters
        page?: number
        pageSize?: number
      }
      const nextFilters = parsed.filters ?? defaultFilters
      setFilters(nextFilters)
      setAppliedFilters(nextFilters)
      setPage(parsed.page ?? 0)
      setPageSize(parsed.pageSize ?? 50)
    } catch {
      sessionStorage.removeItem(STORE_SEARCH_STATE_KEY)
    }
  }, [])

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
      from: formatDateParam(appliedFilters.from),
      to: formatDateParam(appliedFilters.to),
      page,
      size: pageSize,
      sort: 'createdAt,desc',
    }),
    [appliedFilters, page, pageSize]
  )

  const { options: storeOptionList } = useStoreOptions(filters.officeId ?? undefined, filters.franchiseId ?? undefined)
  const { data: response, loading, error } = useStoreList(storeParams)
  const { getHierarchyChildren, getChildren } = useCommonCode()
  const statusChildren = getChildren('STOPR')

  useEffect(() => {
    if (!filters.storeId) return
    const isValid = storeOptionList.some((option) => option.id === filters.storeId)
    if (isValid) return
    setFilters((prev) => ({ ...prev, storeId: null }))
  }, [filters.storeId, storeOptionList])

  useEffect(() => {
    if (statusChildren.length === 0) {
      void getHierarchyChildren('STOPR')
    }
  }, [statusChildren.length, getHierarchyChildren])

  const handleSearch = () => {
    const nextFilters = filters
    setPage(0)
    setAppliedFilters(nextFilters)
    persistSearchState(nextFilters, 0, pageSize)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORE_SEARCH_STATE_KEY)
    }
  }

  const handleRegister = () => {
    persistSearchState(appliedFilters, page, pageSize)
    router.push('/store/info/detail')
  }

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

  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리'], [])


  console.log(useAuthStore.getState())

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={breadcrumbs} />
      <StoreSearch
        filters={filters}
        storeOptions={storeOptionList.map((option) => ({ value: option.id, label: option.storeName }))}
        statusOptions={statusChildren.map((item) => ({ value: item.code, label: item.name }))}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
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
          setPage(nextPage)
          persistSearchState(appliedFilters, nextPage, pageSize)
        }}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
          persistSearchState(appliedFilters, 0, size)
        }}
        onRegister={handleRegister}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}
