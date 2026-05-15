import AlimTalkTemplateDetail from '@/components/alim-talk-templates/AlimTalkTemplateDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AlimTalkTemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  return <AlimTalkTemplateDetail id={Number(id)} />
}
