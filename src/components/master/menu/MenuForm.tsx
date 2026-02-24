'use client'

import { useState, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import AnimateHeight from 'react-animate-height'
import Location from '@/components/ui/Location'
import HeadOfficeFranchiseStoreSelect, {
  type OfficeFranchiseStoreValue,
} from '@/components/common/HeadOfficeFranchiseStoreSelect'
import SearchSelect from '@/components/ui/common/SearchSelect'
import OptionSetSection from '@/components/master/menu/OptionSetSection'
import CategorySelectSection from '@/components/master/menu/CategorySelectSection'
import CubeLoader from '@/components/common/ui/CubeLoader'
import { useCommonCodeHierarchy, useStoreOptions } from '@/hooks/queries'
import { useCreateMenu, useUpdateMenu, useMasterMenuDetail } from '@/hooks/queries/use-master-menu-queries'
import { menuFormSchema, type MenuFormData, type OptionSetFormData, type MenuDetailResponse } from '@/lib/schemas/menu'
import { formatZodFieldErrors } from '@/lib/zod-utils'
import { useAlert, Input, RadioButtonGroup, ImageUpload, type ImageItem } from '@/components/common/ui'
import { getErrorMessage } from '@/lib/api'

// 차후 추가 개발 예정 필드 — true로 변경하면 UI에 표시됨
const SHOW_MENU_OWNERSHIP = false
const SHOW_MENU_GROUP = false
const SHOW_STORE_SELECT = false
const SHOW_SET_STATUS = false

interface SelectedCategory {
  id: number
  name: string
  isActive: boolean
  mappingId?: number
}

interface MenuFormProps {
  menuId?: number
}

export default function MenuForm({ menuId }: MenuFormProps) {
  const isEditMode = !!menuId
  const { data: menuDetail, isPending: isDetailLoading } = useMasterMenuDetail(menuId ?? 0)

  if (isEditMode && isDetailLoading) {
    return (
      <div className="cube-loader-overlay">
        <CubeLoader />
      </div>
    )
  }

  return <MenuFormContent key={menuId ?? 'create'} menuId={menuId} initialData={isEditMode ? menuDetail : undefined} />
}

interface MenuFormContentProps {
  menuId?: number
  initialData?: MenuDetailResponse
}

function MenuFormContent({ menuId, initialData }: MenuFormContentProps) {
  const isEditMode = !!menuId
  const router = useRouter()
  const { alert } = useAlert()
  const { mutateAsync: createMenu } = useCreateMenu()
  const { mutateAsync: updateMenu } = useUpdateMenu()
  const uniqueId = useId()

  const breadcrumbs = ['홈', 'Master data 관리', '메뉴 정보 관리', '마스터용 메뉴 Master', isEditMode ? '수정' : '등록']

  const [slideboxOpen, setSlideboxOpen] = useState(true)

  // 기본 정보 (initialData가 있으면 초기값으로 사용 — key 리마운트 패턴)
  const [menuOwnership, setMenuOwnership] = useState<'HEAD_OFFICE' | 'FRANCHISE'>('HEAD_OFFICE')
  const [bpId, setBpId] = useState<number | null>(initialData?.bpId ?? null)
  const [franchiseId, setFranchiseId] = useState<number | null>(null)
  const [menuGroup, setMenuGroup] = useState(initialData?.menuGroup ?? '')
  const [storeId, setStoreId] = useState<number | null>(null)

  // 메뉴 정보
  const [operationStatus, setOperationStatus] = useState(initialData?.operationStatus ?? '')
  const [menuType, setMenuType] = useState(initialData?.menuType ?? '')
  const [setStatus, setSetStatus] = useState(initialData?.setStatus ?? '')
  const [menuClassificationCode, setMenuClassificationCode] = useState(initialData?.menuClassificationCode ?? '')
  const [menuName, setMenuName] = useState(initialData?.menuName ?? '')
  const [menuNameEng, setMenuNameEng] = useState(initialData?.menuNameEng ?? '')
  const [menuNameChs, setMenuNameChs] = useState(initialData?.menuNameChs ?? '')
  const [menuNameCht, setMenuNameCht] = useState(initialData?.menuNameCht ?? '')
  const [menuNameJpn, setMenuNameJpn] = useState(initialData?.menuNameJpn ?? '')
  const [taxType, setTaxType] = useState(initialData?.taxType ?? '')
  const [marketingTags, setMarketingTags] = useState<string[]>(initialData?.marketingTags ?? [])
  const [temperatureTags, setTemperatureTags] = useState<string[]>(initialData?.temperatureTags ?? [])
  const [displayOrder, setDisplayOrder] = useState<number | null>(initialData?.displayOrder ?? null)
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialData?.menuImgFile) {
      return [{ id: initialData.menuImgFile.id, name: initialData.menuImgFile.originalFileName, url: initialData.menuImgFile.publicUrl || undefined }]
    }
    return []
  })

  // 이미지 삭제 추적 (수정 모드)
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null)
  const [existingFileId] = useState<number | null>(initialData?.menuImgFile?.id ?? null)

  // 옵션 SET
  const [optionSets, setOptionSets] = useState<OptionSetFormData[]>(() => {
    if (initialData?.optionSets?.length) {
      return initialData.optionSets.map((os) => ({
        id: os.id,
        setName: os.setName,
        isRequired: os.isRequired,
        isMultipleChoice: os.isMultipleChoice,
        displayOrder: os.displayOrder ?? null,
        isActive: os.isActive,
        optionItems: (os.optionSetItems || []).sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity)).map((item) => ({
          id: item.id,
          optionSetItemId: item.optionSetItemId ?? null,
          optionName: item.optionName,
          additionalPrice: item.additionalPrice,
          isQuantity: item.isQuantity,
          isDefault: item.isDefault,
          isActive: item.isActive ?? true,
          displayOrder: item.displayOrder ?? null,
          selectedMenuCode: item.optionSetItemCode ?? null,
          selectedOperationStatus: item.operationStatus ?? null,
        })),
      }))
    }
    return []
  })

  // 카테고리
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategory[]>(() => {
    if (initialData?.categories?.length) {
      return initialData.categories.map((cat) => ({
        id: cat.categoryId,
        name: cat.name,
        isActive: cat.isActive,
        mappingId: cat.menuCategoryId,
      }))
    }
    return []
  })

  // 에러
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const clearFieldError = useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const { [key]: _, ...rest } = prev
      return rest
    })
  }, [])

  // 공통코드 조회
  const { data: mngrpCodes = [] } = useCommonCodeHierarchy('MNGRP')
  const { data: stoprCodes = [] } = useCommonCodeHierarchy('STOPR')
  const { data: mntypCodes = [] } = useCommonCodeHierarchy('MNTYP')
  const { data: ststCodes = [] } = useCommonCodeHierarchy('STST')
  const { data: mncfCodes = [] } = useCommonCodeHierarchy('MNCF')
  const { data: mkcfCodes = [] } = useCommonCodeHierarchy('MKCF')
  const { data: tmpcfCodes = [] } = useCommonCodeHierarchy('TMPCF')

  // 점포 목록
  const { data: storeOptionList = [] } = useStoreOptions(bpId, franchiseId, !!bpId)
  const storeOptions = storeOptionList.map((s) => ({
    value: String(s.id),
    label: s.storeName,
  }))

  // 공통코드 → 라디오 옵션 변환 (fallback 포함)
  const toRadioOptions = (codes: Array<{ code: string; name: string }>, fallback: Array<{ value: string; label: string }>) =>
    codes.length > 0 ? codes.map((c) => ({ value: c.code, label: c.name })) : fallback

  const menuGroupOptions = toRadioOptions(mngrpCodes, [
    { value: 'MASTER', label: '마스터용' },
    { value: 'STORE', label: '점포용' },
  ])
  const operationOptions = toRadioOptions(stoprCodes, [
    { value: 'ACTIVE', label: '운영' },
    { value: 'INACTIVE', label: '미운영' },
  ])
  const menuTypeOptions = toRadioOptions(mntypCodes, [
    { value: 'MENU', label: '메뉴' },
    { value: 'OPTION', label: '옵션' },
  ])
  const setStatusOptions = toRadioOptions(ststCodes, [
    { value: 'NORMAL', label: '일반메뉴' },
    { value: 'SET', label: '세트메뉴' },
  ])
  const taxOptions = [
    { value: 'TAXABLE', label: '과세' },
    { value: 'TAX_FREE', label: '면세' },
    { value: 'ZERO_RATED', label: '영세율' },
  ]
  const marketingOptions = toRadioOptions(mkcfCodes, [
    { value: 'NEW', label: 'NEW' },
    { value: 'BEST', label: 'BEST' },
    { value: 'EVENT', label: 'EVENT' },
  ])
  const temperatureOptions = toRadioOptions(tmpcfCodes, [
    { value: 'HOT', label: 'HOT' },
    { value: 'COLD', label: 'COLD' },
  ])
  const menuClassOptions = mncfCodes.map((c) => ({
    value: c.code,
    label: c.name,
  }))

  // 본사/가맹점 선택 핸들러
  const handleBpChange = useCallback((value: OfficeFranchiseStoreValue) => {
    setBpId(value.head_office)
    setFranchiseId(value.franchise)
    setStoreId(null)
    clearFieldError('bpId')
  }, [clearFieldError])

  // 이미지 핸들러
  const handleImageAdd = useCallback(
    (files: File[]) => {
      // 기존 이미지가 있었다면 삭제 플래그 설정
      if (existingFileId && images.length > 0 && !images[0].file) {
        setDeleteFileId(existingFileId)
      }
      setImages([{ name: files[0].name, file: files[0] }])
    },
    [existingFileId, images]
  )

  const handleImageRemove = useCallback(() => {
    // 기존 이미지 삭제 시 deleteFileId 설정
    if (existingFileId && images.length > 0 && !images[0].file) {
      setDeleteFileId(existingFileId)
    }
    setImages([])
  }, [existingFileId, images])

  // 저장
  const handleSave = async () => {
    // 숨김 필드는 고정값 사용 (차후 개발 시 SHOW_* 플래그를 true로 변경)
    const resolvedMenuGroup = SHOW_MENU_GROUP
      ? menuGroup
      : initialData?.menuGroup ?? (mngrpCodes.length > 0 ? mngrpCodes[0].code : 'MASTER')
    const resolvedSetStatus = SHOW_SET_STATUS
      ? setStatus
      : initialData?.setStatus ?? (ststCodes.length > 0 ? ststCodes[0].code : 'NORMAL')

    const formData: MenuFormData = {
      menuOwnership,
      bpId: bpId!,
      menuGroup: resolvedMenuGroup,
      storeId: SHOW_STORE_SELECT ? storeId : null,
      operationStatus: operationStatus || operationOptions[0]?.value,
      menuType: menuType || menuTypeOptions[0]?.value,
      setStatus: resolvedSetStatus,
      menuClassificationCode,
      menuName,
      menuNameEng: menuNameEng || null,
      menuNameChs: menuNameChs || null,
      menuNameCht: menuNameCht || null,
      menuNameJpn: menuNameJpn || null,
      taxType: taxType || taxOptions[0]?.value,
      marketingTags,
      temperatureTags,
      displayOrder,
      description,
      optionSets,
      categories: selectedCategories.map((c) => ({
        ...(c.mappingId ? { id: c.mappingId } : {}),
        categoryId: c.id,
      })),
    }

    const result = menuFormSchema.safeParse(formData)
    if (!result.success) {
      setFieldErrors(formatZodFieldErrors(result.error))
      await alert('필수 입력 항목을 확인해주세요.')
      return
    }
    setFieldErrors({})

    try {
      const imageFile = images.length > 0 && images[0].file ? images[0].file : undefined

      if (isEditMode) {
        await updateMenu({
          id: menuId,
          menu: result.data,
          image: imageFile,
          deleteFileId: deleteFileId ?? undefined,
        })
        router.push(`/master/menu/${menuId}`)
      } else {
        await createMenu({
          menu: result.data,
          image: imageFile,
        })
        router.push('/master/menu')
      }
    } catch (error) {
      await alert(getErrorMessage(error, isEditMode ? '메뉴 수정에 실패했습니다.' : '메뉴 등록에 실패했습니다.'))
    }
  }

  return (
    <div className="data-wrap">
      <Location title="마스터용 메뉴 관리" list={breadcrumbs} />
      <div className="master-detail-data">
        <div className={`slidebox-wrap ${slideboxOpen ? '' : 'close'}`}>
          <div className="slidebox-header">
            <h2>마스터용 메뉴 관리</h2>
            <div className="slidebox-btn-wrap">
              <button
                type="button"
                className="slidebox-btn"
                onClick={() => router.push('/master/menu')}
              >
                목록
              </button>
              <button type="button" className="slidebox-btn" onClick={handleSave}>
                저장
              </button>
              <button
                type="button"
                className="slidebox-btn arr"
                onClick={() => setSlideboxOpen(!slideboxOpen)}
              >
                <i className="arr-icon"></i>
              </button>
            </div>
          </div>
          <AnimateHeight duration={300} height={slideboxOpen ? 'auto' : 0}>
            <div className="slidebox-body">
              {/* 섹션1: 기본 정보 */}
              <table className="default-table">
                <colgroup>
                  <col width="190px" />
                  <col />
                </colgroup>
                <tbody>
                  {SHOW_MENU_OWNERSHIP && (
                    <tr>
                      <th>메뉴 소유</th>
                      <td>
                        <RadioButtonGroup
                          options={[
                            { value: 'HEAD_OFFICE', label: '본사' },
                            { value: 'FRANCHISE', label: '가맹점' },
                          ]}
                          value={menuOwnership}
                          onChange={(v) => {
                            setMenuOwnership(v)
                            setBpId(null)
                            setFranchiseId(null)
                            setStoreId(null)
                          }}
                        />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <HeadOfficeFranchiseStoreSelect
                      isHeadOfficeRequired={true}
                      showHeadOfficeError={!!fieldErrors.bpId}
                      fields={
                        menuOwnership === 'FRANCHISE'
                          ? ['office', 'franchise']
                          : ['office']
                      }
                      officeId={bpId}
                      franchiseId={franchiseId}
                      storeId={null}
                      onChange={handleBpChange}
                    />
                  </tr>
                  {SHOW_MENU_GROUP && (
                    <tr>
                      <th>메뉴 그룹</th>
                      <td>
                        <RadioButtonGroup
                          options={menuGroupOptions}
                          value={menuGroup}
                          onChange={setMenuGroup}
                        />
                      </td>
                    </tr>
                  )}
                  {SHOW_STORE_SELECT && (
                    <tr>
                      <th>점포 선택</th>
                      <td>
                        <div className="mx-500">
                          <SearchSelect
                            value={
                              storeId !== null
                                ? storeOptions.find((o) => o.value === String(storeId)) || null
                                : null
                            }
                            options={storeOptions}
                            placeholder="점포 선택"
                            isSearchable={true}
                            isClearable={true}
                            isDisabled={!bpId}
                            onChange={(option) =>
                              setStoreId(option ? Number(option.value) : null)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 섹션2: 메뉴 정보 */}
              <div className="slide-table-wrap">
                <h3>메뉴 정보</h3>
                <table className="default-table">
                  <colgroup>
                    <col width="190px" />
                    <col />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>운영여부</th>
                      <td>
                        <RadioButtonGroup
                          options={operationOptions}
                          value={operationStatus || operationOptions[0]?.value}
                          onChange={setOperationStatus}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>
                        메뉴타입 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="filed-flx">
                          <RadioButtonGroup
                            options={menuTypeOptions}
                            value={menuType || menuTypeOptions[0]?.value}
                            onChange={(v) => {
                              setMenuType(v)
                              clearFieldError('menuType')
                            }}
                            disabled={isEditMode}
                          />
                          {!isEditMode && (
                            <span className="help-txt">※ 옵션으로 선택할 경우 단독으로 판매할 수 없고, 각 메뉴의 옵션의 역할만 수행합니다.</span>
                          )}
                        </div>
                        {fieldErrors.menuType && (
                          <div className="warning-txt mt5">* {fieldErrors.menuType}</div>
                        )}
                      </td>
                    </tr>
                    {SHOW_SET_STATUS && (
                      <tr>
                        <th>세트여부</th>
                        <td>
                          <RadioButtonGroup
                            options={setStatusOptions}
                            value={setStatus}
                            onChange={setSetStatus}
                          />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>
                        메뉴분류 <span className="red">*</span>
                      </th>
                      <td>
                        <div className="mx-500">
                          <SearchSelect
                            options={menuClassOptions}
                            value={menuClassOptions.find((o) => o.value === menuClassificationCode) || null}
                            onChange={(opt) => {
                              setMenuClassificationCode(opt?.value || '')
                              clearFieldError('menuClassificationCode')
                            }}
                            placeholder="메뉴분류 선택"
                            isSearchable={true}
                            isClearable={true}
                          />
                        </div>
                        {fieldErrors.menuClassificationCode && (
                          <div className="warning-txt mt5">* {fieldErrors.menuClassificationCode}</div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>
                        메뉴명(대표) <span className="red">*</span>
                      </th>
                      <td>
                        <Input
                          value={menuName}
                          onChange={(e) => {
                            setMenuName(e.target.value)
                            clearFieldError('menuName')
                          }}
                          placeholder="메뉴명을 입력하세요"
                          error={!!fieldErrors.menuName}
                          helpText={fieldErrors.menuName}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>메뉴명 영어</th>
                      <td>
                        <Input
                          value={menuNameEng}
                          onChange={(e) => setMenuNameEng(e.target.value)}
                          placeholder="English"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>메뉴명 중국어</th>
                      <td>
                        <div className="filed-flx">
                          <Input
                            value={menuNameChs}
                            onChange={(e) => setMenuNameChs(e.target.value)}
                            placeholder="간체"
                          />
                          <Input
                            value={menuNameCht}
                            onChange={(e) => setMenuNameCht(e.target.value)}
                            placeholder="번체"
                          />
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>메뉴명 일어</th>
                      <td>
                        <Input
                          value={menuNameJpn}
                          onChange={(e) => setMenuNameJpn(e.target.value)}
                          placeholder="日本語"
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>과세</th>
                      <td>
                        <div className="filed-flx">
                          <RadioButtonGroup
                            options={taxOptions}
                            value={taxType || taxOptions[0]?.value}
                            onChange={setTaxType}
                          />
                          <span className="help-txt">※ 과세로 설정하면 가격에는 VAT를 포함합니다.</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>마케팅분류</th>
                      <td>
                        <div className="filed-check-flx">
                          {marketingOptions.map((opt) => (
                            <div key={opt.value} className="check-form-box">
                              <input
                                type="checkbox"
                                id={`${uniqueId}-mkcf-${opt.value}`}
                                checked={marketingTags.includes(opt.value)}
                                onChange={(e) => {
                                  setMarketingTags((prev) =>
                                    e.target.checked
                                      ? [...prev, opt.value]
                                      : prev.filter((v) => v !== opt.value)
                                  )
                                }}
                              />
                              <label htmlFor={`${uniqueId}-mkcf-${opt.value}`}>{opt.label}</label>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>온도분류</th>
                      <td>
                        <div className="filed-check-flx">
                          {temperatureOptions.map((opt) => (
                            <div key={opt.value} className="check-form-box">
                              <input
                                type="checkbox"
                                id={`${uniqueId}-tmpcf-${opt.value}`}
                                checked={temperatureTags.includes(opt.value)}
                                onChange={(e) => {
                                  setTemperatureTags((prev) =>
                                    e.target.checked
                                      ? [...prev, opt.value]
                                      : prev.filter((v) => v !== opt.value)
                                  )
                                }}
                              />
                              <label htmlFor={`${uniqueId}-tmpcf-${opt.value}`}>{opt.label}</label>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                    {(menuType || menuTypeOptions[0]?.value) === menuTypeOptions[0]?.value && (
                      <tr>
                        <th>노출순서</th>
                        <td>
                          <Input
                            type="number"
                            value={displayOrder !== null ? String(displayOrder) : ''}
                            onChange={() => {}}
                            onValueChange={(val) => setDisplayOrder(val)}
                            placeholder="노출순서"
                          />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <th>
                        메뉴 Description <span className="red">*</span>
                      </th>
                      <td>
                        <Input
                          value={description}
                          onChange={(e) => {
                            setDescription(e.target.value)
                            clearFieldError('description')
                          }}
                          placeholder="메뉴 설명을 입력하세요"
                          error={!!fieldErrors.description}
                          helpText={fieldErrors.description}
                          fullWidth
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>메뉴 이미지</th>
                      <td>
                        <ImageUpload
                          images={images}
                          onAdd={handleImageAdd}
                          onRemove={handleImageRemove}
                          multiple={false}
                          guideText="Drag & Drop으로 이미지를 옮겨주세요."
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 섹션3: 카테고리 선택 */}
              <CategorySelectSection
                bpId={bpId}
                selectedCategories={selectedCategories}
                onChange={(cats) => {
                  setSelectedCategories(cats)
                  clearFieldError('categories')
                }}
                error={fieldErrors.categories}
              />

              {/* 섹션4: 옵션 정보 */}
              <OptionSetSection
                optionSets={optionSets}
                onChange={setOptionSets}
                bpId={bpId}
                fieldErrors={fieldErrors}
                onClearFieldError={clearFieldError}
              />
            </div>
          </AnimateHeight>
        </div>
      </div>
    </div>
  )
}
