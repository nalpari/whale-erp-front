'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AdminForm, { getInitialFormData } from '@/components/system/admin/AdminForm'
import type { AdminFormData } from '@/components/system/admin/AdminForm'
import { useCreateAdmin } from '@/hooks/queries/use-admin-queries'
import { adminCreateSchema } from '@/lib/schemas/admin'
import { getErrorMessage } from '@/lib/api'
import { formatZodFieldErrors } from '@/lib/zod-utils'

/**
 * 관리자 등록 페이지
 */
export default function AdminCreatePage() {
  const router = useRouter()
  const { mutateAsync: createAdmin } = useCreateAdmin()

  const [formData, setFormData] = useState<AdminFormData>(getInitialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    if (!result.success) {
      setErrors(formatZodFieldErrors(result.error))
      return
    }

    try {
      await createAdmin(result.data)
      alert('관리자가 등록되었습니다.')
      router.push('/system/admin')
    } catch (error) {
      alert(`관리자 등록 실패: ${getErrorMessage(error)}`)
    }
  }

  const handleList = () => {
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
        />
      </div>
    </div>
  )
}
