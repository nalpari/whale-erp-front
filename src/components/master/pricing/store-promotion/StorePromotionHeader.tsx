'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'
import { Input } from '@/components/common/ui'
import { useStorePromotionDetail, useDeleteStorePromotion } from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { storePromotionKeys } from '@/hooks/queries/query-keys'
import { PROMOTION_STATUS_LABEL } from '@/types/store-promotion'
import type { PromotionStatus } from '@/types/store-promotion'
import { formatDateYmd } from '@/util/date-util'
import { formatPrice } from '@/util/format-util'
import AnimateHeight from 'react-animate-height'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

const formatValue = (value?: string | null) => value ?? '-'

export default function StorePromotionHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const promotionId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null

  const { data: detail, isPending: loading, error } = useStorePromotionDetail(promotionId)
  const queryClient = useQueryClient()
  const { mutateAsync: deletePromotion } = useDeleteStorePromotion()
  const { alert, confirm } = useAlert()
  const [slideboxOpen, setSlideboxOpen] = useState(true)

  const handleDelete = async () => {
    if (promotionId == null) return
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deletePromotion(promotionId)
      queryClient.removeQueries({ queryKey: storePromotionKeys.detail(promotionId) })
      router.push('/master/pricing/store-promotion')
    } catch {
      await alert('프로모션 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="data-wrap">
      <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
      {loading && (
        <div className="cube-loader-overlay">
          <CubeLoader />
        </div>
      )}
      {!loading && error && (
        <div className="warning-txt">프로모션 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.</div>
      )}
      {!loading && detail && (
        <div className="master-detail-data">
          <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <h2>프로모션 가격 정보 관리</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn" onClick={() => router.push('/master/pricing/store-promotion')}>
                  목록
                </button>
                <button className="slidebox-btn" onClick={handleDelete}>
                  삭제
                </button>
                <button className="slidebox-btn" onClick={() => router.push(`/master/pricing/store-promotion/detail?id=${detail.id}`)}>
                  수정
                </button>
                <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <div className="detail-data-wrap">
                  <table className="detail-data-table">
                    <colgroup>
                      <col width="200px" />
                      <col />
                    </colgroup>
                    <tbody>
                      {/* 1. 본사 / 가맹점 / 점포 */}
                      <tr>
                        <th>본사 / 가맹점 / 점포</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.headOfficeName)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.franchiseName)}</span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.storeName)}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 2. 프로모션명 */}
                      <tr>
                        <th>프로모션명</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.promotionName)}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 3. 프로모션 상태 및 기간 */}
                      <tr>
                        <th>프로모션 상태 및 기간</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {PROMOTION_STATUS_LABEL[detail.status as PromotionStatus] ?? detail.status}
                              </span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {formatDateYmd(detail.startDate)} ~ {formatDateYmd(detail.endDate)}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 4. 메뉴 구성 및 프로모션가 */}
                      <tr>
                        <th>메뉴 구성 및 프로모션가</th>
                        <td>
                          {detail.promotionMenus?.length > 0 ? (
                            detail.promotionMenus.map((menu) => (
                              <ul key={menu.menuId} className="detail-data-list">
                                <li className="detail-data-item">
                                  <span className="detail-data-text">{menu.menuName}</span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {menu.salePrice != null ? `${formatPrice(menu.salePrice)}원` : '-'}
                                  </span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {menu.discountPrice != null ? `${formatPrice(menu.discountPrice)}원` : '-'}
                                  </span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text text-red-500">
                                    {menu.promotionPrice != null ? `${formatPrice(menu.promotionPrice)}원` : '-'}
                                  </span>
                                </li>
                              </ul>
                            ))
                          ) : (
                            <ul className="detail-data-list">
                              <li className="detail-data-item">
                                <span className="detail-data-text">-</span>
                              </li>
                            </ul>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimateHeight>
          </div>

          {/* 메타데이터 테이블 */}
          <div className="detail-data-info-wrap mt-5">
            <table className="default-table">
              <colgroup>
                <col width="120px" />
                <col />
                <col width="120px" />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th>등록자</th>
                  <td>
                    <Input
                      value={detail.createdByName ?? '-'}
                      disabled
                    />
                  </td>
                  <th>등록일시</th>
                  <td>
                    <Input value={formatDateYmd(detail.createdAt)} disabled />
                  </td>
                </tr>
                <tr>
                  <th>최종수정자</th>
                  <td>
                    <Input
                      value={detail.updatedByName ?? '-'}
                      disabled
                    />
                  </td>
                  <th>최종수정일시</th>
                  <td>
                    <Input value={formatDateYmd(detail.updatedAt)} disabled />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !detail && !error && <div className="data-empty">조회할 프로모션을 선택하세요.</div>}
    </div>
  )
}
