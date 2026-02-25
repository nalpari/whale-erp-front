'use client'

import { useMemo, useCallback } from 'react'
import Location from '@/components/ui/Location'
import MenuSearch from '@/components/master/menu/MenuSearch'
import MenuList from '@/components/master/menu/MenuList'
import { useMasterMenuList, useUpdateMenuOperationStatus, type MasterMenuListParams } from '@/hooks/queries'
import { useAlert } from '@/components/common/ui'
import { getErrorMessage } from '@/lib/api'
import { useMenuSearchStore, type MenuSearchFormData } from '@/stores/menu-search-store'

const BREADCRUMBS = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master']

export default function Menus() {
  const filters = useMenuSearchStore((s) => s.filters)
  const page = useMenuSearchStore((s) => s.page)
  const pageSize = useMenuSearchStore((s) => s.pageSize)
  const searchOpen = useMenuSearchStore((s) => s.searchOpen)
  const setFilters = useMenuSearchStore((s) => s.setFilters)
  const setPage = useMenuSearchStore((s) => s.setPage)
  const setPageSize = useMenuSearchStore((s) => s.setPageSize)
  const setSearchOpen = useMenuSearchStore((s) => s.setSearchOpen)
  const reset = useMenuSearchStore((s) => s.reset)

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
    reset()
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
  }

  const handleCheckedChange = useCallback((hasChecked: boolean) => {
    if (hasChecked) {
      setSearchOpen(false)
    }
  }, [setSearchOpen])

  const { alert, confirm } = useAlert()

  const handleOperationStatusChange = async (menuIds: number[], operationStatus: string) => {
    if (!filters.headOfficeOrganizationId) return
    const confirmed = await confirm('적용하시겠습니까?')
    if (!confirmed) return
    try {
      await updateOperationStatus({
        bpId: filters.headOfficeOrganizationId,
        menuIds,
        operationStatus,
      })
    } catch (error) {
      await alert(getErrorMessage(error, '운영 상태 변경에 실패했습니다.'))
    }
  }

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
        bpId={filters.headOfficeOrganizationId ?? null}
        onPageChange={setPage}
        onPageSizeChange={handlePageSizeChange}
        onCheckedChange={handleCheckedChange}
        onOperationStatusChange={handleOperationStatusChange}
      />
    </div>
  )
}
