'use client'

import { useState } from 'react'
import { redirect, useParams, useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AdminForm, { getInitialFormData } from '@/components/system/admin/AdminForm'
import type { AdminFormData } from '@/components/system/admin/AdminForm'
import {
  useAdminDetail,
  useUpdateAdmin,
  useDeleteAdmin,
} from '@/hooks/queries/use-admin-queries'
import { adminUpdateSchema } from '@/lib/schemas/admin'
import type { AdminDetail } from '@/lib/schemas/admin'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'

/**
 * 관리자 상세/수정 페이지 (Wrapper)
 */
export default function AdminEditPage() {
  const params = useParams()
  const adminId = Number(params.id)
  const isValidId = !Number.isNaN(adminId) && adminId > 0

  const { data: admin, isLoading, isError } = useAdminDetail(isValidId ? adminId : 0)

  if (!isValidId) {
    redirect('/system/admin')
  }

  if (isLoading) {
    return <CubeLoader />
  }

  if (isError) {
    return (
      <div className="data-wrap">
        <Location title="관리자 상세" list={['홈', '시스템 관리', '관리자 관리', '관리자 상세']} />
        <div className="contents-wrap text-red-500">관리자 정보를 불러오는 데 실패했습니다.</div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="data-wrap">
        <Location title="관리자 상세" list={['홈', '시스템 관리', '관리자 관리', '관리자 상세']} />
        <div className="contents-wrap text-red-500">관리자를 찾을 수 없습니다.</div>
      </div>
    )
  }

  return <AdminEditContent adminId={adminId} admin={admin} />
}

/**
 * 관리자 수정 콘텐츠 (Content)
 */
function AdminEditContent({
  adminId,
  admin,
}: {
  adminId: number
  admin: AdminDetail
}) {
  const router = useRouter()
  const { mutateAsync: updateAdmin } = useUpdateAdmin()
  const { mutateAsync: deleteAdmin } = useDeleteAdmin()
  const { alert, confirm } = useAlert()
  const [formData, setFormData] = useState<AdminFormData>(() => getInitialFormData(admin))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (data: Partial<AdminFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    const clearedErrors = { ...errors }
    for (const key of Object.keys(data)) {
      delete clearedErrors[key]
    }
    setErrors(clearedErrors)
  }

  const handleSave = async () => {
    const result = adminUpdateSchema.safeParse({
      ...formData,
      authorityId: formData.authorityId ?? undefined,
    })

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    try {
      await updateAdmin({ id: adminId, data: result.data })
      router.push('/system/admin')
    } catch {
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteAdmin(adminId)
      router.push('/system/admin')
    } catch {
      await alert('삭제에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleList = async () => {
    const confirmed = await confirm('취소하시겠습니까?')
    if (!confirmed) return
    router.push('/system/admin')
  }

  return (
    <div className="data-wrap">
      <Location title="관리자 상세" list={['홈', '시스템 관리', '관리자 관리', '관리자 상세']} />
      <div className="contents-wrap">
        <AdminForm
          mode="edit"
          formData={formData}
          errors={errors}
          admin={admin}
          onChange={handleChange}
          onSave={handleSave}
          onDelete={handleDelete}
          onList={handleList}
        />
      </div>
    </div>
  )
}
