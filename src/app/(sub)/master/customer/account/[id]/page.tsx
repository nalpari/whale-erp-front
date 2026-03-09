import Location from '@/components/ui/Location'
import CustomerDetailData from '@/components/customer/account/CustomerDetailData'

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const customerId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="회원 상세 정보" list={['홈', '회원 관리', '회원 정보 관리', '회원 상세 정보']} />
      <CustomerDetailData customerId={customerId} />
    </div>
  )
}
