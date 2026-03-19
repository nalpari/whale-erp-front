'use client'

import { useParams, useRouter } from 'next/navigation'

import { getErrorMessage } from '@/lib/api'
import type { AuthorityResponse, OwnerCode } from '@/lib/schemas/authority'
import { useAuthorityDetail, useDeleteAuthority } from '@/hooks/queries/use-authority-queries'
import { useAuthorityForm } from '@/hooks/use-authority-form'
import Location from '@/components/ui/Location'
import AuthorityForm from '@/components/system/authority/AuthorityForm'
import AuthorityProgramTree from '@/components/system/authority/AuthorityProgramTree'
import { useAlert } from '@/components/common/ui'

/**
 * 환경설정 > 권한 상세 페이지 (Wrapper)
 *
 * 본사/가맹점 관리자용 - 권한 소유 숨김
 */
export default function SettingsAuthorityEditPage() {
  const params = useParams()
  const authorityId = Number(params.id)
  const isValidId = !Number.isNaN(authorityId) && authorityId > 0

  const { data: authority, isLoading, isError } = useAuthorityDetail(isValidId ? authorityId : 0)

  if (!isValidId) {
    return (
      <div className="data-wrap">
        <Location title="권한 상세" list={['홈', '환경 설정', '권한 관리', '권한 상세']} />
        <div className="contents-wrap">잘못된 권한 ID입니다.</div>
      </div>
    )
  }

  if (isLoading) {
    return <div></div>
  }

  if (isError) {
    return (
      <div className="data-wrap">
        <Location title="권한 상세" list={['홈', '환경 설정', '권한 관리', '권한 상세']} />
        <div className="contents-wrap">권한 정보를 불러오는 데 실패했습니다.</div>
      </div>
    )
  }

  if (!authority) {
    return (
      <div className="data-wrap">
        <Location title="권한 상세" list={['홈', '환경 설정', '권한 관리', '권한 상세']} />
        <div className="contents-wrap">권한을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return <SettingsAuthorityEditContent authorityId={authorityId} authority={authority} />
}

function SettingsAuthorityEditContent({
  authorityId,
  authority,
}: {
  authorityId: number
  authority: AuthorityResponse
}) {
  const router = useRouter()
  const { alert, confirm } = useAlert()

  const { mutateAsync: deleteAuthority } = useDeleteAuthority()

  const {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
  } = useAuthorityForm({
    mode: 'edit',
    authorityId,
    initialAuthority: authority,
    listPath: '/settings/authority',
  })

  const handleList = () => {
    router.push('/settings/authority')
  }

  // 권한 관리자: 해당 권한을 가진 관리자 목록으로 이동
  const handleAuthorityManager = () => {
    router.push(`/system/admin?authorityId=${authorityId}`)
  }

  const handleDelete = async () => {
    const confirmed = await confirm('정말 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      await deleteAuthority(authorityId)
      await alert('권한이 삭제되었습니다.')
      router.push('/settings/authority')
    } catch (error) {
      await alert(getErrorMessage(error))
      console.error('권한 삭제 실패:', error)
    }
  }

  return (
    <div className="data-wrap">
      <Location title="권한 상세" list={['홈', '환경 설정', '권한 관리', '권한 상세']} />
      <div className="contents-wrap">
        <AuthorityForm
          mode="edit"
          initialData={{
            ...formData,
            owner_code: authority.owner_code as OwnerCode,
            head_office_id: authority.head_office_id ?? undefined,
            franchisee_id: authority.franchisee_id ?? undefined,
          }}
          onChange={handleFormChange}
          onList={handleList}
          onAuthorityManager={handleAuthorityManager}
          onDelete={handleDelete}
          onSave={handleSave}
          errors={errors}
          context="bp"
        >
          <AuthorityProgramTree
            programTree={programTree}
            onChange={handleProgramTreeChange}
            currentOwnerCode={authority.owner_code}
            authorityId={authorityId}
          />
        </AuthorityForm>
      </div>
    </div>
  )
}
