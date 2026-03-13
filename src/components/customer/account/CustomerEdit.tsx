'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input, useAlert } from '@/components/common/ui'
import { useCustomerDetail, useUpdateCustomer } from '@/hooks/queries/use-customer-queries'
import type { PutCustomerRequest } from '@/types/customer'

// 간편인증 텍스트 변환
const socialAuthTypeMap: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
}

interface CustomerEditProps {
  customerId?: number
}

export default function CustomerEdit({ customerId }: CustomerEditProps) {
  const router = useRouter()
  const { alert } = useAlert()

  const { data: customer, isPending: isLoading } = useCustomerDetail(customerId)
  const updateMutation = useUpdateCustomer()

  // 폼 상태 - customer 데이터가 로드될 때마다 초기화를 위해 key prop을 상위에서 사용
  const [formData, setFormData] = useState<{
    mobilePhone: string
    email: string
  }>({
    mobilePhone: '',
    email: '',
  })

  // customer 로드 완료 시 초기값 설정 (derived state 패턴)
  const effectiveMobilePhone = formData.mobilePhone || customer?.mobilePhone || ''
  const effectiveEmail = formData.email || customer?.email || ''

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!customerId) return

    if (!effectiveMobilePhone) {
      await alert('휴대폰 번호를 입력해주세요.')
      return
    }
    if (!effectiveEmail) {
      await alert('이메일 주소를 입력해주세요.')
      return
    }

    try {
      const data: PutCustomerRequest = {
        mobilePhone: effectiveMobilePhone,
        email: effectiveEmail,
      }
      await updateMutation.mutateAsync({ id: customerId, data })
      await alert('회원 정보가 수정되었습니다.')
      router.push(`/master/customer/account/${customerId}`)
    } catch (err) {
      console.error('회원 수정 실패:', err)
      await alert('회원 수정에 실패했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="master-detail-data">
      {/* 상단 버튼 */}
      <div className="detail-top-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn-form basic" onClick={handleSave}>저장</button>
      </div>

      {/* 수정 폼 */}
      <div className="content-wrap">
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginRight: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <h2>회원 정보 수정</h2>
          </div>
          <div className="slidebox-body">
            <table className="default-table">
              <colgroup>
                <col width="160px" />
                <col />
                <col width="160px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>운영여부</th>
                  <td>
                    <div className="data-filed">
                      <span>{customer?.isOperate === 1 ? '운영' : '탈퇴'}</span>
                    </div>
                  </td>
                  <th>회원 ID</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.loginId || ''} readOnly />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>회원코드</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.customerCode || ''} readOnly />
                    </div>
                  </td>
                  <th>회원명</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.name || ''} readOnly />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>휴대폰 번호 <span style={{ color: '#dc3545' }}>*</span></th>
                  <td>
                    <div className="data-filed">
                      <Input
                        type="cellphone"
                        placeholder="휴대폰 번호 입력"
                        value={effectiveMobilePhone}
                        onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                        showClear
                        onClear={() => handleInputChange('mobilePhone', '')}
                      />
                    </div>
                  </td>
                  <th>이메일 주소 <span style={{ color: '#dc3545' }}>*</span></th>
                  <td>
                    <div className="data-filed">
                      <Input
                        type="email"
                        placeholder="이메일 주소 입력"
                        value={effectiveEmail}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        showClear
                        onClear={() => handleInputChange('email', '')}
                      />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>간편인증</th>
                  <td>
                    <div className="data-filed">
                      <Input
                        value={customer?.socialAuthType ? (socialAuthTypeMap[customer.socialAuthType] || customer.socialAuthType) : '없음'}
                        readOnly
                      />
                    </div>
                  </td>
                  <th>간편인증 식별값</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.socialAuthId || '-'} readOnly />
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>최근 접속일시</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.lastAccessTime?.replace('T', ' ').substring(0, 19) || '-'} readOnly />
                    </div>
                  </td>
                  <th>가입일시</th>
                  <td>
                    <div className="data-filed">
                      <Input value={customer?.joinDate?.replace('T', ' ').substring(0, 19) || '-'} readOnly />
                    </div>
                  </td>
                </tr>
                {customer?.isOperate === 0 && (
                  <tr>
                    <th>탈퇴일시</th>
                    <td>
                      <div className="data-filed">
                        <Input value={customer?.withdrawalDate?.replace('T', ' ').substring(0, 19) || '-'} readOnly />
                      </div>
                    </td>
                    <th>탈퇴사유</th>
                    <td>
                      <div className="data-filed">
                        <Input value={customer?.withdrawalReason || '-'} readOnly />
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
