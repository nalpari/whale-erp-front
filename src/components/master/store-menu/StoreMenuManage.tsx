'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import StoreMenuSearch, { type StoreMenuSearchFilters } from './StoreMenuSearch'
import StoreMenuThumbnailList from './StoreMenuThumbnailList'
import { useStoreMenuList, useBulkUpdateOperationStatus, useBulkUpdateDisplayOrder } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import { useAlert } from '@/components/common/ui'
import { isAxiosError } from 'axios'
import type { StoreMenuListParams } from '@/types/store-menu'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import { useQueryError } from '@/hooks/useQueryError'
import { useSearchFilterStorage } from '@/hooks/useSearchFilterStorage'

const BREADCRUMBS = ['Home', 'Master data 관리', '메뉴 정보 관리']

const buildCodeMap = (items: { code: string; name: string }[]) =>
  items.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {})

const parseDisplayOrder = (value: string): number | null => {
  if (value === '') return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

const DEFAULT_FILTERS: StoreMenuSearchFilters = {
  officeId: null,
  storeId: null,
  menuName: '',
  operationStatus: 'ALL',
  menuType: 'ALL',
  menuClassificationCode: '',
  categoryId: null,
  from: null,
  to: null,
}

export default function StoreMenuManage() {
  const router = useRouter()
  const { savedFilters, saveFilters, clearFilters } = useSearchFilterStorage<StoreMenuSearchFilters>(
    'store-menu-search',
    { dateFields: ['from', 'to'] },
  )

  const [filters, setFilters] = useState<StoreMenuSearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<StoreMenuSearchFilters>(savedFilters ?? DEFAULT_FILTERS)
  const setAppliedFilters = (next: StoreMenuSearchFilters) => { _setAppliedFilters(next); saveFilters(next) }
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // 본사/가맹점 계정: HeadOfficeFranchiseStoreSelect 자동선택 시 appliedFilters 직접 세팅
  // 이미 검색이 수행된 적 있으면 무시 (초기화 시 자동선택 재발동 방지)
  const handleAutoSelect = (value: OfficeFranchiseStoreValue) => {
    if (appliedFilters.officeId != null) return
    setAppliedFilters({
      ...DEFAULT_FILTERS,
      officeId: value.head_office,
    })
  }

  const queryParams: StoreMenuListParams = {
    bpId: appliedFilters.officeId ?? undefined,
    menuGroup: 'MNGRP_002',
    storeId: appliedFilters.storeId ?? undefined,
    menuName: appliedFilters.menuName || undefined,
    operationStatus:
      appliedFilters.operationStatus === 'ALL' ? undefined : appliedFilters.operationStatus,
    menuType: appliedFilters.menuType === 'ALL' ? undefined : appliedFilters.menuType,
    menuClassificationCode: appliedFilters.menuClassificationCode || undefined,
    categoryId: appliedFilters.categoryId ?? undefined,
    createdAtFrom: formatDateYmdOrUndefined(appliedFilters.from),
    createdAtTo: formatDateYmdOrUndefined(appliedFilters.to),
    page,
    size: pageSize,
  }

  const canFetchList = appliedFilters.officeId != null
  const { data: response, isPending, error: queryError } = useStoreMenuList(queryParams, canFetchList)
  const loading = canFetchList && isPending
  const errorMessage = useQueryError(queryError)

  // 공통코드: 운영 여부(STOPR), 메뉴 타입(MNTYP), 메뉴 분류(MNCF), 마케팅(MKCF), 세트 여부(STST)
  const { children: statusChildren } = useCommonCode('STOPR', true)
  const { children: menuTypeChildren } = useCommonCode('MNTYP', true)
  const { children: menuClassChildren } = useCommonCode('MNCF', true)
  const { children: marketingChildren } = useCommonCode('MKCF', true)
  const { children: menuPropertyChildren } = useCommonCode('MNPRP', true)
  const { children: setStatusChildren } = useCommonCode('STST', true)

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
    clearFilters()
  }

  const handleRemoveFilter = (key: string) => {
    const resetMap: Record<string, Partial<StoreMenuSearchFilters>> = {
      office: { officeId: null, storeId: null, categoryId: null },
      store: { storeId: null },
      menuName: { menuName: '' },
      operationStatus: { operationStatus: 'ALL' },
      menuType: { menuType: 'ALL' },
      menuClassificationCode: { menuClassificationCode: '' },
      categoryId: { categoryId: null },
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

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  const statusMap = buildCodeMap(statusChildren)
  const marketingMap = buildCodeMap(marketingChildren)
  const menuPropertyMap = buildCodeMap(menuPropertyChildren)
  const menuTypeMap = buildCodeMap(menuTypeChildren)
  const setStatusMap = buildCodeMap(setStatusChildren)
  const menuClassMap = buildCodeMap(menuClassChildren)

  const handleSelectChange = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const operationStatusOptions = statusChildren.map((item) => ({
    value: item.code,
    label: item.name,
  }))

  const menuTypeOptions = menuTypeChildren.map((item) => ({
    value: item.code,
    label: item.name,
  }))

  const menuClassificationOptions = menuClassChildren.map((item) => ({
    value: item.code,
    label: item.name,
  }))

  const handleMenuClick = (menuId: number) => {
    router.push(`/master/menu/store/header?id=${menuId}`)
  }

  const { confirm, alert } = useAlert()
  const bulkStatusMutation = useBulkUpdateOperationStatus()
  const displayOrderMutation = useBulkUpdateDisplayOrder()

  /** 선택된 메뉴들의 운영여부를 일괄 변경. ERR3034: 마스터 메뉴가 미운영이면 점포 메뉴 운영 전환 불가 */
  const handleBulkStatusChange = async (operationStatus: string) => {
    const officeId = appliedFilters.officeId
    if (selectedIds.size === 0 || officeId == null) return

    const menuIds = Array.from(selectedIds)
    const statusLabel = statusMap[operationStatus] ?? operationStatus
    const confirmed = await confirm(
      `선택한 메뉴의 운영여부를 '${statusLabel}'으로 변경하시겠습니까?`
    )
    if (!confirmed) return

    try {
      await bulkStatusMutation.mutateAsync({
        bpId: officeId,
        menuIds,
        operationStatus,
      })
      setSelectedIds(new Set())
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 400 &&
        error.response?.data?.code === 'ERR3034'
      ) {
        await alert('마스터 메뉴가 미운영 상태이므로 점포 메뉴를 운영 상태로 변경할 수 없습니다.')
        setSelectedIds(new Set())
      } else {
        await alert('운영여부 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  /** 썸네일 리스트에서 변경된 노출순서를 일괄 저장 */
  const handleSaveDisplayOrder = async (changes: Map<number, string>) => {
    const officeId = appliedFilters.officeId
    if (changes.size === 0 || officeId == null) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return
    const body = Array.from(changes.entries()).map(([menuId, value]) => ({
      bpId: officeId,
      menuId,
      displayOrder: parseDisplayOrder(value),
    }))

    try {
      await displayOrderMutation.mutateAsync(body)
    } catch {
      await alert('노출순서 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="data-wrap">
      <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
      <StoreMenuSearch
        filters={filters}
        appliedFilters={appliedFilters}
        operationStatusOptions={operationStatusOptions}
        menuTypeOptions={menuTypeOptions}
        menuClassificationOptions={menuClassificationOptions}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
        onAutoSelect={handleAutoSelect}
      />
      <StoreMenuThumbnailList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        error={errorMessage}
        statusMap={statusMap}
        marketingMap={marketingMap}
        menuPropertyMap={menuPropertyMap}
        menuTypeMap={menuTypeMap}
        setStatusMap={setStatusMap}
        menuClassMap={menuClassMap}
        selectedIds={selectedIds}
        onSelectChange={handleSelectChange}
        onPageChange={(nextPage) => setPage(nextPage)}
        onPageSizeChange={(size) => {
          setPageSize(size)
          setPage(0)
        }}
        onBulkStatusChange={handleBulkStatusChange}
        onSaveDisplayOrder={handleSaveDisplayOrder}
        onMenuClick={handleMenuClick}
      />
    </div>
  )
}
