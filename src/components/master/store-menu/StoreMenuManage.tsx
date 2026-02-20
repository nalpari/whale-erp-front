'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import StoreMenuSearch, { type StoreMenuSearchFilters } from './StoreMenuSearch'
import StoreMenuThumbnailList from './StoreMenuThumbnailList'
import { useStoreMenuList, useBulkUpdateOperationStatus, useBulkUpdateDisplayOrder } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmdOrUndefined } from '@/util/date-util'
import { useAlert } from '@/components/common/ui'
import axios from 'axios'
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
  const [pageSize, setPageSize] = useState(50)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

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

  const canFetchList = appliedFilters.officeId != null
  const { data: response, isPending } = useStoreMenuList(queryParams, canFetchList)
  const loading = canFetchList && isPending

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
  }

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  const statusMap = useMemo(() => statusChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [statusChildren])

  const marketingMap = useMemo(() => marketingChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [marketingChildren])

  const menuPropertyMap = useMemo(() => menuPropertyChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [menuPropertyChildren])

  const menuTypeMap = useMemo(() => menuTypeChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [menuTypeChildren])

  const setStatusMap = useMemo(() => setStatusChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [setStatusChildren])

  const menuClassMap = useMemo(() => menuClassChildren.reduce<Record<string, string>>((acc, item) => {
    acc[item.code] = item.name
    return acc
  }, {}), [menuClassChildren])

  const handleSelectChange = (id: number, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const operationStatusOptions = useMemo(() => statusChildren.map((item) => ({
    value: item.code,
    label: item.name,
  })), [statusChildren])

  const menuTypeOptions = useMemo(() => menuTypeChildren.map((item) => ({
    value: item.code,
    label: item.name,
  })), [menuTypeChildren])

  const menuClassificationOptions = useMemo(() => menuClassChildren.map((item) => ({
    value: item.code,
    label: item.name,
  })), [menuClassChildren])

  const router = useRouter()
  const handleMenuClick = useCallback((menuId: number) => {
    router.push(`/master/menu/store/header?id=${menuId}`)
  }, [router])

  const { confirm, alert } = useAlert()
  const bulkStatusMutation = useBulkUpdateOperationStatus()
  const displayOrderMutation = useBulkUpdateDisplayOrder()

  /** 선택된 메뉴들의 운영여부를 일괄 변경. ERR3034: 마스터 메뉴가 미운영이면 점포 메뉴 운영 전환 불가 */
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
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
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

  return (
    <div className="data-wrap">
      <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
      <StoreMenuSearch
        filters={filters}
        operationStatusOptions={operationStatusOptions}
        menuTypeOptions={menuTypeOptions}
        menuClassificationOptions={menuClassificationOptions}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
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
