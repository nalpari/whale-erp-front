'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import { useQuery } from '@tanstack/react-query'
import { Input } from '@/components/common/ui'
import {
  useEmployeeDetail,
  useSendEmployeeRegistrationEmail,
  useUpdateEmployeeLoginInfo,
  useWithdrawEmployeeMember
} from '@/hooks/queries/use-employee-queries'
import { getAuthoritiesByOrganization, type AuthorityItem } from '@/lib/api/employee'

interface EmployeeLoginEditProps {
  employeeId?: number
}

export default function EmployeeLoginEdit({ employeeId }: EmployeeLoginEditProps) {
  const router = useRouter()
  const [loginInfoOpen, setLoginInfoOpen] = useState(true)
  const [selectedAuthorityId, setSelectedAuthorityId] = useState<number | null>(null)

  // TanStack Query 훅들
  const {
    data: employee,
    isPending: isEmployeeLoading,
    error: employeeError
  } = useEmployeeDetail(employeeId)

  // React 19 + TanStack Query: useEffect 대신 useQuery로 권한 목록 조회
  const { data: authorities = [] } = useQuery<AuthorityItem[]>({
    queryKey: ['authorities', 'PRGRP_002'],
    queryFn: () => getAuthoritiesByOrganization('PRGRP_002'),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5분
  })

  const sendEmailMutation = useSendEmployeeRegistrationEmail()
  const updateLoginInfoMutation = useUpdateEmployeeLoginInfo()
  const withdrawMutation = useWithdrawEmployeeMember()

  const loading = isEmployeeLoading
  const saving = updateLoginInfoMutation.isPending
  const sendingEmail = sendEmailMutation.isPending
  const withdrawing = withdrawMutation.isPending
  const error = employeeError ? '데이터를 불러오는데 실패했습니다.' : null

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return dateString.split('T')[0]
  }

  // 회원 가입 상태 계산
  const getMemberStatus = (): string => {
    if (!employee) return '-'
    if (employee.memberId) return '가입완료'
    return '가입요청전'
  }

  const handleSendRegistrationEmail = async () => {
    if (!employeeId) return

    if (!employee?.email) {
      alert('직원의 이메일 주소가 없습니다.')
      return
    }

    if (!confirm('직원 회원 가입 요청 메일을 발송하시겠습니까?')) return

    try {
      await sendEmailMutation.mutateAsync(employeeId)
      alert('회원 가입 요청 메일이 발송되었습니다.')
    } catch (err) {
      console.error('메일 발송 실패:', err)
      alert('메일 발송에 실패했습니다.')
    }
  }

  const handleWithdraw = async () => {
    if (!employeeId || !employee?.memberId) return

    if (!confirm('정말 탈퇴 처리하시겠습니까?\n탈퇴 처리 후에는 해당 회원의 로그인이 불가능합니다.')) return

    try {
      await withdrawMutation.mutateAsync(employeeId)
      alert('탈퇴 처리가 완료되었습니다.')
      // 페이지 새로고침
      window.location.reload()
    } catch (err) {
      console.error('탈퇴 처리 실패:', err)
      alert('탈퇴 처리에 실패했습니다.')
    }
  }

  const handleSave = async () => {
    if (!employeeId) return

    try {
      await updateLoginInfoMutation.mutateAsync({
        employeeInfoId: employeeId,
        request: { partnerOfficeAuthorityId: selectedAuthorityId }
      })
      alert('저장되었습니다.')
      router.push(`/employee/info/${employeeId}`)
    } catch (err) {
      console.error('저장 실패:', err)
      alert('저장에 실패했습니다.')
    }
  }

  const handleBack = () => {
    if (!employeeId) {
      router.push('/employee/info')
      return
    }
    router.push(`/employee/info/${employeeId}`)
  }

  if (loading) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>{error}</div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>직원 정보를 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="master-detail-data">
      {/* 로그인 정보 및 권한 */}
      <div className={`slidebox-wrap ${loginInfoOpen ? '' : 'close'}`}>
        <div className="slidebox-header">
          <h2>로그인 정보 및 권한</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
            <button className="slidebox-btn arr" onClick={() => setLoginInfoOpen(!loginInfoOpen)}>
              <i className="arr-icon"></i>
            </button>
          </div>
        </div>
        <AnimateHeight duration={300} height={loginInfoOpen ? 'auto' : 0}>
          <div className="slidebox-body">
            <table className="default-table">
              <colgroup>
                <col width="190px" />
                <col />
              </colgroup>
              <tbody>
                {/* 1. 직원 회원 가입 상태 */}
                <tr>
                  <th>직원 회원 가입 상태</th>
                  <td>
                    <div className="filed-flx">
                      <Input
                        value={getMemberStatus()}
                        disabled
                        containerClassName="mx-200"
                      />
                      {!employee.memberId && employee.email && (
                        <button
                          className="btn-form basic"
                          onClick={handleSendRegistrationEmail}
                          disabled={sendingEmail}
                        >
                          {sendingEmail ? '발송 중...' : '직원 회원 가입 요청 메일 발송'}
                        </button>
                      )}
                      {employee.memberId && (
                        <button
                          className="btn-form outline"
                          onClick={handleWithdraw}
                          disabled={withdrawing}
                        >
                          {withdrawing ? '처리 중...' : '탈퇴 처리'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* 2. 로그인 ID */}
                <tr>
                  <th>로그인 ID</th>
                  <td>
                    <Input
                      value={employee.memberLoginId || '-'}
                      disabled
                      containerClassName="mx-200"
                    />
                  </td>
                </tr>

                {/* 3. Partner Office 권한 설정 */}
                <tr>
                  <th>Partner Office 권한 설정</th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-200">
                        <select
                          className="select-form"
                          value={selectedAuthorityId || ''}
                          onChange={(e) => setSelectedAuthorityId(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">선택하세요</option>
                          {authorities.map((auth) => (
                            <option key={auth.id} value={auth.id}>
                              {auth.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        ※ 직원이 Partner Office에서 관리자로 접근할 때 사용합니다.
                      </span>
                    </div>
                  </td>
                </tr>

                {/* 4. 직원 회원 가입 요청일 */}
                <tr>
                  <th>직원 회원 가입 요청일</th>
                  <td>
                    <Input
                      value={employee.emailSendDate ? formatDate(employee.emailSendDate) : ''}
                      disabled
                      containerClassName="mx-200"
                    />
                  </td>
                </tr>

                {/* 5. 직원 회원 가입일 */}
                <tr>
                  <th>직원 회원 가입일</th>
                  <td>
                    <Input
                      value={employee.memberId ? formatDate(employee.createdAt) : '-'}
                      disabled
                      containerClassName="mx-200"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AnimateHeight>
      </div>
    </div>
  )
}
