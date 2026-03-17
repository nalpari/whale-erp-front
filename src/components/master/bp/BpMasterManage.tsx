'use client'

import { useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import BpMasterSearch from './BpMasterSearch'
import BpMasterList from './BpMasterList'
import { useBpList, useBpHeadOfficeTree, useCommonCodeHierarchy } from '@/hooks/queries'
import { useBpSearchStore } from '@/stores/bp-search-store'
import type { RadioOption } from '@/components/common/ui/RadioButtonGroup'
import type { SelectOption } from '@/components/ui/common/SearchSelect'
import type { BpListParams } from '@/types/bp'

const formatDate = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T00:00:00`
}

const formatDateEnd = (date: Date | null): string | undefined => {
  if (!date) return undefined
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T23:59:59`
}

const BpMasterManage = () => {
  const router = useRouter()

  // Zustand store에서 검색 상태 가져오기
  const {
    filters,
    appliedFilters,
    page,
    pageSize,
    searchEnabled,
    setFilters,
    applyFilters,
    setPage,
    setPageSize,
    removeFilter,
    reset,
  } = useBpSearchStore()

  // 공통코드 조회
  const { data: bpoprCodes = [] } = useCommonCodeHierarchy('BPOPR')
  const { data: plntypCodes = [] } = useCommonCodeHierarchy('PLNTYP')

  // BP 본사 트리 조회
  const { data: bpTree = [] } = useBpHeadOfficeTree()

  // 운영여부 radio 옵션
  const operationStatusOptions = useMemo<RadioOption[]>(() => {
    const allOption: RadioOption = { label: '전체', value: '' }
    const codeOptions = bpoprCodes.map((code) => ({
      label: code.name,
      value: code.code,
    }))
    return [allOption, ...codeOptions]
  }, [bpoprCodes])

  // 운영여부 코드 → 이름 맵
  const operationStatusCodeMap = useMemo(() => {
    const map = new Map<string, string>()
    bpoprCodes.forEach((code) => map.set(code.code, code.name))
    return map
  }, [bpoprCodes])

  // 구독정보 select 옵션
  const subscriptionPlanOptions = useMemo<SelectOption[]>(() => {
    return plntypCodes.map((code) => ({
      label: code.name,
      value: code.code,
    }))
  }, [plntypCodes])

  // 구독정보 코드 → 이름 맵
  const subscriptionPlanCodeMap = useMemo(() => {
    const map = new Map<string, string>()
    plntypCodes.forEach((code) => map.set(code.code, code.name))
    return map
  }, [plntypCodes])

  // 본사 ID → 이름 맵
  const officeNameMap = useMemo(() => {
    const map = new Map<number, string>()
    bpTree.forEach((office) => {
      if (office.name) map.set(office.id, office.name)
    })
    return map
  }, [bpTree])

  // 가맹점 옵션 (선택된 본사에 따라 필터링)
  const franchiseOptions = useMemo<SelectOption[]>(() => {
    if (!filters.officeId) return []
    const office = bpTree.find((o) => o.id === filters.officeId)
    if (!office) return []
    return office.franchises.map((f) => ({
      label: f.name,
      value: String(f.id),
    }))
  }, [bpTree, filters.officeId])

  // API 파라미터 빌드
  const apiParams = useMemo<BpListParams>(() => ({
    page,
    size: pageSize,
    id: appliedFilters.officeId ?? undefined,
    representativeName: appliedFilters.representativeName || undefined,
    bpoprType: appliedFilters.bpoprType || undefined,
    subscriptionPlanType: appliedFilters.subscriptionPlanType || undefined,
    createdAtFrom: formatDate(appliedFilters.createdAtFrom),
    createdAtTo: formatDateEnd(appliedFilters.createdAtTo),
  }), [page, pageSize, appliedFilters])

  // BP 목록 조회
  const { data: bpListData, isPending } = useBpList(apiParams, searchEnabled)

  // 검색 핸들러
  const handleSearch = useCallback(() => {
    applyFilters()
  }, [applyFilters])

  // 초기화 핸들러
  const handleReset = useCallback(() => {
    reset()
  }, [reset])

  // 필터 변경
  const handleFilterChange = useCallback((next: Partial<typeof filters>) => {
    setFilters(next)
  }, [setFilters])

  // 필터 태그 제거
  const handleRemoveFilter = useCallback((key: string) => {
    removeFilter(key)
  }, [removeFilter])

  // 페이지 변경
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [setPage])

  // 페이지 사이즈 변경
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size)
  }, [setPageSize])

  // 가맹점 초대 페이지 이동
  const handleInviteFranchise = useCallback(() => {
    router.push('/master/bp/invitation')
  }, [router])

  // 등록 페이지 이동
  const handleRegister = useCallback(() => {
    router.push('/master/bp/create')
  }, [router])

  // 행 클릭 → 상세 조회 페이지 이동
  const handleRowClick = useCallback((id: number) => {
    router.push(`/master/bp/${id}`)
  }, [router])

  const rows = bpListData?.content ?? []
  const totalPages = bpListData?.totalPages ?? 0
  const totalElements = bpListData?.totalElements ?? 0

  return (
    <div className="data-wrap">
      <Location title="Business Partner Master" list={['Home', '파트너 정보 관리']} />
      <BpMasterSearch
        filters={filters}
        appliedFilters={appliedFilters}
        operationStatusOptions={operationStatusOptions}
        subscriptionPlanOptions={subscriptionPlanOptions}
        franchiseOptions={franchiseOptions}
        officeNameMap={officeNameMap}
        operationStatusCodeMap={operationStatusCodeMap}
        subscriptionPlanCodeMap={subscriptionPlanCodeMap}
        resultCount={totalElements}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
        onInviteFranchise={handleInviteFranchise}
      />
      <BpMasterList
        rows={rows}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={isPending && searchEnabled}
        operationStatusCodeMap={operationStatusCodeMap}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
        onRowClick={handleRowClick}
      />
    </div>
  )
}

export default BpMasterManage
