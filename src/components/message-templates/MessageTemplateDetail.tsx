'use client'

import { useMessageTemplateDetail } from '@/hooks/queries/use-message-template-queries'
import MessageTemplateForm from '@/components/message-templates/MessageTemplateForm'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface MessageTemplateDetailProps {
  id: number
}

export default function MessageTemplateDetail({ id }: MessageTemplateDetailProps) {
  const { data: template, isPending, error } = useMessageTemplateDetail(id)

  if (isPending) {
    return (
      <div className="cube-loader-overlay">
        <CubeLoader />
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="data-wrap">
        <div className="empty-wrap">
          <div className="empty-data">
            템플릿을 불러올 수 없습니다.
            {error?.message ? ` (${error.message})` : ''}
          </div>
        </div>
      </div>
    )
  }

  return <MessageTemplateForm mode="edit" initial={template} key={template.id} />
}
