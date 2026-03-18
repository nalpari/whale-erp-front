'use client'

import type { Program } from '@/lib/schemas/program'
import { useProgramList } from '@/hooks/queries/use-program-queries'
import { useAuthorityForm } from '@/hooks/use-authority-form'
import Location from '@/components/ui/Location'
import AuthorityForm from '@/components/system/authority/AuthorityForm'
import AuthorityProgramTree from '@/components/system/authority/AuthorityProgramTree'

/**
 * 환경설정 > 권한 등록 페이지 (Wrapper)
 *
 * 본사/가맹점 관리자용 - 권한 소유 숨김, 초기 owner_code BP
 */
export default function SettingsAuthorityCreatePage() {
  const { data: programList, isPending, isError } = useProgramList('MNKND_001')

  if (isPending) {
    return <div></div>
  }

  if (isError) {
    return (
      <div className="data-wrap">
        <Location title="권한 등록" list={['홈', '환경 설정', '권한 관리', '권한 등록']} />
        <div className="contents-wrap">프로그램 목록을 불러오는 데 실패했습니다.</div>
      </div>
    )
  }

  return <SettingsAuthorityCreateContent programList={programList ?? []} />
}

function SettingsAuthorityCreateContent({ programList }: { programList: Program[] }) {
  const {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  } = useAuthorityForm({
    mode: 'create',
    programList,
    listPath: '/settings/authority',
    defaultOwnerCode: 'PRGRP_002_001',
  })

  return (
    <div className="data-wrap">
      <Location title="권한 등록" list={['홈', '환경 설정', '권한 관리', '권한 등록']} />
      <div className="contents-wrap">
        <AuthorityForm
          mode="create"
          initialData={formData}
          onChange={handleFormChange}
          onList={handleList}
          onSave={handleSave}
          errors={errors}
          context="bp"
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
