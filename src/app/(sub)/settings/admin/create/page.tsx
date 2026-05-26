'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import BpAdminForm, { getInitialFormData } from '@/components/settings/admin/BpAdminForm'
import type { BpAdminFormData } from '@/types/bp-admin'
import { useCreateBpAdmin } from '@/hooks/queries/use-bp-admin-queries'
import { bpAdminCreateRequestSchema } from '@/lib/schemas/bp-admin'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import { useAlert } from '@/components/common/ui'

/**
 * BP 관리자 등록 페이지
 */
export default function BpAdminCreatePage() {
  const router = useRouter()
  const { mutateAsync: createBpAdmin } = useCreateBpAdmin()
  const { alert, confirm } = useAlert()

  const [formData, setFormData] = useState<BpAdminFormData>(getInitialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [idChecked, setIdChecked] = useState(false)

  const handleChange = (data: Partial<BpAdminFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
    // 변경된 필드의 에러 제거
    const clearedErrors = { ...errors }
    for (const key of Object.keys(data)) {
      delete clearedErrors[key]
    }
    setErrors(clearedErrors)
  }

  const handleSave = async () => {
    // 폼 단계 null 가드 — Zod에서 잡히긴 하지만 친화적 메시지 제공
    const preErrors: Record<string, string> = {}
    if (formData.headOfficeOrganizationId == null) {
      preErrors.headOfficeOrganizationId = '소속 본사를 선택해주세요.'
    }
    if (formData.adminType === 'FRANCHISE' && formData.franchiseOrganizationId == null) {
      preErrors.franchiseOrganizationId = '소속 가맹을 선택해주세요.'
    }
    if (formData.authorityId == null) {
      preErrors.authorityId = '권한을 선택해주세요.'
    }

    // BE 명세에 맞춰 organizationId 단일로 변환
    const effectiveOrganizationId =
      formData.adminType === 'FRANCHISE'
        ? formData.franchiseOrganizationId
        : formData.headOfficeOrganizationId

    // Zod 유효성 검사 (digit-only 처리 포함)
    const result = bpAdminCreateRequestSchema.safeParse({
      name: formData.name.trim(),
      userType: formData.userType,
      department: formData.department.trim() || null,
      rank: formData.rank || null,
      mobilePhone: formData.mobilePhone.replace(/\D/g, '') || '',
      officePhone: formData.officePhone.replace(/\D/g, '') || null,
      extensionNumber: formData.extensionNumber.trim() || null,
      loginId: formData.loginId,
      password: formData.password,
      email: formData.email.trim() || null,
      organizationId: effectiveOrganizationId ?? undefined,
      authorityId: formData.authorityId ?? undefined,
    })

    const zodErrors: Record<string, string> = result.success
      ? {}
      : formatZodFieldErrors(result.error)

    // BE schema의 organizationId 에러를 폼 UI 키(헤드오피스/가맹)로 재매핑
    if (zodErrors.organizationId) {
      const targetKey =
        formData.adminType === 'FRANCHISE'
          ? 'franchiseOrganizationId'
          : 'headOfficeOrganizationId'
      zodErrors[targetKey] = zodErrors[targetKey] ?? zodErrors.organizationId
      delete zodErrors.organizationId
    }

    const fieldErrors: Record<string, string> = {
      ...zodErrors,
      ...preErrors, // 친화 메시지가 Zod 기본 메시지를 덮어쓰도록 마지막에 spread
    }

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
      await createBpAdmin(result.data)
      router.push('/settings/admin')
    } catch {
      await alert('저장에 실패하였습니다. 잠시 후 다시 시도해주세요.')
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
        title="BP 관리자 등록"
        list={['홈', '환경설정', 'BP 관리자 관리', '관리자 등록']}
      />
      <div className="contents-wrap">
        <BpAdminForm
          key="create"
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
