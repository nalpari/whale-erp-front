'use client'

import { useParams, useRouter } from 'next/navigation'
import Location from '@/components/ui/Location'
import AuthorityForm from '@/components/system/authority/AuthorityForm'
import AuthorityProgramTree from '@/components/system/authority/AuthorityProgramTree'
import { useAuthorityDetail, useDeleteAuthority } from '@/hooks/queries/use-authority-queries'
import { useAuthorityForm } from '@/hooks/use-authority-form'

export default function AuthorityEditPage() {
  const router = useRouter()
  const params = useParams()
  const authorityId = Number(params.id)

  // 권한 상세 조회
  const { data: authority, isLoading } = useAuthorityDetail(authorityId)

  // 권한 삭제 mutation
  const { mutateAsync: deleteAuthority } = useDeleteAuthority()

  // 폼 로직
  const {
    formData,
    errors,
    programTree,
    handleFormChange,
    handleProgramTreeChange,
    handleSave,
    handleList,
  } = useAuthorityForm({
    mode: 'edit',
    authorityId,
    initialAuthority: authority,
  })

  // 권한 관리자
  const handleAuthorityManager = () => {
    // TODO: 관리자 관리 페이지 구현 후 해당 권한을 가진 관리자 검색 결과 표시
    console.log('권한 관리자 페이지로 이동 - 권한 ID:', authorityId)
    // 구현 예정: router.push(`/system/admin?authorityId=${authorityId}`)
  }

  // 삭제
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await deleteAuthority(authorityId)
      alert('권한이 삭제되었습니다.')
      router.push('/system/authority')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      alert(`권한 삭제 실패: ${errorMessage}`)
      console.error('권한 삭제 실패:', error)
    }
  }

  if (isLoading) {
    return <div></div>
  }

  if (!authority) {
    return (
      <div className="data-wrap">
        <Location title="권한 상세" list={['홈', '시스템 관리', '권한 관리', '권한 상세']} />
        <div className="contents-wrap">권한을 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title="권한 상세" list={['홈', '시스템 관리', '권한 관리', '권한 상세']} />
      <div className="contents-wrap">
        <AuthorityForm
          mode="edit"
          initialData={{
            owner_code: authority.owner_code as 'PRGRP_001_001' | 'PRGRP_002_001' | 'PRGRP_002_002',
            head_office_code: authority.head_office_code || undefined,
            franchisee_code: authority.franchisee_code || undefined,
            ...formData,
          }}
          onChange={handleFormChange}
          onList={handleList}
          onAuthorityManager={handleAuthorityManager}
          onDelete={handleDelete}
          onSave={handleSave}
          errors={errors}
        >
          <AuthorityProgramTree
            programTree={programTree}
            onChange={handleProgramTreeChange}
            currentOwnerCode={authority.owner_code}
          />
        </AuthorityForm>
      </div>
    </div>
  )
}
