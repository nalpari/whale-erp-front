'use client'

import { useState } from 'react'
import { redirect, useParams, useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import BpAdminForm, { getInitialFormData } from '@/components/settings/admin/BpAdminForm'
import type { BpAdminFormData } from '@/types/bp-admin'
import {
  useBpAdminDetail,
  useUpdateBpAdmin,
  useDeleteBpAdmin,
} from '@/hooks/queries/use-bp-admin-queries'
import { bpAdminUpdateRequestSchema, type BpAdminDetail } from '@/lib/schemas/bp-admin'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'

/**
 * BP 관리자 상세/수정 페이지 (Wrapper)
 */
export default function BpAdminEditPage() {
  const params = useParams()
  const adminId = Number(params.id)
  const isValidId = !Number.isNaN(adminId) && adminId > 0

  const { data: admin, isLoading, isError } = useBpAdminDetail(isValidId ? adminId : 0)

  if (!isValidId) {
    redirect('/settings/admin')
  }

  if (isLoading) {
    return <CubeLoader />
  }

  if (isError) {
    return (
      <div className="data-wrap">
        <Location
          title="BP 관리자 상세"
          list={['홈', '환경설정', 'BP 관리자 관리', '관리자 상세']}
        />
        <div className="contents-wrap text-red-500">
          관리자 정보를 불러오는 데 실패했습니다.
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="data-wrap">
        <Location
          title="BP 관리자 상세"
          list={['홈', '환경설정', 'BP 관리자 관리', '관리자 상세']}
        />
        <div className="contents-wrap text-red-500">관리자를 찾을 수 없습니다.</div>
      </div>
    )
  }

  return <BpAdminEditContent adminId={adminId} admin={admin} />
}

/**
 * BP 관리자 수정 콘텐츠 (Content)
 */
function BpAdminEditContent({
  adminId,
  admin,
}: {
  adminId: number
  admin: BpAdminDetail
}) {
  const router = useRouter()
  const { mutateAsync: updateBpAdmin } = useUpdateBpAdmin()
  const { mutateAsync: deleteBpAdmin } = useDeleteBpAdmin()
  const { alert, confirm } = useAlert()
  const [formData, setFormData] = useState<BpAdminFormData>(() => getInitialFormData(admin))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (data: Partial<BpAdminFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    const clearedErrors = { ...errors }
    for (const key of Object.keys(data)) {
      delete clearedErrors[key]
    }
    setErrors(clearedErrors)
  }

  const handleSave = async () => {
    // 수정 body에는 organizationId가 없으므로 권한 미선택만 친화 메시지 처리
    const preErrors: Record<string, string> = {}
    if (formData.authorityId == null) {
      preErrors.authorityId = '권한을 선택해주세요.'
    }

    const result = bpAdminUpdateRequestSchema.safeParse({
      name: formData.name.trim(),
      userType: formData.userType,
      department: formData.department.trim() || null,
      rank: formData.rank || null,
      mobilePhone: formData.mobilePhone.replace(/\D/g, '') || '',
      officePhone: formData.officePhone.replace(/\D/g, '') || null,
      extensionNumber: formData.extensionNumber.trim() || null,
      email: formData.email.trim() || null,
      authorityId: formData.authorityId ?? undefined,
    })

    const fieldErrors: Record<string, string> = {
      ...(result.success ? {} : formatZodFieldErrors(result.error)),
      ...preErrors, // 친화 메시지가 Zod 기본 메시지를 덮어쓰도록 마지막에 spread
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    if (!result.success) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    try {
      await updateBpAdmin({ id: adminId, data: result.data })
      router.push('/settings/admin')
    } catch {
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteBpAdmin(adminId)
      router.push('/settings/admin')
    } catch {
      await alert('삭제에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleList = async () => {
    const confirmed = await confirm('취소하시겠습니까?')
    if (!confirmed) return
    router.push('/settings/admin')
  }

  return (
    <div className="data-wrap">
      <Location
        title="BP 관리자 상세"
        list={['홈', '환경설정', 'BP 관리자 관리', '관리자 상세']}
      />
      <div className="contents-wrap">
        <BpAdminForm
          key={`edit-${adminId}`}
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
