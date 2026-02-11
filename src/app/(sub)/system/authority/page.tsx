'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AuthoritySearch from '@/components/system/authority/AuthoritySearch'
import AuthorityList from '@/components/system/authority/AuthorityList'
import { useAuthorityList } from '@/hooks/queries/use-authority-queries'
import type { AuthoritySearchParams } from '@/lib/schemas/authority'

/**
 * 권한 관리 메인 페이지
 *
 * 권한 검색, 목록 조회, 등록 페이지 이동 기능 제공
 */
export default function AuthorityPage() {
  const router = useRouter()

  // 검색 파라미터 상태 (초기값: 플랫폼)
  const [searchParams, setSearchParams] = useState<AuthoritySearchParams>({
    owner_group: 'PRGRP_001',
  })

  // 페이징 상태
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // 권한 목록 조회
  const { data, isLoading } = useAuthorityList({
    ...searchParams,
    page,
    size: pageSize,
  })

  // 검색 핸들러
  const handleSearch = (params: AuthoritySearchParams) => {
    setSearchParams(params)
    setPage(1) // 검색 시 첫 페이지로
  }

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1) // AG Grid는 0-based, API는 1-based
  }

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  // 등록 페이지 이동
  const handleRegister = () => {
    router.push('/system/authority/create')
  }

  return (
    <>
      <Location title="권한 관리" list={['홈', '시스템 관리', '권한 관리']} />
      <AuthoritySearch
        params={searchParams}
        onSearch={handleSearch}
        resultCount={data?.totalElements || 0}
      />
      <AuthorityList
        authorities={data?.content || []}
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
