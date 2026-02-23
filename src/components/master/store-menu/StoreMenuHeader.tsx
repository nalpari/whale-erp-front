'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'
import { useStoreMenuDetail, useDeleteStoreMenu } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmd } from '@/util/date-util'
import { formatPrice } from '@/util/format-util'
import AnimateHeight from 'react-animate-height'
import { Input } from '@/components/common/ui'
import type { StoreMenuOptionSet } from '@/types/store-menu'

const BREADCRUMBS = ['Home', 'Master data 관리', '메뉴 정보 관리']

/** 운영 상태 코드 */
const OPERATION_STATUS_ACTIVE = 'STOPR_001'

const formatValue = (value?: string | null) => value ?? '-'

export default function StoreMenuHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const menuIdParam = searchParams.get('id')
  const menuId = menuIdParam && /^\d+$/.test(menuIdParam) ? Number(menuIdParam) : null

  const { data: detail, isPending: loading, error } = useStoreMenuDetail(menuId)
  const { mutateAsync: deleteMenu } = useDeleteStoreMenu()
  const { alert, confirm } = useAlert()
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [optionInfoOpen, setOptionInfoOpen] = useState(true)
  const [categoryInfoOpen, setCategoryInfoOpen] = useState(true)

  // 공통코드 조회
  const { children: statusChildren } = useCommonCode('STOPR', true)
  const { children: menuTypeChildren } = useCommonCode('MNTYP', true)
  const { children: marketingChildren } = useCommonCode('MKCF', true)
  const { children: temperatureChildren } = useCommonCode('TMPCF', true)
  const { children: menuPropertyChildren } = useCommonCode('MNPRP', true)

  // 공통코드 매핑
  const codeMap = useMemo(() => {
    const build = (items: { code: string; name: string }[]) =>
      items.reduce<Record<string, string>>((acc, item) => {
        acc[item.code] = item.name
        return acc
      }, {})
    return {
      status: build(statusChildren),
      menuType: build(menuTypeChildren),
      marketing: build(marketingChildren),
      temperature: build(temperatureChildren),
      menuProperty: build(menuPropertyChildren),
    }
  }, [statusChildren, menuTypeChildren, marketingChildren, temperatureChildren, menuPropertyChildren])

  const handleDelete = async () => {
    if (menuId == null) return
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteMenu(menuId)
      router.push('/master/menu/store')
    } catch {
      await alert('메뉴 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="data-wrap">
      <Location title="메뉴 정보 관리" list={BREADCRUMBS} />
      {loading && (
        <div className="cube-loader-overlay">
          <CubeLoader />
        </div>
      )}
      {!loading && error && <div className="warning-txt">메뉴 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.</div>}
      {!loading && detail && (
        <div className="master-detail-data">
          <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <h2>메뉴 Header 정보</h2>
              <div className="slidebox-btn-wrap">
                <button className="slidebox-btn" onClick={() => router.push('/master/menu/store')}>
                  목록
                </button>
                <button className="slidebox-btn" onClick={handleDelete}>
                  삭제
                </button>
                <button
                  className="slidebox-btn"
                  onClick={() => router.push(`/master/menu/store/detail?id=${detail.id}`)}
                >
                  상세
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
                      {/* 1. 운영여부 및 메뉴 그룹 */}
                      <tr>
                        <th>운영여부 및 메뉴 그룹</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {codeMap.status[detail.operationStatus] ?? detail.operationStatus}
                              </span>
                            </li>
                            <li className="detail-data-item">
                              <span className="detail-data-text">점포용</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 2. Business Partner 및 점포 */}
                      <tr>
                        <th>Business Partner 및 점포</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.companyName)}</span>
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
                      {/* 3. 메뉴 타입 */}
                      <tr>
                        <th>메뉴 타입</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">
                                {codeMap.menuType[detail.menuType] ?? detail.menuType}
                              </span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 4. 마스터용 메뉴 mapping */}
                      <tr>
                        <th>마스터용 메뉴 mapping</th>
                        <td>
                          <ul className="detail-data-list">
                            {detail.masterMenuName || detail.masterMenuCode ? (
                              <>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {detail.menuProperty ? (codeMap.menuProperty[detail.menuProperty] ?? detail.menuProperty) : '-'}
                                  </span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {formatValue(detail.masterMenuName)}
                                  </span>
                                </li>
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {formatValue(detail.masterMenuCode)}
                                  </span>
                                </li>
                              </>
                            ) : (
                              <li className="detail-data-item">
                                <span className="detail-data-text">매핑 안됨</span>
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                      {/* 5. 메뉴명 */}
                      <tr>
                        <th>메뉴명</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{formatValue(detail.menuName)}</span>
                            </li>
                            {detail.masterMenuCode && (
                              <li className="detail-data-item">
                                <span className="detail-data-text">{detail.masterMenuCode}</span>
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                      {/* 6. 마케팅 분류 */}
                      <tr>
                        <th>마케팅 분류</th>
                        <td>
                          <ul className="detail-data-list">
                            {detail.marketingTags?.length > 0
                              ? detail.marketingTags.map((code) => (
                                <li key={code} className="detail-data-item">
                                  <span className="detail-data-text">
                                    {codeMap.marketing[code] ?? code}
                                  </span>
                                </li>
                              ))
                              : (
                                <li className="detail-data-item">
                                  <span className="detail-data-text">-</span>
                                </li>
                              )}
                          </ul>
                        </td>
                      </tr>
                      {/* 7. 온도 분류 */}
                      <tr>
                        <th>온도 분류</th>
                        <td>
                          <ul className="detail-data-list">
                            {detail.temperatureTags?.length > 0
                              ? detail.temperatureTags.map((code) => (
                                <li key={code} className="detail-data-item">
                                  <span className="detail-data-text">
                                    {codeMap.temperature[code] ?? code}
                                  </span>
                                </li>
                              ))
                              : (
                                <li className="detail-data-item">
                                  <span className="detail-data-text">-</span>
                                </li>
                              )}
                          </ul>
                        </td>
                      </tr>
                      {/* 8. Description */}
                      <tr>
                        <th>Description</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">{detail.description || '-'}</span>
                            </li>
                          </ul>
                        </td>
                      </tr>
                      {/* 9. 이미지 정보 */}
                      <tr>
                        <th>이미지 정보</th>
                        <td>
                          {detail.menuImgFile?.publicUrl ? (
                            <div className="flex items-center gap-3 py-2">
                              <a
                                href={detail.menuImgFile.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 underline cursor-pointer"
                              >
                                {detail.menuImgFile.originalFileName}
                              </a>
                            </div>
                          ) : (
                            <ul className="detail-data-list">
                              <li className="detail-data-item">
                                <span className="detail-data-text">이미지 없음</span>
                              </li>
                            </ul>
                          )}
                        </td>
                      </tr>
                      {/* 10. 가격 */}
                      <tr>
                        <th>가격</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span
                                className="detail-data-text"
                                style={detail.discountPrice != null && detail.discountPrice > 0
                                  ? { textDecoration: 'line-through', color: '#999' }
                                  : undefined}
                              >
                                {detail.salePrice != null ? `${formatPrice(detail.salePrice)}원` : '-'}
                              </span>
                            </li>
                            {detail.discountPrice != null && detail.discountPrice > 0 && (
                              <li className="detail-data-item">
                                <span className="detail-data-text text-red-500">
                                  {formatPrice(detail.discountPrice)}원
                                </span>
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                      {/* 11. 프로모션 가격 */}
                      <tr>
                        <th>프로모션 가격</th>
                        <td>
                          <ul className="detail-data-list">
                            {detail.promotionStartDate || detail.promotionEndDate ? (
                              <>
                                {detail.discountPrice != null && (
                                  <li className="detail-data-item">
                                    <span className="detail-data-text">
                                      {formatPrice(detail.discountPrice)}원
                                    </span>
                                  </li>
                                )}
                                <li className="detail-data-item">
                                  <span className="detail-data-text">
                                    {formatDateYmd(detail.promotionStartDate)} ~ {formatDateYmd(detail.promotionEndDate)}
                                  </span>
                                </li>
                              </>
                            ) : (
                              <li className="detail-data-item">
                                <span className="detail-data-text">-</span>
                              </li>
                            )}
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </AnimateHeight>
          </div>
          {/* 옵션 구성 섹션 */}
          {detail.optionSets?.length > 0 && (
            <div className={`slidebox-wrap mt-6 ${optionInfoOpen ? '' : 'close'}`}>
              <div className="slidebox-header">
                <h2>옵션 구성</h2>
                <div className="slidebox-btn-wrap">
                  <button className="slidebox-btn arr" onClick={() => setOptionInfoOpen(!optionInfoOpen)}>
                    <i className="arr-icon"></i>
                  </button>
                </div>
              </div>
              <AnimateHeight duration={300} height={optionInfoOpen ? 'auto' : 0}>
                <div className="slidebox-body">
                  <div className="detail-data-wrap">
                    <table className="detail-data-table">
                      <colgroup>
                        <col width="200px" />
                        <col />
                      </colgroup>
                      <tbody>
                        {detail.optionSets.map((optionSet: StoreMenuOptionSet, setIdx: number) => (
                          <tr key={optionSet.id}>
                            <th>옵션 SET #{setIdx + 1}</th>
                            <td>
                              <div className="data-option-wrap">
                                <div className="data-option-item">
                                  <ul className="detail-data-list">
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">{optionSet.setName}</span>
                                    </li>
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">
                                        {optionSet.isRequired ? '필수 선택' : '필수 선택 아님'}
                                      </span>
                                    </li>
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">
                                        {optionSet.isMultipleChoice ? '다중 선택' : '다중 선택 아님'}
                                      </span>
                                    </li>
                                    {!optionSet.isActive && (
                                      <li className="detail-data-item">
                                        <span className="detail-data-text red">숨김</span>
                                      </li>
                                    )}
                                  </ul>
                                </div>
                                <div className="data-option-item">
                                  {optionSet.optionSetItems?.length > 0 ? (
                                    optionSet.optionSetItems.map((item) => (
                                      <ul key={item.id} className="detail-data-list">
                                        <li className="detail-data-item">
                                          <span className="detail-data-text">
                                            <span className={item.operationStatus !== OPERATION_STATUS_ACTIVE ? 'red' : ''}>
                                              ({codeMap.status[item.operationStatus] ?? item.operationStatus})
                                            </span>
                                            {' '}{item.optionSetItemName}
                                          </span>
                                        </li>
                                        <li className="detail-data-item">
                                          <span className="detail-data-text">{item.optionSetItemCode}</span>
                                        </li>
                                        <li className="detail-data-item">
                                          <span className="detail-data-text">
                                            {item.additionalPrice != null ? `${formatPrice(item.additionalPrice)}원` : '0원'}
                                          </span>
                                        </li>
                                        <li className="detail-data-item">
                                          <span className="detail-data-text">
                                            {item.isQuantity ? '수량입력' : '수량입력 아님'}
                                          </span>
                                        </li>
                                        <li className="detail-data-item">
                                          <span className="detail-data-text">
                                            {item.isDefault ? '디폴트' : '디폴트 아님'}
                                          </span>
                                        </li>
                                        {!item.isActive && (
                                          <li className="detail-data-item">
                                            <span className="detail-data-text red">숨김</span>
                                          </li>
                                        )}
                                      </ul>
                                    ))
                                  ) : (
                                    <span className="detail-data-text text-gray-400">옵션 항목 없음</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </AnimateHeight>
            </div>
          )}

          {/* 카테고리 설정 섹션 */}
          {detail.categories?.length > 0 && (
            <div className={`slidebox-wrap mt-6 ${categoryInfoOpen ? '' : 'close'}`}>
              <div className="slidebox-header">
                <h2>카테고리 설정</h2>
                <div className="slidebox-btn-wrap">
                  <button className="slidebox-btn arr" onClick={() => setCategoryInfoOpen(!categoryInfoOpen)}>
                    <i className="arr-icon"></i>
                  </button>
                </div>
              </div>
              <AnimateHeight duration={300} height={categoryInfoOpen ? 'auto' : 0}>
                <div className="slidebox-body">
                  <div className="detail-data-wrap">
                    <table className="detail-data-table">
                      <colgroup>
                        <col width="200px" />
                        <col />
                      </colgroup>
                      <tbody>
                        <tr>
                          <th>카테고리</th>
                          <td>
                            <ul className="detail-data-list">
                              {detail.categories.map((cat) => (
                                <li key={cat.menuCategoryId ?? cat.categoryId} className="detail-data-item">
                                  <span className="detail-data-text">
                                    <span className={!cat.isActive ? 'red' : ''}>
                                      ({cat.isActive ? '운영' : '미운영'})
                                    </span>
                                    {' '}{cat.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </AnimateHeight>
            </div>
          )}

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
                    <Input value={detail?.createdByLoginId ? `${detail.createdByName}(${detail.createdByLoginId})` : '-'} disabled />
                  </td>
                  <th>등록일시</th>
                  <td>
                    <Input value={formatDateYmd(detail?.createdAt)} disabled />
                  </td>
                </tr>
                <tr>
                  <th>최종 수정자</th>
                  <td>
                    <Input value={detail?.updatedByLoginId ? `${detail.updatedByName}(${detail.updatedByLoginId})` : '-'} disabled />
                  </td>
                  <th>최종 수정일시</th>
                  <td>
                    <Input value={formatDateYmd(detail?.updatedAt)} disabled />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !detail && <div className="data-empty">조회할 메뉴를 선택하세요.</div>}
    </div>
  )
}
