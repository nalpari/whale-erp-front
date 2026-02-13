import Location from '@/components/ui/Location'
import CategoryManage from '@/components/category/CategoryManage'

export default function CategoryMasterPage() {
  return (
    <div className="data-wrap">
      <Location title="마스터용 카테고리 관리" list={['마스터', '카테고리 관리']} />
      <CategoryManage />
    </div>
  )
}
