'use client'

import { useState, useMemo, useCallback } from 'react'
import Location from '@/components/ui/Location'
import MenuSearch from '@/components/master/menu/MenuSearch'
import MenuList from '@/components/master/menu/MenuList'
import type { MenuSearchFormData } from '@/components/master/menu/MenuSearch'
import { useMasterMenuList, useUpdateMenuOperationStatus, type MasterMenuListParams } from '@/hooks/queries'

const BREADCRUMBS = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master']

const defaultFilters: MenuSearchFormData = {}

export default function Menus() {
  const [filters, setFilters] = useState<MenuSearchFormData>(defaultFilters)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [searchOpen, setSearchOpen] = useState(true)

  const listParams: MasterMenuListParams = useMemo(() => {
    const params: MasterMenuListParams = {
      bpId: filters.headOfficeOrganizationId,
      page,
      size: pageSize,
    }

    if (filters.menuName) params.menuName = filters.menuName
    if (filters.operationStatus) params.operationStatus = filters.operationStatus
    if (filters.menuType) params.menuType = filters.menuType
    if (filters.menuClassificationCode) params.menuClassificationCode = filters.menuClassificationCode
    if (filters.categoryId) params.categoryId = filters.categoryId
    if (filters.franchiseAvailableId) params.storeId = filters.franchiseAvailableId
    if (filters.registeredDateFrom) params.createdAtFrom = `${filters.registeredDateFrom}T00:00:00`
    if (filters.registeredDateTo) params.createdAtTo = `${filters.registeredDateTo}T23:59:59`

    return params
  }, [filters, page, pageSize])

  const { data: response, isLoading: loading } = useMasterMenuList(listParams)
  const { mutateAsync: updateOperationStatus } = useUpdateMenuOperationStatus()

  const totalCount = response?.totalElements ?? 0

  const handleSearch = (params: MenuSearchFormData) => {
    setFilters(params)
    setPage(0)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
    setPage(0)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  const handleCheckedChange = useCallback((hasChecked: boolean) => {
    if (hasChecked) {
      setSearchOpen(false)
    }
  }, [])

  const handleOperationStatusChange = useCallback(async (menuIds: number[], operationStatus: string) => {
    if (!filters.headOfficeOrganizationId) return
    await updateOperationStatus({
      bpId: filters.headOfficeOrganizationId,
      menuIds,
      operationStatus,
    })
  }, [filters.headOfficeOrganizationId, updateOperationStatus])

  return (
    <div className="data-wrap">
      <Location title="마스터용 메뉴 관리" list={BREADCRUMBS} />
      <MenuSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={totalCount}
        searchOpen={searchOpen}
        onSearchOpenChange={setSearchOpen}
      />
      <MenuList
        rows={response?.content ?? []}
        page={page}
        pageSize={pageSize}
        totalPages={response?.totalPages ?? 0}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onCheckedChange={handleCheckedChange}
        onOperationStatusChange={handleOperationStatusChange}
      />
    </div>
  )
}
