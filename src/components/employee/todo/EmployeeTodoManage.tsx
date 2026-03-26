'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import { useQueryError } from '@/hooks/useQueryError'
import { useEmployeeTodoSearchStore } from '@/stores/search-stores'
import { useEmployeeTodoList, useDeleteEmployeeTodos } from '@/hooks/queries'
import EmployeeTodoSearch, {
  type EmployeeTodoSearchFilters,
  type EmployeeTodoFilterTagKey,
  DEFAULT_TODO_FILTERS,
} from './EmployeeTodoSearch'
import EmployeeTodoList from './EmployeeTodoList'
import type { EmployeeTodoListParams } from '@/types/employee-todo'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'

const BREADCRUMBS = ['Home', '직원 관리', '직원별 TO-DO 관리']

export default function EmployeeTodoManage() {
  const router = useRouter()
  const { alert, confirm } = useAlert()

  const searchStore = useEmployeeTodoSearchStore()
  const restoredFilters = searchStore.hasSearched ? searchStore.searchParams : null

  const [filters, setFilters] = useState<EmployeeTodoSearchFilters>(restoredFilters ?? DEFAULT_TODO_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<EmployeeTodoSearchFilters>(restoredFilters ?? DEFAULT_TODO_FILTERS)
  const setAppliedFilters = (next: EmployeeTodoSearchFilters) => {
    _setAppliedFilters(next)
    searchStore.setSearchParams(next )
    searchStore.setHasSearched(true)
  }
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const handleAutoSelect = (value: OfficeFranchiseStoreValue) => {
    if (appliedFilters.officeId != null) return
    const autoFilters = {
      ...DEFAULT_TODO_FILTERS,
      officeId: value.head_office,
      franchiseId: value.franchise,
    }
    setFilters(autoFilters)
    setAppliedFilters(autoFilters)
  }

  // API 파라미터 변환 — officeId가 있을 때만 유효한 queryParams 생성
  const { officeId: appliedOfficeId } = appliedFilters
  const canFetch = appliedOfficeId != null
  const queryParams: EmployeeTodoListParams | null = canFetch
    ? {
        headOfficeId: appliedOfficeId,
        franchiseId: appliedFilters.franchiseId ?? undefined,
        storeId: appliedFilters.storeId ?? undefined,
        employeeName: appliedFilters.employeeName || undefined,
        isCompleted: appliedFilters.isCompleted === 'ALL' ? undefined : appliedFilters.isCompleted === 'true',
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined,
        content: appliedFilters.content || undefined,
        page,
        size: pageSize,
      }
    : null

  const { data: response, isFetching: loading, error: queryError } = useEmployeeTodoList(queryParams, canFetch)
  const errorMessage = useQueryError(queryError)
  const { mutateAsync: deleteTodos } = useDeleteEmployeeTodos()

  const listData = response?.content ?? []
  const totalCount = response?.totalElements ?? 0
  const totalPages = response?.totalPages ?? 1

  const handleSearch = () => {
    setAppliedFilters(filters)
    setPage(0)
    setSelectedIds(new Set())
  }

  // 초기화: 검색 폼만 초기화, 목록 데이터는 유지 (검색 버튼으로 재검색해야 반영)
  const handleReset = () => {
    setFilters(DEFAULT_TODO_FILTERS)
    searchStore.reset()
  }

  const handleRemoveFilter = (key: EmployeeTodoFilterTagKey) => {
    // 상위 조직 태그 제거 시 하위 값(점포, 직원명 등)은 유지
    // → 재검색 결과에 포함되면 태그가 다시 표시되고, 없으면 서버가 무시
    const resetMap: Record<string, Partial<EmployeeTodoSearchFilters>> = {
      office: { officeId: null },
      franchise: { franchiseId: null },
      store: { storeId: null },
      employeeName: { employeeName: '' },
      isCompleted: { isCompleted: 'ALL' },
      date: { startDate: '', endDate: '' },
      content: { content: '' },
    }
    const patch = resetMap[key]
    if (!patch) return
    const nextFilters = { ...appliedFilters, ...patch }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setPage(0)
  }

  const handleDelete = async () => {
    if (selectedIds.size === 0) {
      await alert('삭제할 항목을 선택해주세요.')
      return
    }
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteTodos([...selectedIds])
      setSelectedIds(new Set())
    } catch {
      await alert('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleRegister = () => {
    router.push('/employee/todo/create')
  }

  return (
    <div className="data-wrap">
      <Location title="TO-DO 관리" list={BREADCRUMBS} />
      <EmployeeTodoSearch
        filters={filters}
        appliedFilters={appliedFilters}
        resultCount={totalCount}
        onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
        onSearch={handleSearch}
        onReset={handleReset}
        onRemoveFilter={handleRemoveFilter}
        onAutoSelect={handleAutoSelect}
      />
      <EmployeeTodoList
        rows={listData}
        isLoading={loading}
        error={errorMessage}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        selectedIds={selectedIds}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(0) }}
        onSelectionChange={setSelectedIds}
        onDelete={handleDelete}
        onRegister={handleRegister}
      />
    </div>
  )
}
