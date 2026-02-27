import { redirect } from 'next/navigation'
import MenuForm from '@/components/master/menu/MenuForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MenuEditPage({ params }: Props) {
  const { id } = await params
  const menuId = parseInt(id, 10)

  if (Number.isNaN(menuId)) {
    redirect('/master/menu')
  }

  return <MenuForm menuId={menuId} />
}
