import MenuDetail from '@/components/master/menu/MenuDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MasterMenuDetailPage({ params }: Props) {
  const { id } = await params
  return <MenuDetail id={Number(id)} />
}
