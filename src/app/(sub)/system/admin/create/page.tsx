'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AdminForm, { getInitialFormData } from '@/components/system/admin/AdminForm'
import type { AdminFormData } from '@/components/system/admin/AdminForm'
import { useCreateAdmin } from '@/hooks/queries/use-admin-queries'
import { adminCreateSchema } from '@/lib/schemas/admin'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import { useAlert } from '@/components/common/ui'

/**
 * 관리자 등록 페이지
 */
export default function AdminCreatePage() {
  const router = useRouter()
  const { mutateAsync: createAdmin } = useCreateAdmin()
  const { alert, confirm } = useAlert()

  const [formData, setFormData] = useState<AdminFormData>(getInitialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [idChecked, setIdChecked] = useState(false)

  const handleChange = (data: Partial<AdminFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    // 변경된 필드의 에러 제거
    const clearedErrors = { ...errors }
    for (const key of Object.keys(data)) {
      delete clearedErrors[key]
    }
    setErrors(clearedErrors)
  }

  const handleSave = async () => {
    // Zod 유효성 검사
    const result = adminCreateSchema.safeParse({
      ...formData,
      authorityId: formData.authorityId ?? undefined,
    })

    const fieldErrors: Record<string, string> = result.success ? {} : formatZodFieldErrors(result.error)

    if (!idChecked && !fieldErrors.loginId) {
      fieldErrors.loginId = 'ID 중복 확인이 필요합니다.'
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    if (!result.success) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    try {
      await createAdmin(result.data)
      router.push('/system/admin')
    } catch {
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleList = async () => {
    const confirmed = await confirm('취소하시겠습니까?')
    if (!confirmed) return
    router.push('/system/admin')
  }

  return (
    <div className="data-wrap">
      <Location title="관리자 등록" list={['홈', '시스템 관리', '관리자 관리', '관리자 등록']} />
      <div className="contents-wrap">
        <AdminForm
          mode="create"
          formData={formData}
          errors={errors}
          onChange={handleChange}
          onSave={handleSave}
          onList={handleList}
          onIdCheckStatusChange={setIdChecked}
        />
      </div>
    </div>
  )
}
