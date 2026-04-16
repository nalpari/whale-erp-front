'use client'

import type { Program } from '@/lib/schemas/program'
import type { OwnerCode } from '@/lib/schemas/authority'
import { useProgramList } from '@/hooks/queries/use-program-queries'
import { useAuthorityForm } from '@/hooks/use-authority-form'
import { useAuthStore } from '@/stores/auth-store'
import { OWNER_CODE } from '@/constants/owner-code'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
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
    return <div className="cube-loader-overlay"><CubeLoader /></div>
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
  // 로그인 유저의 계정 타입에 따라 defaultOwnerCode 동적 결정
  // - 가맹점 계정: 가맹점 권한으로 고정 생성
  // - 본사 계정(또는 기타): 본사 권한 기본값, 가맹점 선택 시 자동 전환
  const ownerCode = useAuthStore((state) => state.ownerCode)
  const defaultOwnerCode: OwnerCode =
    ownerCode === OWNER_CODE.FRANCHISE ? 'PRGRP_002_002' : 'PRGRP_002_001'

  const {
    formData,
    errors,
    programTree,
    canManageRead,
    canManageCreateDelete,
    canManageUpdate,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  } = useAuthorityForm({
    mode: 'create',
    programList,
    listPath: '/settings/authority',
    defaultOwnerCode,
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
            canManageRead={canManageRead}
            canManageCreateDelete={canManageCreateDelete}
            canManageUpdate={canManageUpdate}
          />
        </AuthorityForm>
      </div>
    </div>
  )
}
