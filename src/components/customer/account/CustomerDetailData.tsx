'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomerDetail } from '@/hooks/queries/use-customer-queries'
import CustomerWithdrawalModal from './CustomerWithdrawalModal'

interface CustomerDetailDataProps {
  customerId?: number
}

// 간편인증 텍스트 변환
const socialAuthTypeMap: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  GOOGLE: '구글',
}

export default function CustomerDetailData({ customerId }: CustomerDetailDataProps) {
  const router = useRouter()
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)

  const {
    data: customer,
    isPending: isLoading,
    error: customerError,
  } = useCustomerDetail(customerId)

  const error = customerError ? '회원 정보를 불러오는데 실패했습니다.' : null

  // 날짜 포맷 함수
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '-'
    return dateString.replace('T', ' ').substring(0, 19)
  }

  const handleList = () => {
    router.push('/master/customer/account')
  }

  const handleEdit = () => {
    router.push(`/master/customer/account/${customerId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="master-detail-data">
        <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</div>
      </div>
    )
  }

  return (
    <div className="master-detail-data">
      {/* 상단 버튼 */}
      <div className="detail-top-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        {customer?.isOperate === 1 && (
          <button className="btn-form gray" onClick={() => setWithdrawalModalOpen(true)}>탈퇴</button>
        )}
        <button className="btn-form basic" onClick={handleList}>목록</button>
      </div>

      {/* 회원 Header 정보 관리 */}
      <div className="slidebox-wrap">
        <div className="slidebox-header">
          <h2>회원 Master</h2>
          <div className="slidebox-btn-wrap">
            <button className="slidebox-btn" onClick={handleEdit}>수정</button>
          </div>
        </div>
        <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>운영여부 및 가입일시</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.isOperate === 1 ? '운영' : '탈퇴'} | {formatDateTime(customer?.joinDate)}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>회원 개인 정보</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.name || '-'} | {customer?.customerCode || '-'} | {customer?.mobilePhone || '-'} | {customer?.email || '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>계정 정보</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.loginId || '-'} | 간편인증 {customer?.socialAuthType ? socialAuthTypeMap[customer.socialAuthType] || customer.socialAuthType : '없음'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>최근접속일시</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">{formatDateTime(customer?.lastAccessTime)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>탈퇴사유 및 탈퇴일시</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.withdrawalReason || '-'} | {formatDateTime(customer?.withdrawalDate)}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* 등록 및 수정 이력 */}
      <div className="content-wrap">
        <div className="slidebox-wrap">
          <div className="slidebox-header">
            <h2>등록 및 수정 이력</h2>
          </div>
          <div className="slidebox-body">
            <div className="detail-data-wrap">
              <table className="detail-data-table">
                <colgroup>
                  <col width="200px" />
                  <col />
                </colgroup>
                <tbody>
                  <tr>
                    <th>등록자</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.name ? `${customer.name}(${customer.loginId})` : '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>등록일시</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">{formatDateTime(customer?.createdAt)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>최종수정자</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">
                            {customer?.updatedByLoginId ? `${customer.updatedByName ?? '-'}(${customer.updatedByLoginId})` : '-'}
                          </span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>최종수정일시</th>
                    <td>
                      <ul className="detail-data-list">
                        <li className="detail-data-item">
                          <span className="detail-data-text">{formatDateTime(customer?.updatedAt)}</span>
                        </li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 탈퇴 모달 */}
      {customerId && (
        <CustomerWithdrawalModal
          isOpen={withdrawalModalOpen}
          customerId={customerId}
          onClose={() => setWithdrawalModalOpen(false)}
        />
      )}
    </div>
  )
}
