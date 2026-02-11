'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import StoreList from '@/components/store/manage/StoreList'
import StoreSearch from '@/components/store/manage/StoreSearch'
import Location from '@/components/ui/Location'
import { useStoreList, useStoreOptions, useSubscribePlanCheck, type StoreListParams } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { useStoreSearchStore } from '@/stores/store-search-store'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import { useAlert } from '@/components/common/ui/Alert'

const BREADCRUMBS = ['Home', '가맹점 및 점포 관리', '점포 정보 관리']

export default function StoreInfo() {
  const router = useRouter()
  const filters = useStoreSearchStore((state) => state.filters)
  const appliedFilters = useStoreSearchStore((state) => state.appliedFilters)
  const page = useStoreSearchStore((state) => state.page)
  const pageSize = useStoreSearchStore((state) => state.pageSize)
  const hydrated = useStoreSearchStore((state) => state.hydrated)
  const setFilters = useStoreSearchStore((state) => state.setFilters)
  const setAppliedFilters = useStoreSearchStore((state) => state.setAppliedFilters)
  const setPage = useStoreSearchStore((state) => state.setPage)
  const setPageSize = useStoreSearchStore((state) => state.setPageSize)
  const resetFilters = useStoreSearchStore((state) => state.resetFilters)

  const { alert } = useAlert()
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

  const { data: storeOptionList = [] } = useStoreOptions(filters.officeId, filters.franchiseId)
  const { data: response, isPending: loading, error } = useStoreList(storeParams, hydrated)
  const { children: statusChildren } = useCommonCode('STOPR', hydrated)

  // 선택된 storeId가 옵션 목록에서 사라졌으면 필터에서 제거
  useEffect(() => {
    const targetStoreId = filters.storeId ?? appliedFilters.storeId
    if (!targetStoreId) return
    const isValid = storeOptionList.some((option) => option.id === targetStoreId)
    if (isValid) return
    setFilters({ ...filters, storeId: null })
    setAppliedFilters({ ...appliedFilters, storeId: null })
  }, [appliedFilters, filters, setAppliedFilters, setFilters, storeOptionList])

  // 검색 적용: 현재 입력값을 적용값으로 확정하고 1페이지부터 조회
  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  // 초기화: 입력값만 기본값으로 복원 (적용값은 사용자가 다시 검색할 때 변경)
  const handleReset = () => {
    resetFilters()
  }

  // 등록 페이지로 이동 전에 구독 플랜 점포 등록 가능 여부 확인
  const handleRegister = async () => {
    const { data, isError } = await checkSubscribePlan()

    if (isError || !data) {
      await alert('구독 플랜 확인 중 오류가 발생했습니다.')
      return
    }

    if (!data.canSave) {
      await alert(
        data.planName
          ? `${data.planName} 플랜의 점포 등록 한도에 도달했습니다. 점포를 추가하려면 플랜 업그레이드가 필요합니다.`
          : '점포를 등록하기 위해서는 회원 등급 업그레이드가 필요합니다.'
      )
      return
    }

    router.push('/store/info/detail')
  }

  // 상세 페이지로 이동 전에 현재 검색 상태 저장
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
        statusOptions={statusChildren.map((item) => ({ value: item.code, label: item.name }))}
        resultCount={totalCount}
        onChange={(next) =>
          setFilters({ ...filters, ...next })
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
        error={error?.message}
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
