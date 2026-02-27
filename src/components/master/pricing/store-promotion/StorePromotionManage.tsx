'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PromotionSearch, { type PromotionSearchFilters } from './PromotionSearch'
import PromotionList from './PromotionList'
import Location from '@/components/ui/Location'
import { useStorePromotionList, useStoreOptions } from '@/hooks/queries'
import { PROMOTION_STATUS, PROMOTION_STATUS_LABEL, type StorePromotionListParams, type PromotionStatus } from '@/types/store-promotion'
import { formatDateYmdOrUndefined } from '@/util/date-util'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

const PROMOTION_STATUS_OPTIONS: { value: PromotionStatus; label: string }[] = Object.entries(
  PROMOTION_STATUS
).map(([, value]) => ({ value, label: PROMOTION_STATUS_LABEL[value] }))

const DEFAULT_FILTERS: PromotionSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  promotionStatus: '',
  menuName: '',
  from: null,
  to: null,
}

export default function StorePromotionManage() {
  const router = useRouter()
  const [filters, setFilters] = useState<PromotionSearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PromotionSearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 적용된 필터 기준으로 점포 옵션 조회
  const { data: storeOptions } = useStoreOptions(appliedFilters.officeId, appliedFilters.franchiseId, appliedFilters.officeId != null)

  const queryParams: StorePromotionListParams = {
    headOfficeId: appliedFilters.officeId ?? undefined,
    franchiseId: appliedFilters.franchiseId ?? undefined,
    storeId: appliedFilters.storeId ?? undefined,
    status: appliedFilters.promotionStatus || undefined,
    menuName: appliedFilters.menuName || undefined,
    startDate: formatDateYmdOrUndefined(appliedFilters.from),
    endDate: formatDateYmdOrUndefined(appliedFilters.to),
    page,
    size: pageSize,
  }

  const canFetchList = appliedFilters.officeId != null
  const { data: response, isFetching: loading } = useStorePromotionList(queryParams, canFetchList)

  // 선택된 점포명 조회
  const storeName =
    !appliedFilters.storeId || !storeOptions
      ? null
      : storeOptions.find((s) => s.id === appliedFilters.storeId)?.storeName ?? null

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
    setPage(0)
  }

  const handleRegister = () => {
    router.push('/master/pricing/store-promotion/detail')
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
      <PromotionSearch
        filters={filters}
        promotionStatusOptions={PROMOTION_STATUS_OPTIONS}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
      />
      <PromotionList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        storeName={storeName}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onRegister={handleRegister}
      />
    </div>
  )
}
