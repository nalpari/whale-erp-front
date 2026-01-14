'use client'


import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import StoreList from '@/components/store/manage/StoreList'
import StoreSearch, { StoreSearchFilters } from '@/components/store/manage/StoreSearch'
import Location from '@/components/ui/Location'
import { StoreListParams } from '@/lib/store-api'
import { useStoreList, useStoreOptions } from '@/hooks/use-store'

const defaultFilters: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

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

  const storeParams: StoreListParams = useMemo(
    () => ({
      office: appliedFilters.officeId ?? undefined,
      franchise: appliedFilters.franchiseId ?? undefined,
      store: appliedFilters.storeId ?? undefined,
      status:
        appliedFilters.status === 'OPERATING'
          ? 'STOPR_001'
          : appliedFilters.status === 'NOT_OPERATING'
            ? 'STOPR_002'
            : undefined,
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

  const handleSearch = () => {
    setPage(0)
    setAppliedFilters(filters)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
    setPage(0)
  }

  const handleRegister = () => {
    router.push('/store/manage/info/header')
  }

  const handleOpenDetail = (storeId: number) => {
    router.push(`/store/manage/info/detail?id=${storeId}`)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리'], [])

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={breadcrumbs} />
      <StoreSearch
        filters={filters}
        officeOptions={[]}
        franchiseOptions={[]}
        storeOptions={storeOptionList.map((option) => ({ value: option.id, label: option.storeName }))}
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
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onRegister={handleRegister}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}
