'use client'

import type { Program } from '@/lib/schemas/program'
import { useProgramList } from '@/hooks/queries/use-program-queries'
import { useAuthorityForm } from '@/hooks/use-authority-form'
import Location from '@/components/ui/Location'
import AuthorityForm from '@/components/system/authority/AuthorityForm'
import AuthorityProgramTree from '@/components/system/authority/AuthorityProgramTree'

/**
 * 권한 등록 페이지 (Wrapper)
 *
 * programList 로딩 후 Content를 렌더하여 useState 초기값에서 직접 사용
 */
export default function AuthorityCreatePage() {
  const { data: programList, isPending } = useProgramList('MNKND_001')

  if (isPending) {
    return <div></div>
  }

  return <AuthorityCreateContent programList={programList ?? []} />
}

/**
 * 권한 등록 콘텐츠 (Content)
 *
 * 확정된 programList를 받아 useAuthorityForm에서 바로 사용
 */
function AuthorityCreateContent({ programList }: { programList: Program[] }) {
  const {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  } = useAuthorityForm({ mode: 'create', programList })

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
