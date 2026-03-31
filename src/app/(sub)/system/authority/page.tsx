'use client'

import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AuthoritySearch from '@/components/system/authority/AuthoritySearch'
import AuthorityList from '@/components/system/authority/AuthorityList'
import { useAuthorityList } from '@/hooks/queries/use-authority-queries'
import type { AuthoritySearchParams } from '@/lib/schemas/authority'
import { useAuthoritySearchStore } from '@/stores/search-stores'

/**
 * 권한 관리 메인 페이지
 *
 * 권한 검색, 목록 조회, 등록 페이지 이동 기능 제공
 */
export default function AuthorityPage() {
  const router = useRouter()

  // 검색 파라미터 상태 (Zustand store - 페이지 이동 후 복귀 시 유지)
  const { searchParams, page, pageSize, setSearchParams, setPage, setPageSize, setHasSearched } = useAuthoritySearchStore()

  // 권한 목록 조회 (store의 page는 0-based, API는 1-based)
  const { data, isLoading } = useAuthorityList({
    ...searchParams,
    page: page + 1,
    size: pageSize,
  })

  // 검색 핸들러
  const handleSearch = (params: AuthoritySearchParams) => {
    setSearchParams(params)
    setPage(0)
    setHasSearched(true)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setPage(newPage) // AG Grid는 0-based, store도 0-based
  }

  // 페이지 크기 변경 핸들러
  const handlePageSizeChange = (size: number) => {
    setPageSize(size) // setPageSize 내부에서 page=0 초기화
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
        currentPage={page} // store, AG Grid 모두 0-based
        totalPages={data?.totalPages || 0}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRegister={handleRegister}
      />
    </>
  )
}
