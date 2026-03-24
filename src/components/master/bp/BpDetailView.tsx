'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'
import { useBpDetail, useCommonCodeHierarchy } from '@/hooks/queries'
import { useDeleteBp } from '@/hooks/queries/use-bp-queries'
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
              {!isEditDisabled && (
                <button className="slidebox-btn" onClick={() => router.push(`/master/bp/${id}/edit`)}>수정</button>
              )}
              <button className="slidebox-btn" onClick={handleDelete}>삭제</button>
              <button className="slidebox-btn" onClick={() => router.push('/master/bp')}>목록</button>
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
