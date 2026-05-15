import MessageTemplateDetail from '@/components/message-templates/MessageTemplateDetail'
import type { SendType } from '@/types/notification'

const SEND_TYPES: SendType[] = ['ALIM_TALK', 'EMAIL', 'SMS']

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sendType?: string }>
}

export default async function MessageTemplateDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { sendType: rawSendType } = await searchParams
  const sendType: SendType = SEND_TYPES.includes(rawSendType as SendType)
    ? (rawSendType as SendType)
    : 'ALIM_TALK'

  return <MessageTemplateDetail id={Number(id)} sendType={sendType} />
}
