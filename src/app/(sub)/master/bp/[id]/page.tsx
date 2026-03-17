import { redirect } from 'next/navigation'
import BpDetailView from '@/components/master/bp/BpDetailView'

const BpDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const idNum = Number(id)

  if (Number.isNaN(idNum) || idNum <= 0) {
    redirect('/master/bp')
  }

  return <BpDetailView id={idNum} />
}

export default BpDetailPage
