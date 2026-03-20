'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'
import CubeLoader from '@/components/common/ui/CubeLoader'
import BpForm from '@/components/master/bp/BpForm'
import { useBpDetail } from '@/hooks/queries'

const BpEditPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = use(params)
  const idNum = Number(id)

  if (Number.isNaN(idNum) || idNum <= 0) {
    redirect('/master/bp')
  }

  const { data: bp, isPending } = useBpDetail(idNum)

  if (isPending) {
    return <div className="cube-loader-overlay"><CubeLoader /></div>
  }

  if (!bp) {
    return <div className="empty-wrap"><div className="empty-data">데이터를 찾을 수 없습니다.</div></div>
  }

  return <BpForm key={idNum} id={idNum} bp={bp} />
}

export default BpEditPage
