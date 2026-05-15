import MessageTemplateDetail from '@/components/message-templates/MessageTemplateDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MessageTemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  return <MessageTemplateDetail id={Number(id)} />
}
