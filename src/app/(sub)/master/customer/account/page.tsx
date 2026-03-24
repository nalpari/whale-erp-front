'use client'
import Location from '@/components/ui/Location'
import CustomerSearch from '@/components/customer/account/CustomerSearch'
import CustomerList from '@/components/customer/account/CustomerList'
import { useCustomerList } from '@/hooks/queries/use-customer-queries'
import { useCustomerSearchStore } from '@/stores/search-stores'
import type { CustomerSearchParams } from '@/types/customer'

export default function CustomerAccountPage() {
  const store = useCustomerSearchStore()

  const queryParams: CustomerSearchParams = {
    ...store.searchParams,
    page: store.page,
    size: store.pageSize,
  }

  const {
    data: customerData,
    isPending: isLoading,
  } = useCustomerList(queryParams)

  const handleSearch = (params: Omit<CustomerSearchParams, 'page' | 'size'>) => {
    store.setSearchParams(params)
    store.setPage(0)
    store.setHasSearched(true)
  }

  const handlePageChange = (page: number) => {
    store.setPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    store.setPageSize(size)
  }

  const handleReset = () => {
    store.reset()
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
        customers={store.hasSearched ? (customerData?.content ?? []) : []}
        isLoading={store.hasSearched && isLoading}
        currentPage={store.page}
        totalPages={customerData?.totalPages ?? 0}
        pageSize={store.pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </>
  )
}
