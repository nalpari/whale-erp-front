'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import RadioButtonGroup from '@/components/common/ui/RadioButtonGroup'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import CubeLoader from '@/components/common/ui/CubeLoader'
import SearchSelect from '@/components/ui/common/SearchSelect'
import {
  useStorePromotionDetail,
  useCreateStorePromotion,
  useUpdateStorePromotion,
  useBpHeadOfficeTree,
  useStoreOptions,
} from '@/hooks/queries'
import { useStoreMenuList } from '@/hooks/queries/use-store-menu-queries'
import { useQueryClient } from '@tanstack/react-query'
import { storePromotionKeys } from '@/hooks/queries/query-keys'
import { useAuthStore } from '@/stores/auth-store'
import { formatDateYmd } from '@/util/date-util'
import { formatPrice } from '@/util/format-util'
import {
  MENU_PROPERTY,
  MENU_PROPERTY_LABEL,
  type MenuProperty,
  type StorePromotionMenuPayload,
} from '@/types/store-promotion'
import type { BpHeadOfficeNode } from '@/types/bp'
import type { StoreMenuItem } from '@/types/store-menu'
import { isAxiosError } from 'axios'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

const MENU_PROPERTY_OPTIONS = Object.entries(MENU_PROPERTY_LABEL).map(([value, label]) => ({
  value: value as MenuProperty,
  label,
}))

interface MenuRow {
  menuId: number
  menuName: string
  salePrice: number | null
  discountPrice: number | null
  promotionPrice: number | null
  checked: boolean
}

const EMPTY_MENU_ROW: MenuRow = {
  menuId: 0,
  menuName: '',
  salePrice: null,
  discountPrice: null,
  promotionPrice: null,
  checked: false,
}

const buildOfficeOptions = (tree: BpHeadOfficeNode[]) =>
  tree.map((office) => ({ value: String(office.id), label: office.name }))

const buildFranchiseOptions = (tree: BpHeadOfficeNode[], oid: number | null) =>
  oid !== null
    ? tree
        .find((office) => office.id === oid)
        ?.franchises.map((f) => ({ value: String(f.id), label: f.name })) ?? []
    : tree.flatMap((office) =>
        office.franchises.map((f) => ({ value: String(f.id), label: f.name }))
      )

export default function StorePromotionDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get('id')
  const promotionId = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null
  const isEditMode = promotionId != null

  const { alert, confirm } = useAlert()
  const queryClient = useQueryClient()
  const { mutateAsync: createPromotion } = useCreateStorePromotion()
  const { mutateAsync: updatePromotion } = useUpdateStorePromotion()

  // BP 트리 조회
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree(isReady)

  // 메뉴 소유 구분
  const [menuProperty, setMenuProperty] = useState<MenuProperty>(MENU_PROPERTY.HEAD_OFFICE)

  // 본사/가맹점/점포 선택
  const [officeId, setOfficeId] = useState<number | null>(null)
  const [franchiseId, setFranchiseId] = useState<number | null>(null)
  const [storeId, setStoreId] = useState<number | null>(null)

  // 프로모션명, 기간
  const [promotionName, setPromotionName] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // 메뉴 목록 (디폴트 빈 행 1개)
  const [menuRows, setMenuRows] = useState<MenuRow[]>([{ ...EMPTY_MENU_ROW }])

  // 일괄 적용 필드
  const [bulkType, setBulkType] = useState<'FIXED' | 'RATE'>('FIXED')
  const [bulkValue, setBulkValue] = useState('')

  // 유효성 에러
  const [showOfficeError, setShowOfficeError] = useState(false)
  const [showFranchiseError, setShowFranchiseError] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const [showDateError, setShowDateError] = useState(false)
  const [showMenuError, setShowMenuError] = useState(false)
  const [showPromotionPriceError, setShowPromotionPriceError] = useState(false)
  const [overlappingMenuIds, setOverlappingMenuIds] = useState<Set<number>>(new Set())

  // 수정 모드: 상세 조회
  const { data: detail, isPending: detailLoading } = useStorePromotionDetail(promotionId)

  // render-time sync: detail → 로컬 state 초기화
  const [prevDetailId, setPrevDetailId] = useState<number | null>(null)
  if (detail && detail.id !== prevDetailId) {
    setPrevDetailId(detail.id)
    setPromotionName(detail.promotionName ?? '')
    setStartDate(detail.startDate ? new Date(detail.startDate) : null)
    setEndDate(detail.endDate ? new Date(detail.endDate) : null)
    setOfficeId(detail.headOfficeId ?? null)
    setFranchiseId(detail.franchiseId ?? null)
    setStoreId(detail.storeId ?? null)
    setMenuProperty(detail.franchiseId ? MENU_PROPERTY.FRANCHISE : MENU_PROPERTY.HEAD_OFFICE)
    setMenuRows(
      detail.promotionMenus.length > 0
        ? detail.promotionMenus.map((m) => ({
            menuId: m.menuId,
            menuName: m.menuName,
            salePrice: m.salePrice,
            discountPrice: m.discountPrice,
            promotionPrice: m.promotionPrice,
            checked: false,
          }))
        : [{ ...EMPTY_MENU_ROW }]
    )
  }

  const handleMenuPropertyChange = (value: MenuProperty) => {
    setMenuProperty(value)
    setFranchiseId(null)
    setStoreId(null)
    setMenuRows([{ ...EMPTY_MENU_ROW }])
    setShowFranchiseError(false)
    setShowMenuError(false)
  }

  const handleBpChange = (next: { head_office: number | null; franchise: number | null; store: number | null }) => {
    if (next.head_office !== officeId || next.franchise !== franchiseId) {
      // 본사/가맹점 변경 시 메뉴 초기화
      setMenuRows([{ ...EMPTY_MENU_ROW }])
    }
    setOfficeId(next.head_office)
    setFranchiseId(next.franchise)
    setStoreId(next.store)
    if (next.head_office) setShowOfficeError(false)
    if (next.franchise) setShowFranchiseError(false)
  }

  const handleMenuCheck = (idx: number) => {
    setMenuRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, checked: !row.checked } : row))
    )
  }

  const handlePromotionPriceChange = (idx: number, value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return
    const numValue = value === '' ? null : Number(value)
    setMenuRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, promotionPrice: numValue } : row))
    )
    if (numValue != null) {
      setShowMenuError(false)
      setShowPromotionPriceError(false)
    }
  }

  const handleBulkApply = () => {
    const inputNum = bulkValue === '' ? null : Number(bulkValue)
    if (inputNum == null || Number.isNaN(inputNum)) return
    setMenuRows((prev) =>
      prev.map((row) => {
        if (!row.checked || row.salePrice == null) return row
        const promotionPrice =
          bulkType === 'FIXED'
            ? row.salePrice - inputNum
            : Math.round(row.salePrice - row.salePrice * (inputNum / 100))
        return { ...row, promotionPrice }
      })
    )
  }

  const handleAddMenu = () => {
    setMenuRows((prev) => [...prev, { ...EMPTY_MENU_ROW }])
  }

  const handleRemoveMenu = (idx: number) => {
    setMenuRows((prev) => prev.filter((_, i) => i !== idx))
  }

  // BP 선택 인라인 로직 (HeadOfficeFranchiseStoreSelect 동일 기능)
  const showFranchise = menuProperty === MENU_PROPERTY.FRANCHISE

  const officeOptions = buildOfficeOptions(bpTree)
  const franchiseOptions = buildFranchiseOptions(bpTree, officeId)
  const { data: storeOptionList = [], isPending: storeLoading } = useStoreOptions(
    officeId,
    franchiseId,
    isReady
  )
  const storeOptions = storeOptionList.map((opt) => ({ value: String(opt.id), label: opt.storeName }))

  const isOfficeFixed = bpTree.length === 1
  const isFranchiseFixed = isOfficeFixed && bpTree[0]?.franchises.length === 1

  // 자동 선택: 단일 본사/가맹점 계정 값 자동 고정 (render-time sync)
  if (!bpLoading && bpTree.length === 1) {
    const office = bpTree[0]
    const autoFranchiseId = office.franchises.length === 1 ? office.franchises[0].id : null
    if (officeId !== office.id) {
      setOfficeId(office.id)
    }
    if (autoFranchiseId !== null && franchiseId !== autoFranchiseId) {
      setFranchiseId(autoFranchiseId)
    }
  }

  // 선택한 본사/가맹점/점포에 해당하는 메뉴 목록 조회 (운영 메뉴만)
  const canFetchMenus = officeId != null
  const { data: storeMenuData } = useStoreMenuList(
    {
      bpId: officeId ?? undefined,
      storeId: storeId ?? undefined,
      operationStatus: 'STOPR_001',
      page: 0,
      size: 500,
    },
    canFetchMenus
  )
  const menuSelectOptions = (storeMenuData?.content ?? []).map((m: StoreMenuItem) => ({
    value: String(m.id),
    label: m.menuName,
    salePrice: m.salePrice,
    discountPrice: m.discountPrice,
  }))

  const handleMenuSelect = (idx: number, menuId: string | null) => {
    if (!menuId) {
      setMenuRows((prev) =>
        prev.map((row, i) =>
          i === idx ? { ...EMPTY_MENU_ROW } : row
        )
      )
      return
    }
    const found = menuSelectOptions.find((opt) => opt.value === menuId)
    if (!found) return
    setMenuRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              menuId: Number(menuId),
              menuName: found.label,
              salePrice: found.salePrice,
              discountPrice: found.discountPrice,
            }
          : row
      )
    )
  }

  const validate = (): boolean => {
    let valid = true

    if (!officeId) {
      setShowOfficeError(true)
      valid = false
    }
    if (menuProperty === MENU_PROPERTY.FRANCHISE && !franchiseId) {
      setShowFranchiseError(true)
      valid = false
    }
    if (!promotionName.trim()) {
      setShowNameError(true)
      valid = false
    }
    if (!startDate || !endDate) {
      setShowDateError(true)
      valid = false
    }
    const activeMenuRows = menuRows.filter((row) => row.menuId !== 0)
    if (activeMenuRows.length === 0) {
      setShowMenuError(true)
      valid = false
    }
    if (activeMenuRows.some((row) => row.promotionPrice == null)) {
      setShowPromotionPriceError(true)
      valid = false
    }

    return valid
  }

  const handleSave = async () => {
    setOverlappingMenuIds(new Set())
    setShowPromotionPriceError(false)
    if (!validate()) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    const promotionMenus: StorePromotionMenuPayload[] = menuRows
      .filter((row) => row.menuId !== 0)
      .map((row) => ({
        menuId: row.menuId,
        promotionPrice: row.promotionPrice ?? 0,
      }))

    const payload = {
      menuProperty,
      headOfficeId: officeId!,
      ...(menuProperty === MENU_PROPERTY.FRANCHISE && franchiseId ? { franchiseId } : {}),
      ...(storeId != null ? { storeId } : {}),
      promotionName: promotionName.trim(),
      startDate: formatDateYmd(startDate, ''),
      endDate: formatDateYmd(endDate, ''),
      promotionMenus,
    } as const

    try {
      if (isEditMode) {
        await updatePromotion({
          id: promotionId,
          data: payload,
        })
        queryClient.invalidateQueries({ queryKey: storePromotionKeys.detail(promotionId) })
        queryClient.invalidateQueries({ queryKey: storePromotionKeys.lists() })
      } else {
        await createPromotion(payload)
        queryClient.invalidateQueries({ queryKey: storePromotionKeys.lists() })
      }
      router.push('/master/pricing/store-promotion')
    } catch (err) {
      if (
        isAxiosError(err) &&
        err.response?.status === 409 &&
        err.response?.data?.code === 'ERR3106'
      ) {
        const ids: number[] = err.response.data.details?.overlappingMenuIds ?? []
        setOverlappingMenuIds(new Set(ids))
        return
      }
      const message =
        isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
      await alert(message)
    }
  }

  if (isEditMode && detailLoading) {
    return (
      <div className="data-wrap">
        <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
        <div className="cube-loader-overlay"><CubeLoader /></div>
      </div>
    )
  }

  return (
    <div className="data-wrap">
      <Location title="점포용 프로모션 가격 관리" list={BREADCRUMBS} />
      <div className="contents-wrap">
        <div className="contents-btn">
          <button
            className="btn-form gray"
            type="button"
            onClick={() => router.push('/master/pricing/store-promotion')}
          >
            목록
          </button>
          <button className="btn-form basic" type="button" onClick={handleSave}>
            저장
          </button>
        </div>
        <div className="contents-body">
          {/* 기본 정보 */}
          <div className="content-wrap">
            <table className="default-table">
              <colgroup>
                <col width="180px" />
                <col />
              </colgroup>
              <tbody>
                {/* 메뉴 소유 구분 */}
                <tr>
                  <th>
                    메뉴 소유 구분 <span className="red">*</span>
                  </th>
                  <td>
                    <RadioButtonGroup
                      options={MENU_PROPERTY_OPTIONS}
                      value={menuProperty}
                      onChange={handleMenuPropertyChange}
                    />
                  </td>
                </tr>
                {/* 본사/가맹점 선택 — pub 레이아웃 */}
                <tr>
                  <th>
                    {showFranchise ? '본사/가맹점 선택' : '본사 선택'}{' '}
                    <span className="red">*</span>
                  </th>
                  <td>
                    <div className="filed-flx">
                      <div className="mx-500">
                        <SearchSelect
                          value={
                            isOfficeFixed
                              ? officeOptions.find((opt) => opt.value === String(bpTree[0]?.id)) || null
                              : officeId !== null
                                ? officeOptions.find((opt) => opt.value === String(officeId)) || null
                                : null
                          }
                          options={officeOptions}
                          placeholder="본사 선택"
                          isDisabled={bpLoading || isOfficeFixed}
                          isSearchable
                          isClearable
                          onChange={(option) => {
                            const nextOfficeId = option ? Number(option.value) : null
                            const nextFranchiseOptions = nextOfficeId !== null
                              ? bpTree.find((o) => o.id === nextOfficeId)?.franchises ?? []
                              : bpTree.flatMap((o) => o.franchises)
                            const shouldClearFranchise =
                              franchiseId !== null &&
                              !nextFranchiseOptions.some((f) => f.id === franchiseId)
                            handleBpChange({
                              head_office: nextOfficeId,
                              franchise: shouldClearFranchise ? null : franchiseId ?? null,
                              store: null,
                            })
                          }}
                        />
                      </div>
                      {showFranchise && (
                        <div className="mx-500">
                          <SearchSelect
                            value={
                              isFranchiseFixed
                                ? franchiseOptions.find((opt) => opt.value === String(bpTree[0]?.franchises[0]?.id)) || null
                                : franchiseId !== null
                                  ? franchiseOptions.find((opt) => opt.value === String(franchiseId)) || null
                                  : null
                            }
                            options={franchiseOptions}
                            placeholder="가맹점 선택"
                            isDisabled={bpLoading || isFranchiseFixed}
                            isSearchable
                            isClearable
                            onChange={(option) => {
                              const nextFranchiseId = option ? Number(option.value) : null
                              handleBpChange({
                                head_office: officeId,
                                franchise: nextFranchiseId,
                                store: null,
                              })
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {showOfficeError && !officeId && (
                      <div className="warning-txt mt5">* 본사를 선택해주세요.</div>
                    )}
                    {showFranchiseError && showFranchise && !franchiseId && (
                      <div className="warning-txt mt5">* 가맹점을 선택해주세요.</div>
                    )}
                  </td>
                </tr>
                {/* 점포 선택 */}
                <tr>
                  <th>
                    점포 선택
                  </th>
                  <td>
                    <div className="mx-500">
                      <SearchSelect
                        value={storeId !== null ? storeOptions.find((opt) => opt.value === String(storeId)) || null : null}
                        options={storeOptions}
                        placeholder="점포 선택"
                        isDisabled={storeLoading}
                        isSearchable
                        isClearable
                        onChange={(option) => {
                          const nextStoreId = option ? Number(option.value) : null
                          handleBpChange({
                            head_office: officeId,
                            franchise: franchiseId,
                            store: nextStoreId,
                          })
                        }}
                      />
                    </div>
                  </td>
                </tr>
                {/* 프로모션명 */}
                <tr>
                  <th>
                    프로모션 명 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="mx-500">
                      <div className={`input-icon-frame${showNameError && !promotionName.trim() ? ' err' : ''}`}>
                        <input
                          type="text"
                          value={promotionName}
                          onChange={(e) => {
                            setPromotionName(e.target.value)
                            if (e.target.value.trim()) setShowNameError(false)
                          }}
                        />
                        {promotionName && (
                          <button
                            type="button"
                            className="input-icon-btn del"
                            onClick={() => setPromotionName('')}
                          />
                        )}
                      </div>
                    </div>
                    {showNameError && !promotionName.trim() && (
                      <div className="warning-txt mt5">* 필수 입력 항목입니다.</div>
                    )}
                  </td>
                </tr>
                {/* 프로모션 기간 */}
                <tr>
                  <th>
                    프로모션 기간 <span className="red">*</span>
                  </th>
                  <td>
                    <div className="mx-500">
                      <RangeDatePicker
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(range) => {
                          setStartDate(range.startDate)
                          setEndDate(range.endDate)
                          if (range.startDate && range.endDate) setShowDateError(false)
                        }}
                        error={showDateError && (!startDate || !endDate)}
                        helpText={showDateError && (!startDate || !endDate) ? '필수 입력 항목입니다.' : undefined}
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 프로모션 메뉴 구성 */}
          <div className="content-wrap">
            <div className="content-header">프로모션 메뉴 구성</div>
            {showMenuError && menuRows.length === 0 && (
              <div className="warning-txt mb5">* 메뉴를 1개 이상 추가해주세요.</div>
            )}
            <div className="promotion-header">
              <div className="flx-bx g10">
                <div className="filed-tit">
                  할인 분류 <span className="red">*</span>
                </div>
                <div className="mx-300">
                  <select
                    className="select-form"
                    value={bulkType}
                    onChange={(e) => {
                      setBulkType(e.target.value as 'FIXED' | 'RATE')
                      setBulkValue('')
                    }}
                  >
                    <option value="FIXED">정가 할인</option>
                    <option value="RATE">정률 할인</option>
                  </select>
                </div>
                <div className="filed-tit">{bulkType === 'FIXED' ? '할인가' : '할인율'}</div>
                <div className="mx-300">
                  <input
                    type="text"
                    className="input-frame"
                    value={bulkValue}
                    onChange={(e) => {
                      const v = e.target.value
                      if (bulkType === 'RATE') {
                        if (v === '' || /^\d+\.?\d{0,1}$/.test(v)) setBulkValue(v)
                      } else {
                        if (v === '' || /^\d+$/.test(v)) setBulkValue(v)
                      }
                    }}
                  />
                </div>
                <span>{bulkType === 'FIXED' ? '원' : '%'}</span>
                <button className="btn-form outline s" type="button" onClick={handleBulkApply}>
                  적용
                </button>
              </div>
            </div>
            <div className="promotion-body">
              <table className="promotion-table">
                <colgroup>
                  <col width="180px" />
                  <col />
                </colgroup>
                <tbody>
                  {menuRows.map((row, idx) => (
                    <tr key={idx}>
                      <th>
                        <div className="check-form-box">
                          <input
                            type="checkbox"
                            id={`menu-check-${idx}`}
                            checked={row.checked}
                            onChange={() => handleMenuCheck(idx)}
                          />
                          <label htmlFor={`menu-check-${idx}`}>{`메뉴 #${idx + 1}`}</label>
                        </div>
                      </th>
                      <td>
                        <div className="flx-bx">
                          <div className="flx-bx flx1">
                            <div className="block">
                              <SearchSelect
                                value={
                                  row.menuId
                                    ? menuSelectOptions.find((opt) => opt.value === String(row.menuId)) || { value: String(row.menuId), label: row.menuName }
                                    : null
                                }
                                options={menuSelectOptions}
                                placeholder="메뉴 선택"
                                isSearchable
                                isClearable
                                isDisabled={!canFetchMenus}
                                onChange={(opt) => handleMenuSelect(idx, opt?.value ?? null)}
                              />
                            </div>
                          </div>
                          <div className="flx-bx">
                            <div className="filed-tit">판매가</div>
                            <div className="block">
                              <input
                                type="text"
                                className="input-frame"
                                value={row.salePrice != null ? formatPrice(row.salePrice) : ''}
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="flx-bx">
                            <div className="filed-tit">할인가</div>
                            <div className="block">
                              <input
                                type="text"
                                className="input-frame"
                                value={row.discountPrice != null ? formatPrice(row.discountPrice) : ''}
                                readOnly
                              />
                            </div>
                          </div>
                          <div className="flx-bx">
                            <div className="filed-tit">
                              프로모션가 <span className="red">*</span>
                            </div>
                            <div className="block">
                              <input
                                type="text"
                                className={`input-frame${showPromotionPriceError && row.menuId !== 0 && row.promotionPrice == null ? ' err' : ''}`}
                                value={row.promotionPrice != null ? String(row.promotionPrice) : ''}
                                onChange={(e) => handlePromotionPriceChange(idx, e.target.value)}
                              />
                              {showPromotionPriceError && row.menuId !== 0 && row.promotionPrice == null && (
                                <div className="warning-txt mt5">* 필수값입니다</div>
                              )}
                            </div>
                          </div>
                          <div className="auto-right">
                            <div className="more-btn">
                              <span className="icon-more" id={`more-btn-anchor-menu-${idx}`} />
                              <Tooltip
                                className="option-list"
                                anchorSelect={`#more-btn-anchor-menu-${idx}`}
                                place="left-end"
                                offset={0}
                                openOnClick
                                clickable
                                opacity={1}
                              >
                                <button
                                  className="option-item"
                                  type="button"
                                  onClick={() => handleAddMenu()}
                                >
                                  메뉴 추가
                                </button>
                                <button
                                  className="option-item"
                                  type="button"
                                  onClick={() => handleRemoveMenu(idx)}
                                >
                                  메뉴 삭제
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        {overlappingMenuIds.has(row.menuId) && (
                          <div className="warning-txt mt5">
                            * 선택한 메뉴가 현재 진행중인 프로모션에 포함되어 있습니다.
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
