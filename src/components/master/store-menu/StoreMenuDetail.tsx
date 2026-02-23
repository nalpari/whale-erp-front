'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { Input, useAlert, ImageUpload } from '@/components/common/ui'
import CubeLoader from '@/components/common/ui/CubeLoader'
import RadioButtonGroup from '@/components/common/ui/RadioButtonGroup'
import CheckboxButtonGroup from '@/components/master/store-menu/CheckboxButtonGroup'
import SearchSelect from '@/components/ui/common/SearchSelect'
import { useStoreMenuDetail, useUpdateStoreMenu } from '@/hooks/queries'
import { useCommonCode } from '@/hooks/useCommonCode'
import { formatDateYmd } from '@/util/date-util'
import { formatPrice } from '@/util/format-util'
import { isAxiosError } from 'axios'
import type { StoreMenuCategory, StoreMenuOptionSet, StoreMenuUpdateRequest, StoreMenuFilePayload } from '@/types/store-menu'
import AnimateHeight from 'react-animate-height'
import DatePicker from '@/components/ui/common/DatePicker'

const BREADCRUMBS = ['Home', 'Master data 관리', '점포용 메뉴 관리']

const TAX_OPTIONS = [
  { value: 'TAXABLE', label: '과세' },
  { value: 'TAX_FREE', label: '면세' },
  { value: 'ZERO_RATED', label: '영세' },
] as const

export default function StoreMenuDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const menuIdParam = searchParams.get('id')
  const menuId = menuIdParam && /^\d+$/.test(menuIdParam) ? Number(menuIdParam) : null

  const { data: detail, isPending: loading } = useStoreMenuDetail(menuId)
  const { mutateAsync: updateMenu } = useUpdateStoreMenu()
  const { alert, confirm } = useAlert()

  // 운영여부 로컬 상태
  const [localOperationStatus, setLocalOperationStatus] = useState<string | null>(null)
  const [operationStatusError, setOperationStatusError] = useState<string | null>(null)
  // 옵션 SET / 옵션 아이템의 isActive를 로컬 상태로 관리
  const [optionSetActiveMap, setOptionSetActiveMap] = useState<Record<number, boolean>>({})
  const [optionItemActiveMap, setOptionItemActiveMap] = useState<Record<number, boolean>>({})

  // detail 데이터가 로드/변경되면 로컬 상태 동기화 (렌더 중 동기화 패턴)
  const [prevDetailId, setPrevDetailId] = useState<number | null>(null)
  if (detail && detail.id !== prevDetailId) {
    setPrevDetailId(detail.id)
    setLocalOperationStatus(detail.operationStatus)

    const setMap: Record<number, boolean> = {}
    const itemMap: Record<number, boolean> = {}
    for (const os of detail.optionSets) {
      setMap[os.id] = os.isActive
      for (const item of os.optionSetItems) { itemMap[item.id] = item.isActive }
    }
    setOptionSetActiveMap(setMap)
    setOptionItemActiveMap(itemMap)
  }

  const handleToggleOptionSetActive = (optionSetId: number) => {
    setOptionSetActiveMap((prev) => ({ ...prev, [optionSetId]: !prev[optionSetId] }))
  }

  const handleToggleOptionItemActive = (optionItemId: number) => {
    setOptionItemActiveMap((prev) => ({ ...prev, [optionItemId]: !prev[optionItemId] }))
  }

  const [menuInfoOpen, setMenuInfoOpen] = useState(true)
  const [optionInfoOpen, setOptionInfoOpen] = useState(true)
  const [categoryInfoOpen, setCategoryInfoOpen] = useState(true)

  // 공통코드 조회
  const { children: statusChildren } = useCommonCode('STOPR', true)
  const { children: menuTypeChildren } = useCommonCode('MNTYP', true)
  const { children: marketingChildren } = useCommonCode('MKCF', true)
  const { children: temperatureChildren } = useCommonCode('TMPCF', true)

  // 공통코드 매핑 (코드 → 이름)
  const statusCodeMap = statusChildren.reduce<Record<string, string>>((acc, c) => { acc[c.code] = c.name; return acc }, {})

  // 공통코드 → RadioButtonGroup/CheckboxButtonGroup 옵션 변환
  const statusOptions = statusChildren.map((c) => ({ value: c.code, label: c.name }))
  const menuTypeOptions = menuTypeChildren.map((c) => ({ value: c.code, label: c.name }))
  const marketingOptions = marketingChildren.map((c) => ({ value: c.code, label: c.name }))
  const temperatureOptions = temperatureChildren.map((c) => ({ value: c.code, label: c.name }))

  const handleGoBack = () => {
    if (menuId == null) return
    router.push(`/master/menu/store/header?id=${menuId}`)
  }

  const handleGoList = () => {
    router.push('/master/menu/store')
  }

  /** 저장: 현재 detail 데이터에 로컬 편집 상태(운영여부, 옵션 SET/아이템 isActive)를 반영하여 PUT 요청 */
  const handleSave = async () => {
    if (menuId == null || !detail) return
    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    const payload: StoreMenuUpdateRequest = {
      id: detail.id,
      bpId: detail.bpId,
      operationStatus: localOperationStatus ?? detail.operationStatus,
      menuType: detail.menuType,
      menuName: detail.menuName,
      menuNameEng: detail.menuNameEng,
      menuNameChs: detail.menuNameChs ?? null,
      menuNameCht: detail.menuNameCht ?? null,
      menuNameJpn: detail.menuNameJpn ?? null,
      menuClassificationCode: detail.menuClassificationCode,
      taxType: detail.taxType,
      marketingTags: detail.marketingTags ?? [],
      temperatureTags: detail.temperatureTags ?? [],
      displayOrder: detail.displayOrder,
      description: detail.description,
      categories: detail.categories
        .filter((cat): cat is StoreMenuCategory & { categoryId: number } => cat.categoryId != null)
        .map((cat) => ({
          id: cat.menuCategoryId,
          categoryId: cat.categoryId,
          isDeleted: false,
        })),
      optionSets: detail.optionSets.map((os) => ({
        id: os.id,
        setName: os.setName,
        isRequired: os.isRequired,
        isMultipleChoice: os.isMultipleChoice,
        isActive: optionSetActiveMap[os.id] ?? os.isActive,
        displayOrder: os.displayOrder ?? 0,
        isDeleted: false,
        optionItems: os.optionSetItems.map((item) => ({
          id: item.id,
          optionSetItemId: item.optionSetItemId,
          additionalPrice: item.additionalPrice,
          isQuantity: item.isQuantity,
          quantity: item.quantity,
          isDefault: item.isDefault,
          isActive: optionItemActiveMap[item.id] ?? item.isActive,
          isDeleted: false,
        })),
      })),
    }

    const files: StoreMenuFilePayload = {}

    try {
      await updateMenu({ id: detail.id, payload, files })
      await alert('저장되었습니다.')
      handleGoList()
    } catch (error) {
      if (
        isAxiosError(error) &&
        error.response?.status === 400 &&
        error.response?.data?.code === 'ERR3034'
      ) {
        setOperationStatusError('마스터 메뉴가 미운영 상태이므로 점포 메뉴를 운영 상태로 변경할 수 없습니다.')
      } else {
        await alert('메뉴 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
    }
  }

  // 마스터 메뉴 매핑 여부
  const hasMasterMapping = detail ? !!detail.menuProperty : false
  // 본사 마스터 매핑(MNPRP_001)이고 미운영(STOPR_002) 상태이면 운영여부 변경 불가
  const isOperationStatusLocked = detail
    ? detail.menuProperty === 'MNPRP_001' && (localOperationStatus ?? detail.operationStatus) === 'STOPR_002'
    : false

  return (
    <div className="data-wrap">
      <Location title="점포용 메뉴 관리" list={BREADCRUMBS} />
      {loading && !detail && (
        <div className="cube-loader-overlay">
          <CubeLoader />
        </div>
      )}
      {!loading && !detail && (
        <div className="empty-wrap">
          <div className="empty-data">메뉴 정보를 찾을 수 없습니다.</div>
        </div>
      )}
      {detail && (
      <div className="master-detail-data" key={detail.id}>
        {/* 메뉴 정보 섹션 */}
        <div className={`slidebox-wrap ${menuInfoOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>메뉴 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn" type="button" onClick={handleGoBack}>{`<`}</button>
              <button className="slidebox-btn" type="button" onClick={handleSave}>저장</button>
              <button className="slidebox-btn arr" onClick={() => setMenuInfoOpen(!menuInfoOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={menuInfoOpen ? 'auto' : 0}>
            <div className="slidebox-body">
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>본사/가맹점 선택 <span className="red">*</span></th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-500">
                            <Input value={detail.companyName ?? '-'} disabled />
                          </div>
                          {detail.franchiseId && (
                            <div className="mx-500">
                              <Input value={detail.franchiseName ?? '-'} disabled />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>점포 선택</th>
                      <td>
                        <div className="mx-500">
                          <Input value={detail.storeName ?? '-'} disabled />
                        </div>
                      </td>
                    </tr>
                    {/* 1. 운영여부 */}
                    <tr>
                      <th>운영여부</th>
                      <td>
                        <RadioButtonGroup
                          options={statusOptions}
                          value={localOperationStatus ?? detail.operationStatus}
                          onChange={(val) => {
                            setLocalOperationStatus(val)
                            setOperationStatusError(null)
                          }}
                          disabled={isOperationStatusLocked}
                        />
                        {operationStatusError && (
                          <div className="warning-txt mt5" role="alert">
                            * {operationStatusError}
                          </div>
                        )}
                      </td>
                    </tr>
                    {/* 2. 마스터용 메뉴 mapping */}
                    <tr>
                      <th>마스터용 메뉴 mapping</th>
                      <td>
                        {hasMasterMapping ? (
                          <div className="flex items-center gap-2">
                            <Input value={detail.masterMenuName ?? '-'} disabled />
                            <span className="text-sm text-gray-900 whitespace-nowrap">
                              {detail.masterMenuCode}
                            </span>
                          </div>
                        ) : (
                          <Input value="-" disabled />
                        )}
                      </td>
                    </tr>
                    {/* 3. 메뉴 타입 */}
                    <tr>
                      <th>메뉴 타입 <span className="red">*</span></th>
                      <td>
                        <div className="flex items-center gap-3">
                          <RadioButtonGroup
                            options={menuTypeOptions}
                            value={detail.menuType}
                            onChange={() => { }}
                            disabled={true}
                          />
                          <span className="text-sm text-gray-400 whitespace-nowrap">※ 옵션으로 선택할 경우 단독으로 판매할 수 없고, 각 메뉴의 옵션의 역할만 수행합니다.</span>
                        </div>
                      </td>
                    </tr>
                    {/* 4. 메뉴명(대표) */}
                    <tr>
                      <th>메뉴명(대표) <span className="red">*</span></th>
                      <td>
                        <Input value={detail.menuName ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 5. 메뉴명 영어 */}
                    <tr>
                      <th>메뉴명 영어</th>
                      <td>
                        <Input value={detail.menuNameEng ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 6. 메뉴명 중국어(간체/번체) */}
                    <tr>
                      <th>메뉴명 중국어(간체/번체)</th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-500">
                            <Input value={detail.menuNameChs ?? '-'} disabled />
                          </div>
                          <div className="mx-500">
                            <Input value={detail.menuNameCht ?? '-'} disabled />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 7. 메뉴명 일어 */}
                    <tr>
                      <th>메뉴명 일어</th>
                      <td>
                        <Input value={detail.menuNameJpn ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 8. 과세 */}
                    <tr>
                      <th>과세</th>
                      <td>
                        <div className="flex items-center gap-3">
                          <RadioButtonGroup
                            options={TAX_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                            value={detail.taxType}
                            onChange={() => { }}
                            disabled={true}
                          />
                          <span className="text-sm text-gray-400 whitespace-nowrap">※ 과세로 설정하면 가격에는 VAT를 포함합니다.</span>
                        </div>
                      </td>
                    </tr>
                    {/* 9. 가격 (정가 / 할인가) */}
                    <tr>
                      <th>가격</th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-500">
                            <Input
                              value={detail.salePrice != null ? `${formatPrice(detail.salePrice)}` : '-'}
                              disabled
                            />
                          </div>
                          {detail.discountPrice != null && detail.discountPrice > 0 && (
                            <div className="mx-500">
                              <Input
                                value={formatPrice(detail.discountPrice)}
                                disabled
                              />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* 10. 프로모션 가격 */}
                    <tr>
                      <th>프로모션 가격</th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-500">
                            <Input
                              value={detail.discountPrice != null ? `${formatPrice(detail.discountPrice)}` : '-'}
                              disabled
                            />
                          </div>
                          <div className="date-picker-wrap">
                            <DatePicker
                              value={detail.promotionStartDate ? new Date(detail.promotionStartDate) : null}
                              disabled
                              placeholder="시작일"
                            />
                            <span>~</span>
                            <DatePicker
                              value={detail.promotionEndDate ? new Date(detail.promotionEndDate) : null}
                              disabled
                              placeholder="종료일"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* 11. 마케팅 분류 (옵션 타입이면 숨김) */}
                    {detail.menuType !== 'MNTYP_002' && (
                      <tr>
                        <th>마케팅 분류</th>
                        <td>
                          <CheckboxButtonGroup
                            options={marketingOptions}
                            values={detail.marketingTags ?? []}
                            onChange={() => { }}
                            disabled={true}
                          />
                        </td>
                      </tr>
                    )}
                    {/* 12. 온도 분류 */}
                    <tr>
                      <th>온도 분류</th>
                      <td>
                        <CheckboxButtonGroup
                          options={temperatureOptions}
                          values={detail.temperatureTags ?? []}
                          onChange={() => { }}
                          disabled={true}
                        />
                      </td>
                    </tr>
                    {/* 13. 노출 순서 (옵션 타입이면 숨김) */}
                    {detail.menuType !== 'MNTYP_002' && (
                      <tr>
                        <th>노출 순서</th>
                        <td>
                          <Input value={String(detail.displayOrder ?? '-')} disabled />
                        </td>
                      </tr>
                    )}
                    {/* 14. 메뉴 Description */}
                    <tr>
                      <th>메뉴 Description <span className="red">*</span></th>
                      <td>
                        <Input value={detail.description ?? '-'} disabled />
                      </td>
                    </tr>
                    {/* 15. 메뉴 이미지 */}
                    <tr>
                      <th>메뉴 이미지</th>
                      <td>
                        <ImageUpload
                          images={
                            detail.menuImgFile?.publicUrl
                              ? [{ id: detail.menuImgFile.id ?? 1, name: detail.menuImgFile.originalFileName ?? '', url: detail.menuImgFile.publicUrl }]
                              : []
                          }
                          onAdd={() => {}}
                          onRemove={() => {}}
                          disabled
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
            </div>
          </AnimateHeight>
        </div>

        {/* 옵션 정보 섹션 */}
        {detail.optionSets.length > 0 && (
        <div className={`slidebox-wrap ${optionInfoOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>옵션 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn arr" onClick={() => setOptionInfoOpen(!optionInfoOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={optionInfoOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              <div className="slide-table-wrap">
                {detail.optionSets.map((optionSet: StoreMenuOptionSet, setIdx: number) => (
                    <table key={optionSet.id} className="master-option-table">
                      <colgroup>
                        <col width="190px" />
                        <col />
                      </colgroup>
                      <tbody>
                        <tr>
                          <th className="option-header-tit">옵션 SET {String(setIdx + 1).padStart(2, '0')}</th>
                          <td>
                            <table className="option-header">
                              <colgroup>
                                <col />
                                <col width="150px" />
                                <col width="150px" />
                                <col width="200px" />
                                <col width="110px" />
                              </colgroup>
                              <tbody>
                                <tr>
                                  <td>
                                    <div className="filed-flx">
                                      <div className="option-name">옵션 SET명 <span className="red">*</span></div>
                                      <div className="block">
                                        <input type="text" className="input-frame" readOnly defaultValue={optionSet.setName} />
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="toggle-wrap">
                                      <span className="toggle-txt">필수선택</span>
                                      <div className="toggle-btn">
                                        <input type="checkbox" id={`optset-required-${optionSet.id}`} checked={optionSet.isRequired} disabled />
                                        <label className="slider" htmlFor={`optset-required-${optionSet.id}`}></label>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="toggle-wrap">
                                      <span className="toggle-txt">다중선택</span>
                                      <div className="toggle-btn">
                                        <input type="checkbox" id={`optset-multi-${optionSet.id}`} checked={optionSet.isMultipleChoice} disabled />
                                        <label className="slider" htmlFor={`optset-multi-${optionSet.id}`}></label>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="filed-flx">
                                      <div className="option-name">노출순서</div>
                                      <div className="block">
                                        <input type="text" className="input-frame" readOnly defaultValue={String(optionSet.displayOrder ?? '-')} />
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <div className="filed-flx">
                                      <div className="toggle-btn">
                                        <input
                                          type="checkbox"
                                          id={`toggle-optset-${optionSet.id}`}
                                          checked={optionSetActiveMap[optionSet.id] ?? optionSet.isActive}
                                          onChange={() => handleToggleOptionSetActive(optionSet.id)}
                                        />
                                        <label className="slider" htmlFor={`toggle-optset-${optionSet.id}`}></label>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                        {optionSet.optionSetItems?.length > 0 ? (
                          optionSet.optionSetItems.map((item, itemIdx) => (
                            <tr key={item.id}>
                              <th>
                                <div className="option-num-tit">
                                  <span>옵션 {String(itemIdx + 1).padStart(2, '0')}</span>
                                </div>
                              </th>
                              <td>
                                <table className="option-list">
                                  <colgroup>
                                    <col />
                                    <col width="240px" />
                                    <col width="150px" />
                                    <col width="110px" />
                                    <col width="110px" />
                                  </colgroup>
                                  <tbody>
                                    <tr>
                                      <td>
                                        <div className="filed-flx">
                                          <div className="block">
                                            <input type="text" className="input-frame" readOnly defaultValue={item.optionSetItemName} />
                                          </div>
                                          <span className="explain">{item.optionSetItemCode}</span>
                                          <div className={`store-badge ${item.operationStatus === 'STOPR_001' ? 'blue' : 'org'}`}>
                                            {statusCodeMap[item.operationStatus] ?? item.operationStatus}
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="filed-flx">
                                          <div className="option-name">추가가격</div>
                                          <div className="block">
                                            <input type="text" className="input-frame" readOnly defaultValue={item.additionalPrice != null ? `${formatPrice(item.additionalPrice)}` : '-'} />
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="toggle-wrap">
                                          <span className="toggle-txt">수량입력</span>
                                          <div className="toggle-btn">
                                            <input type="checkbox" id={`optitem-qty-${item.id}`} checked={item.isQuantity} disabled />
                                            <label className="slider" htmlFor={`optitem-qty-${item.id}`}></label>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="toggle-wrap">
                                          <span className="toggle-txt">디폴트</span>
                                          <div className="radio-form-box no-txt">
                                            <input type="radio" name={`default-${optionSet.id}`} id={`optitem-default-${item.id}`} checked={item.isDefault} readOnly />
                                            <label htmlFor={`optitem-default-${item.id}`}></label>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div className="filed-flx">
                                          <div className="toggle-btn">
                                            <input
                                              type="checkbox"
                                              id={`toggle-optitem-${item.id}`}
                                              checked={optionItemActiveMap[item.id] ?? item.isActive}
                                              onChange={() => handleToggleOptionItemActive(item.id)}
                                            />
                                            <label className="slider" htmlFor={`toggle-optitem-${item.id}`}></label>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <th>
                              <div className="option-num-tit">
                                <span>옵션</span>
                              </div>
                            </th>
                            <td>
                              <div className="text-sm text-gray-400 py-3">옵션 항목이 없습니다.</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  ))}
              </div>
            </div>
          </AnimateHeight>
        </div>
        )}

        {/* 카테고리 정보 섹션 */}
        <div className={`slidebox-wrap ${categoryInfoOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>카테고리 정보</h2>
            <div className="slidebox-btn-wrap">
              <button className="slidebox-btn arr" onClick={() => setCategoryInfoOpen(!categoryInfoOpen)}>
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={categoryInfoOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              <div className="slide-table-wrap">
                <table className="default-table white">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>카테고리 선택 <span className="red">*</span></th>
                      <td>
                        <div className="filed-flx">
                          <div className="mx-500">
                            <SearchSelect
                              value={null}
                              options={[]}
                              placeholder="선택"
                              isDisabled={true}
                              isSearchable={false}
                              isClearable={false}
                            />
                          </div>
                        </div>
                        {detail.categories?.length > 0 && (
                          <ul className="category-list">
                            {detail.categories.map((cat) => (
                              <li key={cat.menuCategoryId ?? cat.categoryId} className="category-item">
                                <span className="category-name">
                                  {cat.name}{!cat.isActive && <i> 미운영</i>}
                                </span>
                              </li>
                            ))}
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
        <div className="detail-data-info-wrap">
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
                <Input value={detail.createdByLoginId ? `${detail.createdByName}(${detail.createdByLoginId})` : '-'} disabled />
              </td>
              <th>등록일시</th>
              <td>
                <Input value={formatDateYmd(detail.createdAt)} disabled />
              </td>
            </tr>
            <tr>
              <th>최종 수정자</th>
              <td>
                <Input value={detail.updatedByLoginId ? `${detail.updatedByName}(${detail.updatedByLoginId})` : '-'} disabled />
              </td>
              <th>최종 수정일시</th>
              <td>
                <Input value={formatDateYmd(detail.updatedAt)} disabled />
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
      )}
    </div>
  )
}
