import BpForm from '@/components/master/bp/BpForm'

const BpEditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  return <BpForm id={Number(id)} />
}

export default BpEditPage
