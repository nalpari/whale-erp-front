'use client'
import { useState } from 'react'
import Location from '@/components/ui/Location'
import CustomerSearch from '@/components/customer/account/CustomerSearch'
import CustomerList from '@/components/customer/account/CustomerList'
import { useCustomerList } from '@/hooks/queries/use-customer-queries'
import type { CustomerSearchParams } from '@/types/customer'

export default function CustomerAccountPage() {
  // 검색 파라미터
  const [searchParams, setSearchParams] = useState<CustomerSearchParams>({
    page: 0,
    size: 50,
  })

  // TanStack Query로 회원 목록 조회
  const {
    data: customerData,
    isPending: isLoading,
  } = useCustomerList(searchParams)

  // 검색 실행
  const handleSearch = (params: Omit<CustomerSearchParams, 'page' | 'size'>) => {
    const newParams = { ...params, page: 0, size: searchParams.size }
    setSearchParams(newParams)
  }

  // 페이지 변경
  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  // 페이지 사이즈 변경
  const handlePageSizeChange = (size: number) => {
    setSearchParams(prev => ({ ...prev, page: 0, size }))
  }

  // 초기화
  const handleReset = () => {
    setSearchParams({ page: 0, size: searchParams.size })
  }

  return (
    <>
      <Location title="회원 관리" list={['홈', '회원 관리', '회원 정보 관리']} />
      <CustomerSearch
        onSearch={handleSearch}
        onReset={handleReset}
        totalCount={customerData?.totalElements ?? 0}
      />
      <CustomerList
        customers={customerData?.content ?? []}
        isLoading={isLoading}
        currentPage={customerData?.number ?? 0}
        totalPages={customerData?.totalPages ?? 0}
        pageSize={searchParams.size || 50}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </>
  )
}
