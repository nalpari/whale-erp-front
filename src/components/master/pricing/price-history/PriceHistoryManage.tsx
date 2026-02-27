'use client'

import { useState, useMemo } from 'react'
import PriceHistorySearch, { type PriceHistorySearchFilters } from './PriceHistorySearch'
import PriceHistoryList from './PriceHistoryList'
import Location from '@/components/ui/Location'
import { usePriceHistoryList, useCommonCodeHierarchy, useBpHeadOfficeTree } from '@/hooks/queries'
import type { PriceHistoryListParams } from '@/types/price-history'
import type { RadioOption } from '@/components/common/ui'
import type { SelectOption } from '@/components/ui/common/SearchSelect'

const BREADCRUMBS = ['Home', '가격 Master', '마스터용 가격 이력']

const DEFAULT_FILTERS: PriceHistorySearchFilters = {
  officeId: null,
  franchiseId: null,
  operationStatus: '',
  menuClassificationCode: '',
  menuName: '',
  priceAppliedAtFrom: null,
  priceAppliedAtTo: null,
}

const toIsoDateTime = (date: Date | null, endOfDay = false): string | undefined => {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${endOfDay ? '23:59:59' : '00:00:00'}`
}

const PriceHistoryManage = () => {
  const [filters, setFilters] = useState<PriceHistorySearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<PriceHistorySearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  // BP 트리 (본사명 조회용, HeadOfficeFranchiseStoreSelect와 캐시 공유)
  const { data: bpTree = [] } = useBpHeadOfficeTree()
  const officeNameMap = useMemo(() =>
    new Map(bpTree.map((o) => [o.id, o.name])),
    [bpTree])

  // 공통코드 조회
  const { data: operationStatusCodes = [] } = useCommonCodeHierarchy('STOPR')
  const { data: menuClassCodes = [] } = useCommonCodeHierarchy('MNCF')

  // 운영여부 라디오 옵션 (전체 포함)
  const operationStatusOptions: RadioOption[] = useMemo(() => [
    { value: '', label: '전체' },
    ...operationStatusCodes.map((c) => ({ value: c.code, label: c.name })),
  ], [operationStatusCodes])

  // 메뉴분류 셀렉트 옵션
  const menuClassificationOptions: SelectOption[] = useMemo(() =>
    menuClassCodes.map((c) => ({ value: c.code, label: c.name })),
    [menuClassCodes])

  // 코드 → 이름 변환 Map
  const menuClassCodeMap = useMemo(() =>
    new Map(menuClassCodes.map((c) => [c.code, c.name])),
    [menuClassCodes])

  const operationStatusCodeMap = useMemo(() =>
    new Map(operationStatusCodes.map((c) => [c.code, c.name])),
    [operationStatusCodes])

  // API 파라미터 조립
  const canFetchList = appliedFilters.officeId != null
  const queryParams = useMemo<PriceHistoryListParams>(() => ({
    bpId: appliedFilters.officeId ?? 0,
    operationStatus: appliedFilters.operationStatus || undefined,
    menuClassificationCode: appliedFilters.menuClassificationCode || undefined,
    menuName: appliedFilters.menuName || undefined,
    priceAppliedAtFrom: toIsoDateTime(appliedFilters.priceAppliedAtFrom),
    priceAppliedAtTo: toIsoDateTime(appliedFilters.priceAppliedAtTo, true),
    page,
    size: pageSize,
  }), [appliedFilters, page, pageSize])
  const { data: response, isFetching: loading } = usePriceHistoryList(queryParams, canFetchList)

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<PriceHistorySearchFilters>> = {
      operationStatus: { operationStatus: '' },
      menuClassificationCode: { menuClassificationCode: '' },
      menuName: { menuName: '' },
      priceAppliedAt: { priceAppliedAtFrom: null, priceAppliedAtTo: null },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...appliedFilters, ...patch }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  return (
    <div className="data-wrap">
      <Location title="마스터용 가격 이력" list={BREADCRUMBS} />
      <PriceHistorySearch
        filters={filters}
        appliedFilters={appliedFilters}
        operationStatusOptions={operationStatusOptions}
        menuClassificationOptions={menuClassificationOptions}
        officeNameMap={officeNameMap}
        operationStatusCodeMap={operationStatusCodeMap}
        menuClassCodeMap={menuClassCodeMap}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
      />
      <PriceHistoryList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        menuClassCodeMap={menuClassCodeMap}
        operationStatusCodeMap={operationStatusCodeMap}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
      />
    </div>
  )
}

export default PriceHistoryManage
