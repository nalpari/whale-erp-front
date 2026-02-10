'use client'

import { useAuthorityForm } from '@/hooks/use-authority-form'
import Location from '@/components/ui/Location'
import AuthorityForm from '@/components/system/authority/AuthorityForm'
import AuthorityProgramTree from '@/components/system/authority/AuthorityProgramTree'

/**
 * 권한 등록 페이지
 *
 * 권한 기본 정보 입력 및 프로그램별 권한 설정
 */
export default function AuthorityCreatePage() {
  const {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  } = useAuthorityForm({ mode: 'create' })

  return (
    <div className="data-wrap">
      <Location title="권한 등록" list={['홈', '시스템 관리', '권한 관리', '권한 등록']} />
      <div className="contents-wrap">
        <AuthorityForm
          mode="create"
          initialData={formData}
          onChange={handleFormChange}
          onList={handleList}
          onSave={handleSave}
          errors={errors}
        >
          <AuthorityProgramTree
            programTree={programTree}
            onChange={handleProgramTreeChange}
            currentOwnerCode={formData.owner_code}
          />
        </AuthorityForm>
      </div>
    </div>
  )
}
