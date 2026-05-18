import MessageTemplateForm from '@/components/message-templates/MessageTemplateForm'
import type { SendType } from '@/types/notification'

const SEND_TYPES: SendType[] = ['ALIM_TALK', 'EMAIL', 'SMS']

interface PageProps {
  searchParams: Promise<{ sendType?: string }>
}

export default async function MessageTemplateNewPage({ searchParams }: PageProps) {
  const { sendType: rawSendType } = await searchParams
  const sendType: SendType = SEND_TYPES.includes(rawSendType as SendType)
    ? (rawSendType as SendType)
    : 'ALIM_TALK'

  return <MessageTemplateForm mode="create" sendType={sendType} />
}
