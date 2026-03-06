'use client'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ICellRendererParams, ColDef } from 'ag-grid-community'
import AgGrid from '@/components/ui/AgGrid'
import Pagination from '@/components/ui/Pagination'
import SearchSelect, { type SelectOption } from '@/components/ui/common/SearchSelect'
import type { CustomerListItem } from '@/types/customer'

// AG Grid 용 row data
interface CustomerRowData {
  id: number
  rowNumber: number
  isOperate: string
  name: string
  loginId: string
  mobilePhone: string
  socialAuthType: string
  joinDate: string
}

// 운영여부 뱃지 렌더러
const OperateStatusRenderer = (params: ICellRendererParams<CustomerRowData>) => {
  const isOperate = params.value === '운영'
  return (
    <span style={{ color: isOperate ? '#28a745' : '#dc3545' }}>
      {params.value}
    </span>
  )
}

// 회원명 렌더러 (마스킹)
const CustomerNameRenderer = (params: ICellRendererParams<CustomerRowData>) => {
  // 마스킹: 홍길동 → 홍*동
  const maskName = (name: string) => {
    if (name.length <= 1) return name
    if (name.length === 2) return name[0] + '*'
    return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
  }

  return (
    <span className="btn-link">
      {maskName(params.value || '')}
    </span>
  )
}

// 간편인증 텍스트 변환
const socialAuthTypeMap: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
}

interface CustomerListProps {
  customers: CustomerListItem[]
  isLoading: boolean
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export default function CustomerList({
  customers,
  isLoading,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: CustomerListProps) {
  const router = useRouter()

  // 페이지 사이즈 옵션
  const pageSizeOptions: SelectOption[] = useMemo(() => [
    { value: '50', label: '50' },
    { value: '100', label: '100' },
    { value: '200', label: '200' },
  ], [])

  // row data 변환
  const rowData: CustomerRowData[] = customers.map((item, index) => ({
    id: item.id,
    rowNumber: index + 1 + currentPage * pageSize,
    isOperate: item.isOperate === 1 ? '운영' : '탈퇴',
    name: item.name,
    loginId: item.loginId,
    mobilePhone: item.mobilePhone || '-',
    socialAuthType: item.socialAuthType ? (socialAuthTypeMap[item.socialAuthType] || item.socialAuthType) : '없음',
    joinDate: item.joinDate ? item.joinDate.replace('T', ' ').substring(0, 16) : '-',
  }))

  const handleNavigateToDetail = (id: number) => {
    router.push(`/master/customer/account/${id}`)
  }

  // 컬럼 정의
  const columnDefs: ColDef<CustomerRowData>[] = [
    {
      headerName: '#',
      flex: 1,
      valueGetter: (params) => params.data?.rowNumber ?? 0,
    },
    {
      headerName: '운영여부',
      field: 'isOperate',
      flex: 1,
      cellRenderer: OperateStatusRenderer,
    },
    {
      headerName: '회원명',
      field: 'name',
      flex: 1,
      cellRenderer: CustomerNameRenderer,
    },
    {
      headerName: '회원 ID',
      field: 'loginId',
      flex: 1,
    },
    {
      headerName: '휴대폰 번호',
      field: 'mobilePhone',
      flex: 1,
    },
    {
      headerName: '간편인증',
      field: 'socialAuthType',
      flex: 1,
    },
    {
      headerName: '가입일시',
      field: 'joinDate',
      flex: 1,
    },
  ]

  return (
    <div className="data-list-wrap">
      <div className="data-list-header">
        <div className="data-header-left"></div>
        <div className="data-header-right">
          <div className="data-count-select">
            <SearchSelect
              options={pageSizeOptions}
              value={pageSizeOptions.find(opt => opt.value === String(pageSize)) || null}
              onChange={(opt) => onPageSizeChange(opt?.value ? Number(opt.value) : 50)}
              placeholder="50"
              isClearable={false}
              isSearchable={false}
            />
          </div>
        </div>
      </div>
      <div className="data-list-bx">
        {isLoading ? (
          <div></div>
        ) : rowData.length === 0 ? (
          <div className="empty-wrap">
            <div className="empty-data">검색 결과가 없습니다.</div>
          </div>
        ) : (
          <AgGrid
            rowData={rowData}
            columnDefs={columnDefs}
            onRowClicked={(event) => {
              if (event.data) handleNavigateToDetail(event.data.id)
            }}
          />
        )}
        {!isLoading && rowData.length > 0 && (
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
