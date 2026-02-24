import { redirect } from 'next/navigation'
import MenuDetail from '@/components/master/menu/MenuDetail'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MasterMenuDetailPage({ params }: Props) {
  const { id } = await params
  const menuId = parseInt(id, 10)

  if (Number.isNaN(menuId)) {
    redirect('/master/menu')
  }

  return <MenuDetail id={menuId} />
}
