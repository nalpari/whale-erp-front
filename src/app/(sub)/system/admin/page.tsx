'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AdminSearchParams } from '@/lib/schemas/admin'
import { useAdminList } from '@/hooks/queries/use-admin-queries'
import { useQueryError } from '@/hooks/useQueryError'
import { useSearchFilterStorage } from '@/hooks/useSearchFilterStorage'
import Location from '@/components/ui/Location'
import AdminSearch from '@/components/system/admin/AdminSearch'
import AdminList from '@/components/system/admin/AdminList'

/**
 * 관리자 관리 메인 페이지
 *
 * 관리자 검색, 목록 조회, 등록 페이지 이동 기능 제공
 * URL 쿼리 파라미터 authorityId가 있으면 해당 권한으로 초기 검색
 */
function AdminContent() {
  const router = useRouter()
  const urlSearchParams = useSearchParams()

  const { savedFilters, saveFilters } = useSearchFilterStorage<AdminSearchParams>('admin-search')
  const initialAuthorityId = urlSearchParams.get('authorityId')
  const [searchParams, _setSearchParams] = useState<AdminSearchParams>(() => {
    if (initialAuthorityId) {
      const id = Number(initialAuthorityId)
      if (!Number.isNaN(id) && id > 0) {
        return { authority_id: id }
      }
    }
    return savedFilters ?? {}
  })
  const setSearchParams = (next: AdminSearchParams) => { _setSearchParams(next); saveFilters(next) }
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const { data, isLoading, error: queryError } = useAdminList({
    ...searchParams,
    page,
    size: pageSize,
  })
  const errorMessage = useQueryError(queryError)

  const handleSearch = (params: AdminSearchParams) => {
    setSearchParams(params)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1) // AG Grid는 0-based, API는 1-based
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  const handleRegister = () => {
    router.push('/system/admin/create')
  }

  return (
    <>
      <Location title="관리자 관리" list={['홈', '시스템 관리', '관리자 관리']} />
      <AdminSearch
        params={searchParams}
        onSearch={handleSearch}
        resultCount={data?.totalElements || 0}
      />
      <AdminList
        error={errorMessage}
        admins={data?.content || []}
        isLoading={isLoading}
        currentPage={page - 1} // AG Grid는 0-based
        totalPages={data?.totalPages || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
      />
    </>
  )
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  )
}
