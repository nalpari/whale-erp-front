'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { BpAdminSearchParams } from '@/types/bp-admin'
import { useBpAdminList } from '@/hooks/queries/use-bp-admin-queries'
import { useQueryError } from '@/hooks/useQueryError'
import { useBpAdminManageSearchStore } from '@/stores/search-stores'
import Location from '@/components/ui/Location'
import BpAdminSearch from '@/components/settings/admin/BpAdminSearch'
import BpAdminList from '@/components/settings/admin/BpAdminList'

/**
 * BP 관리자 관리 메인 페이지
 *
 * BP 관리자 검색, 목록 조회, 등록 페이지 이동 기능 제공
 * URL 쿼리 파라미터 authorityId가 있으면 해당 권한으로 초기 검색
 */
function BpAdminContent() {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  const adminStore = useBpAdminManageSearchStore()
  const restoredParams = adminStore.hasSearched ? adminStore.searchParams : null
  const initialAuthorityId = urlSearchParams.get('authorityId')
  const [searchParams, _setSearchParams] = useState<BpAdminSearchParams>(() => {
    if (initialAuthorityId) {
      const id = Number(initialAuthorityId)
      if (!Number.isNaN(id) && id > 0) {
        return { authority_id: id }
      }
    }
    return restoredParams ?? {}
  })
  const setSearchParams = (next: BpAdminSearchParams) => {
    _setSearchParams(next)
    adminStore.setSearchParams(next)
    adminStore.setHasSearched(true)
  }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  // 자동선택 (본사/가맹 사용자) 완료 또는 PLATFORM ready 시점까지 fetch 보류 (Boston #5).
  // BpAdminSearch 가 mount 후 accountType 결정 시점에 1회 onSearch 를 호출하므로
  // 그 시점에 enabled=true 로 전환되어 정확한 params 로 1회만 fetch.
  const [hasInitialApply, setHasInitialApply] = useState(false)

  const { data, isLoading, error: queryError } = useBpAdminList(
    {
      ...searchParams,
      page,
      size: pageSize,
    },
    { enabled: hasInitialApply },
  )
  const errorMessage = useQueryError(queryError)

  const handleSearch = (params: BpAdminSearchParams) => {
    setSearchParams(params)
    setPage(1)
    if (!hasInitialApply) setHasInitialApply(true)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1) // AG Grid는 0-based, API는 1-based
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleRegister = () => {
    router.push('/settings/admin/create')
  }

  const handleRowClick = (id: number) => {
    router.push(`/settings/admin/${id}`)
  }

  return (
    <>
      <Location title="BP 관리자 관리" list={['홈', '환경설정', 'BP 관리자 관리']} />
      <BpAdminSearch
        params={searchParams}
        onSearch={handleSearch}
        onReset={() => adminStore.reset()}
        resultCount={data?.totalElements || 0}
      />
      <BpAdminList
        error={errorMessage}
        admins={data?.content || []}
        isLoading={isLoading}
        currentPage={page - 1} // AG Grid는 0-based
        totalPages={data?.totalPages || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
        onRowClick={handleRowClick}
      />
    </>
  )
}

export default function BpAdminPage() {
  return (
    <Suspense>
      <BpAdminContent />
    </Suspense>
  )
}
