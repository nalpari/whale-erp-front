'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import PromotionSearch, { type PromotionSearchFilters, type PromotionFilterTagKey } from './PromotionSearch'
import PromotionList from './PromotionList'
import Location from '@/components/ui/Location'
import { useStorePromotionList, useStoreOptions } from '@/hooks/queries'
import { PROMOTION_STATUS, PROMOTION_STATUS_LABEL, type StorePromotionListParams, type PromotionStatus } from '@/types/store-promotion'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { useQueryError } from '@/hooks/useQueryError'
import { useSearchFilterStorage } from '@/hooks/useSearchFilterStorage'

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
  const { savedFilters, saveFilters, clearFilters } = useSearchFilterStorage<PromotionSearchFilters>(
    'store-promotion-search',
    { dateFields: ['from', 'to'] },
  )

  const [filters, setFilters] = useState<PromotionSearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<PromotionSearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const setAppliedFilters = useCallback((next: PromotionSearchFilters) => { _setAppliedFilters(next); saveFilters(next) }, [saveFilters])
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // 본사/가맹점 계정: HeadOfficeFranchiseStoreSelect 자동선택 시 appliedFilters 직접 세팅
  // 이미 검색이 수행된 적 있으면 무시 (초기화 시 자동선택 재발동 방지)
  const handleAutoSelect = (value: OfficeFranchiseStoreValue) => {
    if (appliedFilters.officeId != null) return
    setAppliedFilters({
      ...DEFAULT_FILTERS,
      officeId: value.head_office,
      franchiseId: value.franchise,
    })
  }

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
  const { data: response, isFetching: loading, error: queryError } = useStorePromotionList(queryParams, canFetchList)
  const errorMessage = useQueryError(queryError)

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
    _setAppliedFilters(DEFAULT_FILTERS)
    clearFilters()
    setPage(0)
  }

  const handleRemoveFilter = (key: PromotionFilterTagKey) => {
    const resetMap: Record<string, Partial<PromotionSearchFilters>> = {
      office: { officeId: null, franchiseId: null, storeId: null },
      franchise: { franchiseId: null, storeId: null },
      store: { storeId: null },
      promotionStatus: { promotionStatus: '' },
      menuName: { menuName: '' },
      date: { from: null, to: null },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...appliedFilters, ...patch }
    setFilters(nextFilters)
    // 필수값(office) 제거 시 appliedFilters는 유지 → 목록 데이터 보존
    if (key === 'office') return
    setAppliedFilters(nextFilters)
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
        appliedFilters={appliedFilters}
        promotionStatusOptions={PROMOTION_STATUS_OPTIONS}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
        onAutoSelect={handleAutoSelect}
      />
      <PromotionList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={errorMessage}
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
