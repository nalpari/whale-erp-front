'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tooltip } from 'react-tooltip'
import Location from '@/components/ui/Location'
import { useAlert } from '@/components/common/ui'
import RadioButtonGroup from '@/components/common/ui/RadioButtonGroup'
import RangeDatePicker from '@/components/ui/common/RangeDatePicker'
import SearchSelect from '@/components/ui/common/SearchSelect'
import {
  useCreateStorePromotion,
  useUpdateStorePromotion,
  useBpHeadOfficeTree,
  useStoreOptions,
} from '@/hooks/queries'
import { useStoreMenuList } from '@/hooks/queries/use-store-menu-queries'
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
import type { StorePromotionDetailResponse, StorePromotionErrorResponse } from '@/types/store-promotion'
import { isAxiosError } from 'axios'

const BREADCRUMBS = ['Home', '마스터', '가격 관리', '점포용 프로모션 가격 관리']

const MENU_PROPERTY_OPTIONS = Object.entries(MENU_PROPERTY_LABEL).map(([value, label]) => ({
  value: value as MenuProperty,
  label,
}))

interface MenuRow {
  rowId: number
  menuId: number
  menuName: string
  salePrice: number | null
  discountPrice: number | null
  promotionPrice: number | null
  checked: boolean
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

interface StorePromotionDetailProps {
  promotionId: number | null
  initialData?: StorePromotionDetailResponse | null
}

export default function StorePromotionDetail({ promotionId, initialData }: StorePromotionDetailProps) {
  const router = useRouter()
  const isEditMode = promotionId != null

  const menuRowIdRef = useRef(0)
  const nextMenuRowId = () => ++menuRowIdRef.current
  const createEmptyMenuRow = (): MenuRow => ({
    rowId: nextMenuRowId(),
    menuId: 0,
    menuName: '',
    salePrice: null,
    discountPrice: null,
    promotionPrice: null,
    checked: false,
  })

  const { alert, confirm } = useAlert()
  const { mutateAsync: createPromotion } = useCreateStorePromotion()
  const { mutateAsync: updatePromotion } = useUpdateStorePromotion()

  // BP 트리 조회
  const { accessToken, affiliationId } = useAuthStore()
  const isReady = Boolean(accessToken && affiliationId)
  const { data: bpTree = [], isPending: bpLoading } = useBpHeadOfficeTree(isReady)

  // 메뉴 소유 구분 (초기값: initialData에서 파생)
  const [menuProperty, setMenuProperty] = useState<MenuProperty>(
    initialData?.franchiseId ? MENU_PROPERTY.FRANCHISE : MENU_PROPERTY.HEAD_OFFICE
  )

  // 본사/가맹점/점포 선택
  const [officeId, setOfficeId] = useState<number | null>(initialData?.headOfficeId ?? null)
  const [franchiseId, setFranchiseId] = useState<number | null>(initialData?.franchiseId ?? null)
  const [storeId, setStoreId] = useState<number | null>(initialData?.storeId ?? null)

  // 프로모션명, 기간
  const [promotionName, setPromotionName] = useState(initialData?.promotionName ?? '')
  const [startDate, setStartDate] = useState<Date | null>(
    initialData?.startDate ? new Date(initialData.startDate) : null
  )
  const [endDate, setEndDate] = useState<Date | null>(
    initialData?.endDate ? new Date(initialData.endDate) : null
  )

  // 메뉴 목록 (초기값: initialData에서 파생)
  const [menuRows, setMenuRows] = useState<MenuRow[]>(() =>
    initialData?.promotionMenus && initialData.promotionMenus.length > 0
      ? initialData.promotionMenus.map((m) => ({
          rowId: nextMenuRowId(),
          menuId: m.menuId,
          menuName: m.menuName,
          salePrice: m.salePrice,
          discountPrice: m.discountPrice,
          promotionPrice: m.promotionPrice,
          checked: false,
        }))
      : [createEmptyMenuRow()]
  )

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
  const [isSaving, setIsSaving] = useState(false)

  const handleMenuPropertyChange = (value: MenuProperty) => {
    setMenuProperty(value)
    setFranchiseId(null)
    setStoreId(null)
    setMenuRows([createEmptyMenuRow()])
    setShowFranchiseError(false)
    setShowMenuError(false)
  }

  const handleBpChange = (next: { head_office: number | null; franchise: number | null; store: number | null }) => {
    if (next.head_office !== effectiveOfficeId || next.franchise !== effectiveFranchiseId) {
      // 본사/가맹점 변경 시 메뉴 초기화
      setMenuRows([createEmptyMenuRow()])
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
        const calculated =
          bulkType === 'FIXED'
            ? row.salePrice - inputNum
            : Math.round(row.salePrice - row.salePrice * (inputNum / 100))
        return { ...row, promotionPrice: Math.max(0, calculated) }
      })
    )
  }

  const handleAddMenu = () => {
    setMenuRows((prev) => [...prev, createEmptyMenuRow()])
  }

  const handleRemoveMenu = (idx: number) => {
    setMenuRows((prev) => {
      if (prev.length <= 1) return [createEmptyMenuRow()]
      return prev.filter((_, i) => i !== idx)
    })
  }

  // BP 선택 인라인 로직 (HeadOfficeFranchiseStoreSelect 동일 기능)
  const showFranchise = menuProperty === MENU_PROPERTY.FRANCHISE

  const isOfficeFixed = bpTree.length === 1
  const isFranchiseFixed = isOfficeFixed && bpTree[0]?.franchises.length === 1

  // 단일 본사/가맹점 계정일 때 자동 선택 (파생 값)
  const effectiveOfficeId = isOfficeFixed ? bpTree[0].id : officeId
  const effectiveFranchiseId = isFranchiseFixed ? bpTree[0].franchises[0].id : franchiseId

  const officeOptions = buildOfficeOptions(bpTree)
  const franchiseOptions = buildFranchiseOptions(bpTree, effectiveOfficeId)
  const { data: storeOptionList = [], isPending: storeLoading } = useStoreOptions(
    effectiveOfficeId,
    effectiveFranchiseId,
    isReady
  )
  const storeOptions = storeOptionList.map((opt) => ({ value: String(opt.id), label: opt.storeName }))

  // 선택한 본사/가맹점/점포에 해당하는 메뉴 목록 조회 (운영 메뉴만)
  const canFetchMenus = effectiveOfficeId != null
  const { data: storeMenuData } = useStoreMenuList(
    {
      bpId: effectiveOfficeId ?? undefined,
      storeId: storeId ?? undefined,
      menuGroup: storeId != null ? 'MNGRP_002' : 'MNGRP_001',
      operationStatus: 'STOPR_001',
      page: 0,
      size: 9999, // 전체 메뉴 조회 (페이지네이션 없이)
    },
    canFetchMenus
  )
  const menuSelectOptions = (storeMenuData?.content ?? []).map((m: StoreMenuItem) => ({
    value: String(m.id),
    label: m.menuName,
    salePrice: m.salePrice,
    discountPrice: m.discountPrice,
  }))

  // O(1) 룩업용 Map (메뉴 ID → 옵션)
  const menuOptionMap = new Map(menuSelectOptions.map((opt) => [opt.value, opt]))

  // 이미 선택된 메뉴 ID 집합 (중복 방지용)
  const selectedMenuIds = new Set(menuRows.filter((r) => r.menuId !== 0).map((r) => r.menuId))

  const handleMenuSelect = (idx: number, menuId: string | null) => {
    if (!menuId) {
      setMenuRows((prev) =>
        prev.map((row, i) =>
          i === idx ? createEmptyMenuRow() : row
        )
      )
      return
    }
    const numericMenuId = Number(menuId)
    // 같은 폼 내 메뉴 중복 선택 방지 (현재 행 제외)
    const currentRowMenuId = menuRows[idx]?.menuId
    if (numericMenuId !== currentRowMenuId && selectedMenuIds.has(numericMenuId)) {
      alert('이미 선택된 메뉴입니다.')
      return
    }
    const found = menuSelectOptions.find((opt) => opt.value === menuId)
    if (!found) return
    setMenuRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              menuId: numericMenuId,
              menuName: found.label,
              salePrice: found.salePrice,
              discountPrice: found.discountPrice,
            }
          : row
      )
    )
    setShowMenuError(false)
  }

  const validate = (): boolean => {
    let valid = true

    if (!effectiveOfficeId) {
      setShowOfficeError(true)
      valid = false
    }
    if (menuProperty === MENU_PROPERTY.FRANCHISE && !effectiveFranchiseId) {
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
    if (isSaving) return
    setOverlappingMenuIds(new Set())
    setShowPromotionPriceError(false)
    if (!validate()) return

    const confirmed = await confirm('저장하시겠습니까?')
    if (!confirmed) return

    const promotionMenus: StorePromotionMenuPayload[] = menuRows
      .filter((row) => row.menuId !== 0)
      .map((row) => ({
        menuId: row.menuId,
        promotionPrice: row.promotionPrice!,
      }))

    const payload = {
      menuProperty,
      headOfficeId: effectiveOfficeId ?? 0,
      ...(menuProperty === MENU_PROPERTY.FRANCHISE && effectiveFranchiseId ? { franchiseId: effectiveFranchiseId } : {}),
      ...(storeId != null ? { storeId } : {}),
      promotionName: promotionName.trim(),
      startDate: formatDateYmd(startDate, ''),
      endDate: formatDateYmd(endDate, ''),
      promotionMenus,
    } as const

    setIsSaving(true)
    try {
      if (isEditMode) {
        await updatePromotion({
          id: promotionId,
          data: payload,
        })
      } else {
        await createPromotion(payload)
      }
      router.push('/master/pricing/store-promotion')
    } catch (err) {
      if (isAxiosError<StorePromotionErrorResponse>(err) && err.response?.status === 409) {
        const errorData = err.response.data
        if (errorData?.code === 'ERR3106') {
          const ids: number[] = errorData.details?.overlappingMenuIds ?? []
          setOverlappingMenuIds(new Set(ids))
          await alert('중복 프로모션 메뉴가 존재합니다. 표시된 메뉴를 확인해주세요.')
          return
        }
      }
      const message =
        isAxiosError<StorePromotionErrorResponse>(err) && err.response?.data?.message
          ? err.response.data.message
          : '저장에 실패했습니다. 잠시 후 다시 시도해주세요.'
      await alert(message)
    } finally {
      setIsSaving(false)
    }
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
          <button className="btn-form basic" type="button" onClick={handleSave} disabled={isSaving}>
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
                            effectiveOfficeId !== null
                              ? officeOptions.find((opt) => opt.value === String(effectiveOfficeId)) || null
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
                              effectiveFranchiseId !== null &&
                              !nextFranchiseOptions.some((f) => f.id === effectiveFranchiseId)
                            handleBpChange({
                              head_office: nextOfficeId,
                              franchise: shouldClearFranchise ? null : effectiveFranchiseId ?? null,
                              store: null,
                            })
                          }}
                        />
                      </div>
                      {showFranchise && (
                        <div className="mx-500">
                          <SearchSelect
                            value={
                              effectiveFranchiseId !== null
                                ? franchiseOptions.find((opt) => opt.value === String(effectiveFranchiseId)) || null
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
                                head_office: effectiveOfficeId,
                                franchise: nextFranchiseId,
                                store: null,
                              })
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {showOfficeError && !effectiveOfficeId && (
                      <div className="warning-txt mt5">* 본사를 선택해주세요.</div>
                    )}
                    {showFranchiseError && showFranchise && !effectiveFranchiseId && (
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
                            head_office: effectiveOfficeId,
                            franchise: effectiveFranchiseId,
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
                            aria-label="프로모션명 초기화"
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
            {showMenuError && menuRows.every((row) => row.menuId === 0) && (
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
                    <tr key={row.rowId}>
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
                                    ? menuOptionMap.get(String(row.menuId)) ?? { value: String(row.menuId), label: row.menuName }
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
                              <button type="button" className="icon-more" id={`more-btn-anchor-menu-${idx}`} aria-label={`메뉴 #${idx + 1} 옵션`} />
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
