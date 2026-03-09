'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAlert } from '@/components/common/ui'
import { useWithdrawCustomer } from '@/hooks/queries/use-customer-queries'

interface CustomerWithdrawalModalProps {
  isOpen: boolean
  customerId: number
  onClose: () => void
}

export default function CustomerWithdrawalModal({ isOpen, customerId, onClose }: CustomerWithdrawalModalProps) {
  const router = useRouter()
  const { alert } = useAlert()
  const withdrawMutation = useWithdrawCustomer()

  const [reasonType, setReasonType] = useState('')
  const [reasonDetail, setReasonDetail] = useState('')

  const isDirectInput = reasonType === '직접 입력'

  const withdrawalReason = isDirectInput ? reasonDetail.trim() : reasonType

  const handleReasonTypeChange = (value: string) => {
    setReasonType(value)
    if (value !== '직접 입력') {
      setReasonDetail('')
    }
  }

  const handleSubmit = async () => {
    if (!reasonType) {
      await alert('탈퇴 사유를 선택해주세요.')
      return
    }
    if (isDirectInput && !reasonDetail.trim()) {
      await alert('탈퇴 사유를 입력해주세요.')
      return
    }
    if (isDirectInput && withdrawalReason.length < 30) {
      await alert(`탈퇴 사유는 최소 30글자 이상 입력해야 합니다. (현재 ${withdrawalReason.length}글자)`)
      return
    }

    try {
      await withdrawMutation.mutateAsync({ id: customerId, withdrawalReason })
      await alert('회원 탈퇴 처리가 완료되었습니다.')
      onClose()
      router.push('/master/customer/account')
    } catch (err) {
      console.error('회원 탈퇴 실패:', err)
      await alert('회원 탈퇴 처리에 실패했습니다.')
    }
  }

  const handleClose = () => {
    setReasonType('')
    setReasonDetail('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-popup show">
      <div className="modal-dialog small">
        <div className="modal-content">
          <div className="modal-header">
            <h2>회원 탈퇴</h2>
            <button className="modal-close" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <div className="pop-form-content">
              <div className="pop-form-item">
                <div className="pop-form-tit">
                  탈퇴 사유 <span className="red">*</span>
                </div>
                <div className="pop-form-filed">
                  <select
                    className="select-form"
                    value={reasonType}
                    onChange={(e) => handleReasonTypeChange(e.target.value)}
                  >
                    <option value="">선택</option>
                    <option value="서비스 불만족">서비스 불만족</option>
                    <option value="이용 필요성 감소">이용 필요성 감소</option>
                    <option value="대체 서비스 이용">대체 서비스 이용</option>
                    <option value="직접 입력">직접 입력</option>
                  </select>
                </div>
              </div>
              <div className="pop-form-item">
                <div className="pop-form-tit">
                  탈퇴 사유 입력 <span className="red">*</span>
                </div>
                <div className="pop-form-filed">
                  <textarea
                    className="textarea-form"
                    placeholder="탈퇴 사유를 입력해주세요. (최소 30글자)"
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    disabled={!isDirectInput}
                    style={{ opacity: isDirectInput ? 1 : 0.5 }}
                  />
                  {isDirectInput && (
                    <span style={{ fontSize: '12px', color: reasonDetail.trim().length < 30 ? '#e74c3c' : '#999', marginTop: '4px', display: 'block' }}>
                      {reasonDetail.trim().length}/30글자
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="pop-btn-content">
              <button className="btn-form gray" onClick={handleClose}>취소</button>
              <button className="btn-form basic" onClick={handleSubmit}>저장</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
