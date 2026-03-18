'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthoritySearchParams } from '@/lib/schemas/authority'
import { useAuthorityList } from '@/hooks/queries/use-authority-queries'
import type { OfficeFranchiseStoreValue } from '@/components/common/HeadOfficeFranchiseStoreSelect'
import Location from '@/components/ui/Location'
import AuthoritySearch from '@/components/system/authority/AuthoritySearch'
import AuthorityList from '@/components/system/authority/AuthorityList'

/**
 * 환경설정 > 권한 관리 메인 페이지
 *
 * 본사/가맹점 관리자용 - 권한 Group 고정 (PRGRP_002)
 */
export default function SettingsAuthorityPage() {
  const router = useRouter()

  const [searchParams, setSearchParams] = useState<AuthoritySearchParams>({
    owner_group: 'PRGRP_002',
  })

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const { data, isLoading } = useAuthorityList({
    ...searchParams,
    page,
    size: pageSize,
  })

  const handleSearch = (params: AuthoritySearchParams) => {
    setSearchParams(params)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage + 1)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(1)
  }

  // 본사/가맹점 자동 선택 시 검색 파라미터에 반영
  const handleAutoSelect = (value: OfficeFranchiseStoreValue) => {
    if (searchParams.head_office_id != null) return
    setSearchParams((prev) => ({
      ...prev,
      head_office_id: value.head_office ?? undefined,
      franchisee_id: value.franchise ?? undefined,
    }))
  }

  const handleRegister = () => {
    router.push('/settings/authority/create')
  }

  return (
    <>
      <Location title="권한 관리" list={['홈', '환경 설정', '권한 관리']} />
      <AuthoritySearch
        params={searchParams}
        onSearch={handleSearch}
        resultCount={data?.totalElements || 0}
        context="bp"
        onAutoSelect={handleAutoSelect}
      />
      <AuthorityList
        authorities={data?.content || []}
        isLoading={isLoading}
        currentPage={page - 1}
        totalPages={data?.totalPages || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
        detailBasePath="/settings/authority"
      />
    </>
  )
}
