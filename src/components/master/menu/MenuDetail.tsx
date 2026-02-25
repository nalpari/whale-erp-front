'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useAlert } from '@/components/common/ui'
import { useCommonCodeHierarchy } from '@/hooks/queries'
import { useMasterMenuDetail, useDeleteMenu } from '@/hooks/queries/use-master-menu-queries'
import { getErrorMessage } from '@/lib/api'
import type { MenuOptionSetDetail } from '@/lib/schemas/menu'

const BREADCRUMBS = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master', '조회']

interface MenuDetailProps {
  id: number
}

export default function MenuDetail({ id }: MenuDetailProps) {
  const router = useRouter()
  const { alert, confirm } = useAlert()
  const [slideboxOpen, setSlideboxOpen] = useState(true)
  const [optionSlideboxOpen, setOptionSlideboxOpen] = useState(true)

  // API
  const { data: menu, isPending } = useMasterMenuDetail(id)
  const { mutateAsync: deleteMenu } = useDeleteMenu()

  // 공통코드
  const { data: mnprpCodes = [] } = useCommonCodeHierarchy('MNPRP')
  const { data: mntypCodes = [] } = useCommonCodeHierarchy('MNTYP')
  const { data: mncfCodes = [] } = useCommonCodeHierarchy('MNCF')
  const { data: mkcfCodes = [] } = useCommonCodeHierarchy('MKCF')
  const { data: tmpcfCodes = [] } = useCommonCodeHierarchy('TMPCF')

  // 코드→이름 변환 Map
  const mnprpMap = useMemo(() => new Map(mnprpCodes.map((c) => [c.code, c.name])), [mnprpCodes])
  const mntypMap = useMemo(() => new Map(mntypCodes.map((c) => [c.code, c.name])), [mntypCodes])
  const mncfMap = useMemo(() => new Map(mncfCodes.map((c) => [c.code, c.name])), [mncfCodes])
  const mkcfMap = useMemo(() => new Map(mkcfCodes.map((c) => [c.code, c.name])), [mkcfCodes])
  const tmpcfMap = useMemo(() => new Map(tmpcfCodes.map((c) => [c.code, c.name])), [tmpcfCodes])

  // 핸들러
  const handleEdit = () => router.push(`/master/menu/edit/${id}`)
  const handleDelete = async () => {
    const confirmed = await confirm('삭제하시겠습니까?')
    if (!confirmed) return
    try {
      await deleteMenu(id)
      await alert('삭제되었습니다.')
      router.push('/master/menu')
    } catch (error) {
      await alert(getErrorMessage(error, '삭제에 실패했습니다.'))
    }
  }
  const handleList = () => router.push('/master/menu')

  // 운영여부 표시
  const operationStatusText = useMemo(() => {
    if (!menu) return ''
    if (menu.isActive !== undefined) return menu.isActive ? '운영' : '미운영'
    return menu.operationStatus === 'STOPR_001' ? '운영' : '미운영'
  }, [menu])

  // 다국어 필드 (null이 아닌 것만)
  const i18nFields = useMemo(() => {
    if (!menu) return []
    const fields: { label: string; value: string }[] = []
    if (menu.menuNameEng) fields.push({ label: '메뉴 영어', value: menu.menuNameEng })
    if (menu.menuNameChs) fields.push({ label: '메뉴 중국어', value: menu.menuNameChs })
    if (menu.menuNameJpn) fields.push({ label: '메뉴 일어', value: menu.menuNameJpn })
    return fields
  }, [menu])

  if (isPending) {
    return (
      <div className="cube-loader-overlay">
        <CubeLoader />
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="data-wrap">
        <Location title="마스터용 메뉴 관리" list={BREADCRUMBS} />
        <div className="empty-wrap">
          <div className="empty-data">메뉴 정보를 찾을 수 없습니다.</div>
        </div>
        <div className="btn-filed" style={{ justifyContent: 'center', marginTop: '20px' }}>
          <button className="btn-form basic" onClick={handleList}>목록으로</button>
        </div>
      </div>
    )
  }

  const hasMarketingTags = menu.marketingTags && menu.marketingTags.length > 0
  const hasTemperatureTags = menu.temperatureTags && menu.temperatureTags.length > 0
  const hasI18n = i18nFields.length > 0
  const hasImage = !!menu.menuImgFile
  const hasCategories = menu.categories && menu.categories.length > 0
  const hasOptionSets = menu.optionSets && menu.optionSets.length > 0

  return (
    <>
      <Location title="마스터용 메뉴 관리" list={BREADCRUMBS} />
      <div className="master-detail-data">
        {/* 메인 slidebox */}
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>마스터용 메뉴 관리</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn" onClick={handleEdit}>수정</button>
              <button className="slidebox-btn" onClick={handleDelete}>삭제</button>
              <button className="slidebox-btn" onClick={handleList}>목록</button>
              <button className="slidebox-btn arr" onClick={() => setSlideboxOpen(!slideboxOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              {/* 섹션1: 메뉴 Header 정보관리 */}
              <div className="detail-data-wrap">
                <table className="detail-data-table">
                  <colgroup>
                    <col width="200px" />
                    <col />
                  </colgroup>
                  <tbody>
                    {/* 1. 운영여부 및 메뉴그룹 */}
                    <tr>
                      <th>운영여부 및 메뉴그룹</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{operationStatusText}</span>
                          </li>
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              {mnprpMap.get(menu.menuProperty) ?? menu.menuProperty}
                            </span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    {/* 2. Business Partner */}
                    <tr>
                      <th>Business Partner</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{menu.companyName ?? '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    {/* 3. 메뉴타입 */}
                    <tr>
                      <th>메뉴타입</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              {mntypMap.get(menu.menuType) ?? menu.menuType}
                            </span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    {/* 4. 메뉴분류 */}
                    <tr>
                      <th>메뉴분류</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">
                              {menu.menuClassificationCode
                                ? (mncfMap.get(menu.menuClassificationCode) ?? menu.menuClassificationCode)
                                : '-'}
                            </span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    {/* 5. 메뉴명 */}
                    <tr>
                      <th>메뉴명</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{menu.menuName}</span>
                          </li>
                          {menu.menuCode && (
                            <li className="detail-data-item">
                              <span className="detail-data-text">{menu.menuCode}</span>
                            </li>
                          )}
                        </ul>
                      </td>
                    </tr>
                    {/* 6. 다국어 (conditional) */}
                    {hasI18n && (
                      <tr>
                        <th>다국어</th>
                        <td>
                          <ul className="detail-data-list">
                            {i18nFields.map((field) => (
                              <li key={field.label} className="detail-data-item">
                                <span className="detail-data-text">{field.value}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {/* 7. 마케팅 분류 */}
                    {hasMarketingTags && (
                      <tr>
                        <th>마케팅 분류</th>
                        <td>
                          <ul className="detail-data-list">
                            {menu.marketingTags!.map((tag) => (
                              <li key={tag} className="detail-data-item">
                                <span className="detail-data-text">
                                  {mkcfMap.get(tag) ?? tag}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {/* 8. 온도 분류 */}
                    {hasTemperatureTags && (
                      <tr>
                        <th>온도 분류</th>
                        <td>
                          <ul className="detail-data-list">
                            {menu.temperatureTags!.map((tag) => (
                              <li key={tag} className="detail-data-item">
                                <span className="detail-data-text">
                                  {tmpcfMap.get(tag) ?? tag}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {/* 9. Description */}
                    <tr>
                      <th>Description</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">{menu.description ?? '-'}</span>
                          </li>
                        </ul>
                      </td>
                    </tr>
                    {/* 10. 이미지 정보 */}
                    {hasImage && (
                      <tr>
                        <th>이미지 정보</th>
                        <td>
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              {menu.menuImgFile!.publicUrl ? (
                                <a
                                  href={menu.menuImgFile!.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="detail-data-btn"
                                >
                                  {menu.menuImgFile!.originalFileName}
                                </a>
                              ) : (
                                <span className="detail-data-text">
                                  {menu.menuImgFile!.originalFileName}
                                </span>
                              )}
                            </li>
                          </ul>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>카테고리</th>
                      <td>
                        {hasCategories ? (
                          <ul className="detail-data-list">
                            {menu.categories!.map((cat) => (
                              <li key={cat.menuCategoryId} className="detail-data-item">
                                <span className="detail-data-text">
                                  {cat.isActive ? (
                                    <span>(운영)</span>
                                  ) : (
                                    <span className="red">(미운영)</span>
                                  )}
                                  {' '}{cat.name}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <ul className="detail-data-list">
                            <li className="detail-data-item">
                              <span className="detail-data-text">-</span>
                            </li>
                          </ul>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>사용가능 가맹점</th>
                      <td>
                        <ul className="detail-data-list">
                          <li className="detail-data-item">
                            <span className="detail-data-text">전체 가맹점</span>
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

        {/* 섹션3: 옵션구성 */}
        {hasOptionSets && (
          <div className={`slidebox-wrap ${optionSlideboxOpen ? '' : 'close'}`}>
            <div className="slidebox-header">
              <h2>옵션구성</h2>
              <div className="slidebox-btn-wrap">
                <button
                  className="slidebox-btn arr"
                  onClick={() => setOptionSlideboxOpen(!optionSlideboxOpen)}
                >
                  <i className="arr-icon"></i>
                </button>
              </div>
            </div>
            <AnimateHeight duration={300} height={optionSlideboxOpen ? 'auto' : 0}>
              <div className="slidebox-body">
                <div className="detail-data-wrap">
                  <table className="detail-data-table">
                    <colgroup>
                      <col width="200px" />
                      <col />
                    </colgroup>
                    <tbody>
                      {(menu.optionSets as MenuOptionSetDetail[]).map((optionSet, index) => (
                        <tr key={optionSet.id}>
                          <th>옵션 SET #{index + 1}</th>
                          <td>
                            <div className="data-option-wrap">
                              <div className="data-option-item">
                                <ul className="detail-data-list">
                                  <li className="detail-data-item">
                                    <span className="detail-data-text">{optionSet.setName}</span>
                                  </li>
                                  <li className="detail-data-item">
                                    <span className="detail-data-text">
                                      필수: {optionSet.isRequired ? 'Y' : 'N'}
                                    </span>
                                  </li>
                                  <li className="detail-data-item">
                                    <span className="detail-data-text">
                                      다중: {optionSet.isMultipleChoice ? 'Y' : 'N'}
                                    </span>
                                  </li>
                                  {optionSet.displayOrder != null && (
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">
                                        순서: {optionSet.displayOrder}
                                      </span>
                                    </li>
                                  )}
                                  <li className="detail-data-item">
                                    <span className="detail-data-text">
                                      {optionSet.isActive ? '운영' : '미운영'}
                                    </span>
                                  </li>
                                </ul>
                              </div>
                              <div className="data-option-item">
                                {optionSet.optionSetItems?.map((item) => (
                                  <ul key={item.id} className="detail-data-list">
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">
                                        {item.isActive ? (
                                          <span>(운영)</span>
                                        ) : (
                                          <span className="red">(미운영)</span>
                                        )}
                                        {' '}{item.optionName}
                                      </span>
                                    </li>
                                    {item.optionSetItemCode && (
                                      <li className="detail-data-item">
                                        <span className="detail-data-text">{item.optionSetItemCode}</span>
                                      </li>
                                    )}
                                    <li className="detail-data-item">
                                      <span className="detail-data-text">
                                        +{item.additionalPrice.toLocaleString()}원
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
                                  </ul>
                                ))}
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
      </div>
    </>
  )
}
