import { notFound } from 'next/navigation'
import MessageTemplateForm from '@/components/message-templates/MessageTemplateForm'
import type { SendType } from '@/types/notification'

// 이번 범위는 알림톡(ALIM_TALK) 전용 — EMAIL/SMS 는 미지원이므로 등록 폼 진입을 차단한다.
// (Codex MEDIUM — ?sendType=EMAIL/SMS 직접 진입 시 알림톡 저장 경로로 미지원 타입이 유입되는 문제)
const SUPPORTED_SEND_TYPES: SendType[] = ['ALIM_TALK']

interface PageProps {
  searchParams: Promise<{ sendType?: string }>
}

export default async function MessageTemplateNewPage({ searchParams }: PageProps) {
  const { sendType: rawSendType } = await searchParams
  // sendType 미지정은 기본값(ALIM_TALK) 허용, 지정했는데 미지원 타입이면 404 처리
  if (rawSendType != null && !SUPPORTED_SEND_TYPES.includes(rawSendType as SendType)) {
    notFound()
  }

  return <MessageTemplateForm mode="create" sendType="ALIM_TALK" />
}
