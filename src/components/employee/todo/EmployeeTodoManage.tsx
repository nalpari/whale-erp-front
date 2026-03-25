'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import { useQueryError } from '@/hooks/useQueryError'
import { useSearchFilterStorage } from '@/hooks/useSearchFilterStorage'
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

  const { savedFilters, saveFilters, clearFilters } = useSearchFilterStorage<EmployeeTodoSearchFilters>(
    'employee-todo-search',
  )

  const [filters, setFilters] = useState<EmployeeTodoSearchFilters>(savedFilters ?? DEFAULT_TODO_FILTERS)
  const [appliedFilters, _setAppliedFilters] = useState<EmployeeTodoSearchFilters>(savedFilters ?? DEFAULT_TODO_FILTERS)
  const setAppliedFilters = useCallback(
    (next: EmployeeTodoSearchFilters) => { _setAppliedFilters(next); saveFilters(next) },
    [saveFilters],
  )
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
  const canFetch = appliedFilters.officeId != null
  const queryParams: EmployeeTodoListParams | null = canFetch
    ? {
        headOfficeId: appliedFilters.officeId,
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

  const handleReset = () => {
    setFilters(DEFAULT_TODO_FILTERS)
    _setAppliedFilters(DEFAULT_TODO_FILTERS)
    clearFilters()
    setPage(0)
    setSelectedIds(new Set())
  }

  const handleRemoveFilter = (key: EmployeeTodoFilterTagKey) => {
    const resetMap: Record<string, Partial<EmployeeTodoSearchFilters>> = {
      office: { officeId: null, franchiseId: null, storeId: null },
      franchise: { franchiseId: null, storeId: null },
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
    if (key === 'office') return
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
