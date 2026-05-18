import { notFound } from 'next/navigation'

import MessageTemplateDetail from '@/components/message-templates/MessageTemplateDetail'
import type { SendType } from '@/types/notification'

const SEND_TYPES: SendType[] = ['ALIM_TALK', 'EMAIL', 'SMS']

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sendType?: string }>
}

export default async function MessageTemplateDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const numericId = Number(id)
  // TanStack Query v5에서 enabled:false 쿼리는 isPending:true로 평가되어
  // useMessageTemplateDetail의 `enabled && id > 0` 가드만으로는 NaN/음수 진입 시
  // 영구 CubeLoader 상태가 됨 → 페이지 진입 시점에 차단
  if (!Number.isFinite(numericId) || numericId <= 0) {
    notFound()
  }

  const { sendType: rawSendType } = await searchParams
  const sendType: SendType = SEND_TYPES.includes(rawSendType as SendType)
    ? (rawSendType as SendType)
    : 'ALIM_TALK'

  return <MessageTemplateDetail id={numericId} sendType={sendType} />
}
