'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AdminSearch from '@/components/system/admin/AdminSearch'
import AdminList from '@/components/system/admin/AdminList'
import { useAdminList } from '@/hooks/queries/use-admin-queries'
import type { AdminSearchParams } from '@/lib/schemas/admin'

/**
 * 관리자 관리 메인 페이지
 *
 * 관리자 검색, 목록 조회, 등록 페이지 이동 기능 제공
 */
export default function AdminPage() {
  const router = useRouter()

  const [searchParams, setSearchParams] = useState<AdminSearchParams>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const { data, isLoading, isError } = useAdminList({
    ...searchParams,
    page,
    size: pageSize,
  })

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
      {isError && (
        <div className="text-red-500 text-sm p-4">관리자 목록을 불러오는 데 실패했습니다.</div>
      )}
      <AdminList
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
