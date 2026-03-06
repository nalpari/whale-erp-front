import Location from '@/components/ui/Location'
import CustomerEdit from '@/components/customer/account/CustomerEdit'

interface CustomerEditPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerEditPage({ params }: CustomerEditPageProps) {
  const { id } = await params
  const customerId = parseInt(id, 10)

  return (
    <div className="data-wrap">
      <Location title="회원 정보 수정" list={['홈', '회원 관리', '회원 정보 관리', '회원 정보 수정']} />
      <CustomerEdit customerId={customerId} />
    </div>
  )
}
