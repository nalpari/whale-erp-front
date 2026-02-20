'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import StoreMenuSearch, { type StoreMenuSearchFilters, type SearchTag } from './StoreMenuSearch'
import StoreMenuThumbnailList from './StoreMenuThumbnailList'
import { useStoreMenuList, useBulkUpdateOperationStatus, useBulkUpdateDisplayOrder, useBpHeadOfficeTree, useStoreOptions } from '@/hooks/queries'
import { useCategoryList } from '@/hooks/queries/use-category-queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmd, formatDateYmdOrUndefined } from '@/util/date-util'
import { useAuthStore } from '@/stores/auth-store'
import { useAlert } from '@/components/common/ui'
import type { StoreMenuListParams } from '@/types/store-menu'

const BREADCRUMBS = ['Home', 'Master data 관리', '메뉴 정보 관리']

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
  const [filters, setFilters] = useState<StoreMenuSearchFilters>(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<StoreMenuSearchFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // BP 트리 & 점포 옵션 (태그 display name 조회용, 캐시 재사용)
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [] } = useBpHeadOfficeTree(isReady)
  const { data: storeOptionList = [] } = useStoreOptions(
    appliedFilters.officeId,
    null,
    isReady && !!appliedFilters.officeId
  )

  const queryParams: StoreMenuListParams = useMemo(
    () => ({
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
    }),
    [appliedFilters, page, pageSize]
  )

  // bpTree auto-apply
  if (filters.officeId != null && appliedFilters.officeId == null) {
    setAppliedFilters(filters)
  }

  const canFetchList = appliedFilters.officeId != null
  const { data: response, isPending: loading } = useStoreMenuList(queryParams, canFetchList)

  // 공통코드: 운영 여부(STOPR), 메뉴 타입(MNTYP), 메뉴 분류(MNCF), 마케팅(MKCF)
  const { children: statusChildren } = useCommonCode('STOPR', true)
  const { children: menuTypeChildren } = useCommonCode('MNTYP', true)
  const { children: menuClassChildren } = useCommonCode('MNCF', true)
  const { children: marketingChildren } = useCommonCode('MKCF', true)
  const { children: menuPropertyChildren } = useCommonCode('MNPRP', true)

  // 카테고리 목록 (본사가 선택된 경우에만 조회)
  const { data: categories = [] } = useCategoryList(
    { bpId: filters.officeId ?? undefined, depth: 1 },
    !!filters.officeId
  )

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS)
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  const statusMap = statusChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {})

  const marketingMap = marketingChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {})

  const menuPropertyMap = menuPropertyChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {})

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

  // 적용된 검색 조건 태그 목록
  const appliedTags: SearchTag[] = useMemo(() => {
    const tags: SearchTag[] = []
    const af = appliedFilters

    if (af.officeId != null) {
      const officeName = bpTree.find((o) => o.id === af.officeId)?.name ?? ''
      tags.push({ key: 'officeId', label: `${officeName} (본사)`, removable: false })
    }

    if (af.storeId != null) {
      const storeName = storeOptionList.find((s) => s.id === af.storeId)?.storeName ?? ''
      tags.push({ key: 'storeId', label: `${storeName} (점포)` })
    }

    if (af.menuName !== '') {
      tags.push({ key: 'menuName', label: `${af.menuName} (메뉴명)` })
    }

    if (af.menuClassificationCode !== '') {
      const classLabel =
        menuClassificationOptions.find((o) => o.value === af.menuClassificationCode)?.label ?? ''
      tags.push({ key: 'menuClassificationCode', label: `${classLabel} (메뉴 분류)` })
    }

    if (af.categoryId != null) {
      const catName = categories.find((c) => c.id === af.categoryId)?.categoryName ?? ''
      tags.push({ key: 'categoryId', label: `${catName} (카테고리)` })
    }

    if (af.operationStatus !== 'ALL') {
      const statusLabel =
        operationStatusOptions.find((o) => o.value === af.operationStatus)?.label ?? ''
      tags.push({ key: 'operationStatus', label: `${statusLabel} (운영여부)` })
    }

    if (af.menuType !== 'ALL') {
      const typeLabel = menuTypeOptions.find((o) => o.value === af.menuType)?.label ?? ''
      tags.push({ key: 'menuType', label: `${typeLabel} (메뉴 타입)` })
    }

    if (af.from || af.to) {
      const fromStr = af.from ? formatDateYmd(af.from) : ''
      const toStr = af.to ? formatDateYmd(af.to) : ''
      tags.push({ key: 'from', label: `${fromStr} ~ ${toStr} (등록일)` })
    }

    return tags
  }, [
    appliedFilters,
    bpTree,
    storeOptionList,
    menuClassificationOptions,
    categories,
    operationStatusOptions,
    menuTypeOptions,
  ])

  // 태그 제거 핸들러
  const handleRemoveTag = (key: keyof StoreMenuSearchFilters) => {
    if (key === 'from' || key === 'to') {
      const next = { ...filters, from: null, to: null }
      setFilters(next)
      setAppliedFilters(next)
      setPage(0)
      return
    }

    let next = { ...filters, [key]: DEFAULT_FILTERS[key] }

    if (key === 'officeId') {
      next = { ...next, storeId: null, categoryId: null }
    }

    setFilters(next)
    setAppliedFilters(next)
    setPage(0)
  }

  const router = useRouter()
  const handleMenuClick = useCallback((menuId: number) => {
    router.push(`/master/menu/store/header?id=${menuId}`)
  }, [router])

  const { confirm, alert } = useAlert()
  const bulkStatusMutation = useBulkUpdateOperationStatus()
  const displayOrderMutation = useBulkUpdateDisplayOrder()

  const handleBulkStatusChange = async (operationStatus: string) => {
    if (selectedIds.size === 0) return

    const statusLabel = operationStatus === 'STOPR_001' ? '운영' : '미운영'
    const confirmed = await confirm(
      `선택한 메뉴의 운영여부를 '${statusLabel}'으로 변경하시겠습니까?`
    )
    if (!confirmed) return

    try {
      await bulkStatusMutation.mutateAsync({
        bpId: appliedFilters.officeId!,
        menuIds: Array.from(selectedIds),
        operationStatus,
      })
      setSelectedIds(new Set())
    } catch {
      await alert('운영여부 변경에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleSaveDisplayOrder = async (changes: Map<number, string>) => {
    if (changes.size === 0) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    const bpId = appliedFilters.officeId!
    const body = Array.from(changes.entries()).map(([menuId, value]) => ({
      bpId,
      menuId,
      displayOrder: value === '' ? null : Number(value),
    }))

    try {
      await displayOrderMutation.mutateAsync(body)
    } catch {
      await alert('노출순서 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  // 전체 태그 삭제 핸들러 (본사는 유지, removable 태그만 초기화)
  const handleClearAllTags = () => {
    const next: StoreMenuSearchFilters = {
      ...DEFAULT_FILTERS,
      officeId: appliedFilters.officeId,
    }
    setFilters(next)
    setAppliedFilters(next)
    setPage(0)
  }

  return (
    <div className="data-wrap">
      <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
      <StoreMenuSearch
        filters={filters}
        operationStatusOptions={operationStatusOptions}
        menuTypeOptions={menuTypeOptions}
        menuClassificationOptions={menuClassificationOptions}
        categories={categories}
        resultCount={totalCount}
        appliedTags={appliedTags}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveTag={handleRemoveTag}
        onClearAllTags={handleClearAllTags}
      />
      <StoreMenuThumbnailList
        rows={listData}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        loading={loading}
        statusMap={statusMap}
        marketingMap={marketingMap}
        menuPropertyMap={menuPropertyMap}
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
