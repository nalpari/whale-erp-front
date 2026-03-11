import BpDetailView from '@/components/master/bp/BpDetailView'

const BpDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params

  return <BpDetailView id={Number(id)} />
}

export default BpDetailPage
