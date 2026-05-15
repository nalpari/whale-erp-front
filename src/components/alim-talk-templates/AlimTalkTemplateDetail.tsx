'use client'

import { useAlimTalkTemplateDetail } from '@/hooks/queries/use-alim-talk-template-queries'
import AlimTalkTemplateForm from '@/components/alim-talk-templates/AlimTalkTemplateForm'
import CubeLoader from '@/components/common/ui/CubeLoader'

interface AlimTalkTemplateDetailProps {
  id: number
}

export default function AlimTalkTemplateDetail({ id }: AlimTalkTemplateDetailProps) {
  const { data: template, isPending, error } = useAlimTalkTemplateDetail(id)

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

  return <AlimTalkTemplateForm mode="edit" initial={template} key={template.id} />
}
