'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import StoreList from '@/components/store/manage/StoreList'
import StoreSearch, { type StoreSearchFilters } from '@/components/store/manage/StoreSearch'
import Location from '@/components/ui/Location'
import { useStoreList, useStoreOptions, useSubscribePlanCheck, type StoreListParams } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import { useAlert } from '@/components/common/ui/Alert'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { useQueryError } from '@/hooks/useQueryError'
import { useStoreManageSearchStore } from '@/stores/search-stores'

const BREADCRUMBS = ['Home', '가맹점 및 점포 관리', '점포 정보 관리']

const DEFAULT_FILTERS: StoreSearchFilters = {
  officeId: null,
  franchiseId: null,
  storeId: null,
  status: 'ALL',
  from: null,
  to: null,
}

export default function StoreInfo() {
  const router = useRouter()
  const searchStore = useStoreManageSearchStore()
  const restoredFilters = searchStore.hasSearched ? searchStore.searchParams : null

  const [filters, setFilters] = useState<StoreSearchFilters>(restoredFilters ?? DEFAULT_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<StoreSearchFilters>(restoredFilters ?? DEFAULT_FILTERS)
  const setAppliedFilters = (next: StoreSearchFilters) => {
    _setAppliedFilters(next)
    searchStore.setSearchParams(next )
    searchStore.setHasSearched(true)
  }
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

  const { alert, confirm } = useAlert()
  const { refetch: checkSubscribePlan, isFetching: checking } = useSubscribePlanCheck()

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

  // HeadOfficeFranchiseStoreSelect 내부에서 동일 쿼리 키로 useStoreOptions를 호출하므로
  // 캐시 워밍 역할 — 본사/가맹점 변경 시 점포 옵션을 미리 가져와 드롭다운 지연을 줄인다.
  useStoreOptions(filters.officeId, filters.franchiseId)

  const canFetchList = appliedFilters.officeId != null
  const { data: response, isFetching: loading, error: queryError } = useStoreList(storeParams, canFetchList)
  const errorMessage = useQueryError(queryError)
  const { children: statusChildren } = useCommonCode('STOPR', true)

  // 검색 적용: 현재 입력값을 적용값으로 확정하고 1페이지부터 조회
  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지
  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    searchStore.reset()
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<StoreSearchFilters>> = {
      office: { officeId: null, franchiseId: null, storeId: null },
      franchise: { franchiseId: null, storeId: null },
      store: { storeId: null },
      status: { status: 'ALL' },
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

  // 등록 페이지로 이동 전에 구독 플랜 점포 등록 가능 여부 확인
  const handleRegister = async () => {
    const { data, isError } = await checkSubscribePlan()

    if (isError || !data) {
      await alert('구독 플랜 확인 중 오류가 발생했습니다.')
      return
    }

    if (!data.canSave) {
      const confirmed = await confirm(
        data.planName
          ? `${data.planName} 플랜의 점포 등록 한도에 도달했습니다. 점포를 추가하려면 플랜 업그레이드가 필요합니다.`
          : '점포를 등록하기 위해서는 회원 등급 업그레이드가 필요합니다.'
      )
      if (!confirmed) return
      if (confirmed) {
        router.push('/customer/rate-plan')
        return
      }
    }

    router.push('/store/info/detail')
  }

  const handleOpenDetail = (storeId: number) => {
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
        appliedFilters={appliedFilters}
        statusOptions={statusChildren.map((item) => ({ value: item.code, label: item.name }))}
        resultCount={totalCount}
        onChange={(next) =>
          setFilters((prev) => ({ ...prev, ...next }))
        }
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
        onAutoSelect={handleAutoSelect}
      />
      <StoreList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={errorMessage}
        statusMap={statusMap}
        onPageChange={(nextPage) => {
          setPage(nextPage)
        }}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onRegister={handleRegister}
        registerDisabled={checking}
        onOpenDetail={handleOpenDetail}
      />
    </div>
  )
}
