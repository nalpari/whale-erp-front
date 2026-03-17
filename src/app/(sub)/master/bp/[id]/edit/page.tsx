import { redirect } from 'next/navigation'
import BpForm from '@/components/master/bp/BpForm'

const BpEditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const idNum = Number(id)

  if (Number.isNaN(idNum) || idNum <= 0) {
    redirect('/master/bp')
  }

  return <BpForm id={idNum} />
}

export default BpEditPage
