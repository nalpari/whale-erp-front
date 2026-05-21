'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'
import { useBpDetail, useCommonCodeHierarchy } from '@/hooks/queries'
import { useDeleteBp, useResendBpInvitation } from '@/hooks/queries/use-bp-queries'
import { getErrorMessage } from '@/lib/api'

interface BpDetailViewProps {
  id: number
}

const BpDetailView = ({ id }: BpDetailViewProps) => {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [bpInfoOpen, setBpInfoOpen] = useState(true)
  const [pfOpen, setPfOpen] = useState(true)

  const { data: bp, isPending } = useBpDetail(id)
  const { mutateAsync: deleteBp } = useDeleteBp()
  const { mutateAsync: resendBpInvitation, isPending: isResending } = useResendBpInvitation()
  const { data: bpoprCodes = [] } = useCommonCodeHierarchy('BPOPR')
  const { data: bpTypeCodes = [] } = useCommonCodeHierarchy('BPTYP')

  const bpoprName = bp?.bpoprType
    ? (bpoprCodes.find((c) => c.code === bp.bpoprType)?.name ?? bp.bpoprType)
    : '-'

  const bpTypeName = bp?.bpType
    ? (bpTypeCodes.find((c) => c.code === bp.bpType)?.name ?? bp.bpType)
    : '-'

  const isHeadOffice = bp?.organizationType === 'HEAD_OFFICE'
  const isEditDisabled = bp?.bpoprType === 'BPOPR_001' && bp?.invitationStatus != null && bp?.invitationStatus !== 'ACCEPTED'
  // 재발송 노출: 상담중(BPOPR_001) + 미가입(PENDING) 일 때만 (BE assertConsultingBpopr + PENDING 가드와 1:1)
  //
  // 정책 (PR #100 review HIGH #2): EXPIRED/REJECTED 상태 BP 는 재발송 버튼 미노출.
  //   - BE 가 PENDING 만 허용 (다른 상태는 BP_RESEND_NOT_ALLOWED 차단)
  //   - 정상 운영 경로: EXPIRED/REJECTED → "삭제 후 재초대" (BP Master 목록에서 다시 초대)
  //   - 본 상세 화면에서 재발송은 PENDING 한정. 상태 변경은 신규 초대 흐름에서.
  const isResendVisible = bp?.bpoprType === 'BPOPR_001' && bp?.invitationStatus === 'PENDING'

  const handleDelete = async () => {
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteBp(id)
      await alert('삭제되었습니다.')
      router.push('/master/bp')
    } catch (error) {
      await alert(getErrorMessage(error, '삭제에 실패했습니다.'))
    }
  }

  const handleResendInvitation = async () => {
    // 진입 가드 (PR #100 review MED #2) — confirm 모달 닫힘 ↔ mutation 진입 사이 1 tick race 차단
    if (isResending) return
    const confirmed = await confirm('초대 메일과 알림톡을 다시 발송하시겠습니까?')
    if (!confirmed) return
    try {
      await resendBpInvitation(id)
      // 메일 + 알림톡 둘 다 best-effort afterCommit 발송 → 단정형 카피 회피 (PR #100 review HIGH #1)
      // 채널 실패해도 BE 는 200 + 사용자에게 성공 안내 → 5분 idempotency 차단 시 혼란 방지
      await alert('초대 메일과 알림톡 재발송을 요청했습니다.\n수 분 내 도착하지 않으면 5분 후 다시 시도해주세요.')
    } catch (error) {
      // BE 의 ErrorResponse.message 가 친절하게 작성되어 있어 그대로 표시
      // (NOTIFICATION_IDEMPOTENCY_BLOCKED 등 429 도 BE 메시지로 충분)
      await alert(getErrorMessage(error, '초대 메일 재발송에 실패했습니다.'))
    }
  }

  if (isPending) {
    return (
      <div className="data-wrap">
        <Location title="파트너 정보 상세" list={['Home', '파트너 정보 관리', '파트너 정보 상세']} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  if (!bp) {
    return (
      <div className="data-wrap">
        <Location title="파트너 정보 상세" list={['Home', '파트너 정보 관리', '파트너 정보 상세']} />
        <div className="empty-wrap"><div className="empty-data">데이터를 찾을 수 없습니다.</div></div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title="파트너 정보 상세" list={['Home', '파트너 정보 관리', '파트너 정보 상세']} />
      <div className="master-detail-data">
        {/* 파트너 정보 */}
        <div className={`slidebox-wrap ${bpInfoOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>파트너 정보</h2>
            <div className="slidebox-btn-wrap">
              {/* 재발송 진행 중에는 다른 헤더 액션도 disable — 동시 mutation race 방지 (PR #100 review MED #1) */}
              {!isEditDisabled && (
                <button className="slidebox-btn" onClick={() => router.push(`/master/bp/${id}/edit`)} disabled={isResending}>수정</button>
              )}
              {isResendVisible && (
                <button className="slidebox-btn" onClick={handleResendInvitation} disabled={isResending}>
                  {isResending ? '재발송 중...' : '초대 메일 재발송'}
                </button>
              )}
              <button className="slidebox-btn" onClick={handleDelete} disabled={isResending}>삭제</button>
              <button className="slidebox-btn" onClick={() => router.push('/master/bp')} disabled={isResending}>목록</button>
              <button className="slidebox-btn arr" onClick={() => setBpInfoOpen(!bpInfoOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={bpInfoOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              <div className="detail-data-wrap">
                <table className="detail-data-table">
                  <colgroup>
                    <col width="200px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>운영여부</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bpoprName}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.organizationType === 'HEAD_OFFICE' ? '본사' : '가맹점'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>BP 정보</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.companyName ?? '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.organizationCode ?? '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.brandName ?? '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.businessRegistrationNumber ?? '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>주소 정보</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.address1 ?? '-'}</span>
                          </li>
                          {bp.address2 && (
                            <li className="detail-data-item">
                              <span className="detail-data-text">{bp.address2}</span>
                            </li>
                          )}
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>대표자 정보</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.representativeName ?? '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.representativeMobilePhone ?? '-'}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bp.representativeEmail ?? '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>분류 정보</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{bpTypeName}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <th>LNB 로고</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            {bp.lnbLogoExpandFile?.publicUrl ? (
                              <Image src={bp.lnbLogoExpandFile.publicUrl} alt="LNB 로고" width={120} height={40} style={{ objectFit: 'contain' }} />
                            ) : (
                              <span className="detail-data-text">-</span>
                            )}
                          </li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </AnimateHeight>
        </div>

        {/* Partner Function (HEAD_OFFICE일 때만 표시) */}
        {isHeadOffice && (
          <div className={`slidebox-wrap ${pfOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <h2>Partner Function</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn arr" onClick={() => setPfOpen(!pfOpen)}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={pfOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <div className="detail-data-wrap">
                  <table className="detail-data-table">
                    <colgroup>
                      <col width="200px" />
                      <col />
                    </colgroup>
                    <tbody>
                      <tr>
                        <th>본사</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                <span>({bpoprName})</span> {bp.companyName}
                              </span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{bp.organizationCode}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <th>Bill to Party</th>
                        <td>
                          {bp.pfList && bp.pfList.length > 0 ? (
                            bp.pfList.map((pf) => (
                              <ul key={pf.id} className="detail-data-list">
                                <li className="detail-data-item">
                                  <span className="detail-data-text">Partner BP ID: {pf.partnerBpId}</span>
                                </li>
                              </ul>
                            ))
                          ) : (
                            <span className="detail-data-text">-</span>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimateHeight>
          </div>
        )}

      </div>

    </div>
  )
}

export default BpDetailView
