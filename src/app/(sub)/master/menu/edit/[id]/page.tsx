import MenuForm from '@/components/master/menu/MenuForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function MenuEditPage({ params }: Props) {
  const { id } = await params
  return <MenuForm menuId={Number(id)} />
}
