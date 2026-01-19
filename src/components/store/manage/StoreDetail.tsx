'use client'
import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Location from '@/components/ui/Location'
import { useStoreActions, useStoreDetail } from '@/hooks/useStore'
import { useBp } from '@/hooks/useBp'
import type {
  OperatingHourInfo, StoreDetailResponse, FieldErrors,
  OperatingDayType,
  OperatingFormState,
  StoreFormState,
  WeekdayKey,
} from '@/types/store'
import { StoreDetailBasicInfo } from '@/components/store/manage/StoreDetailBasicInfo'
import { StoreDetailOperatingHours } from '@/components/store/manage/StoreDetailOperatingHours'
import { useStoreDetailForm } from '@/components/store/manage/useStoreDetailForm'
import { useStoreFiles } from '@/components/store/manage/useStoreFiles'
import { UploadFile } from '@/types/upload-files'

type StoreFormMode = 'create' | 'edit'

// 신규/수정 모드에 따라 운영시간 기본값 구성
const buildDefaultOperating = (
  dayType: OperatingDayType,
  mode: StoreFormMode
): OperatingFormState => {
  if (mode === 'create') {
    return {
      dayType,
      isOperating: true,
      openTime: '07:00',
      closeTime: '18:00',
      breakTimeEnabled: true,
      breakStartTime: '07:00',
      breakEndTime: '08:00',
    }
  }

  return {
    dayType,
    isOperating: false,
    openTime: '00:00',
    closeTime: '00:00',
    breakTimeEnabled: false,
    breakStartTime: '00:00',
    breakEndTime: '00:00',
  }
}

// 폼 초기 상태 구성(신규/수정 모드별 기본값 포함)
const buildInitialForm = (mode: StoreFormMode): StoreFormState => ({
  storeOwner: 'HEAD_OFFICE',
  officeId: '',
  franchiseId: '',
  organizationId: '',
  postalCode: '',
  storeName: '',
  storeCode: '',
  operationStatus: 'STOPR_001',
  operationStatusEditedDate: '',
  businessNumber: '',
  ceoName: '',
  ceoPhone: '',
  storePhone: '',
  storeAddress: '',
  storeAddressDetail: '',
  sameAsOwner: false,
  operating: {
    WEEKDAY: buildDefaultOperating('WEEKDAY', mode),
    SATURDAY: buildDefaultOperating('SATURDAY', mode),
    SUNDAY: buildDefaultOperating('SUNDAY', mode),
  },
  businessFile: null,
  storeImages: [],
  existingFiles: [],
  deleteImages: [],
  weekDaySelections:
    mode === 'create'
      ? {
        MONDAY: true,
        TUESDAY: true,
        WEDNESDAY: true,
        THURSDAY: true,
        FRIDAY: true,
      }
      : {
        MONDAY: false,
        TUESDAY: false,
        WEDNESDAY: false,
        THURSDAY: false,
        FRIDAY: false,
      },
})

// 시간 구간 유효성(시작 < 종료)
const isTimeRangeValid = (start: string, end: string) => {
  if (!start || !end) return false
  return start < end
}

// 운영시간 섹션 라벨
const dayTypeLabel = (dayType: OperatingDayType) => {
  if (dayType === 'WEEKDAY') return '평일'
  if (dayType === 'SATURDAY') return '토요일'
  return '일요일'
}

// 평일 요일 목록(월~금)
const weekdayKeys: WeekdayKey[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

// 요일 버튼 라벨 변환
const toWeekdayLabel = (dayType: WeekdayKey) => {
  if (dayType === 'MONDAY') return '월'
  if (dayType === 'TUESDAY') return '화'
  if (dayType === 'WEDNESDAY') return '수'
  if (dayType === 'THURSDAY') return '목'
  return '금'
}

// API dayType 값을 내부 OperatingDayType으로 정규화
const normalizeDayType = (dayType: string): OperatingDayType | null => {
  const normalized = dayType.toUpperCase()
  if (normalized === 'WEEKDAY' || normalized === 'SATURDAY' || normalized === 'SUNDAY') {
    return normalized as OperatingDayType
  }
  if (weekdayKeys.includes(normalized as WeekdayKey)) return 'WEEKDAY'
  return null
}

// 시간 문자열을 HH:mm 형태로 정규화
const normalizeTime = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length < 5) return null
  return trimmed.slice(0, 5)
}

// 점포 상세/등록 페이지 진입 컴포넌트
export default function StoreDetail() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeIdParam = searchParams.get('id')
  const storeId = storeIdParam ? Number(storeIdParam) : null
  const isEditMode = !!storeId

  const { data: detail, loading } = useStoreDetail(storeId)

  const breadcrumbs = useMemo(() => ['Home', '가맹점 및 점포 관리', '점포 정보 관리'], [])

  return (
    <div className="data-wrap">
      <Location title="점포 정보 관리" list={breadcrumbs} />
      {isEditMode && loading && !detail && <div className="data-loading">점포 정보를 불러오는 중...</div>}
      {(!isEditMode || detail) && (
        <StoreDetailForm
          key={detail?.storeInfo.id ?? (storeId ? `loading-${storeId}` : 'new')}
          detail={detail}
          isEditMode={isEditMode}
          onHoliday={() => router.push('/system/holiday')}
          onAfterSave={() => router.push('/store/manage/info')}
        />
      )}
    </div>
  )
}

// 상세 폼 내부 컴포넌트 props
interface StoreDetailFormProps {
  detail?: StoreDetailResponse | null
  isEditMode: boolean
  onHoliday: () => void
  onAfterSave: () => void
}

// 상세 폼(저장/검증/입력 포함) 본체
function StoreDetailForm({ detail, isEditMode, onHoliday, onAfterSave }: StoreDetailFormProps) {
  const { data: bpTree, loading: bpLoading } = useBp()

  const {
    formState,
    setFormState,
    storeInfoOpen,
    setStoreInfoOpen,
    operatingOpen,
    setOperatingOpen,
    addressDetailRef,
    franchiseOptions,
    handleOfficeChange,
    handleFranchiseChange,
    handleAddressSearch,
    handleOperatingChange,
    handleSameAsOwnerChange,
    handleWeekdayToggle,
    handleStoreOwnerChange,
  } = useStoreDetailForm({
    detail,
    isEditMode,
    bpTree,
    buildInitialForm,
    mapDetailToForm,
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formErrors, setFormErrors] = useState<string[]>([])

  const { create, update, saving, error: actionError } = useStoreActions()

  const {
    existingStoreImages,
    existingBusinessFile,
    storeImagePreviews,
    businessFilePreview,
    handleBusinessFileChange,
    handleStoreImagesChange,
    handleRemoveNewImage,
    toggleDeleteImage,
    getFileUrl,
  } = useStoreFiles(formState, setFormState)

  // 저장 요청(검증 -> confirm -> API 호출)
  const handleSubmit = async () => {
    const validationErrors = validateForm(formState)
    setFieldErrors(validationErrors.fieldErrors)
    setFormErrors(validationErrors.formErrors)
    if (Object.keys(validationErrors.fieldErrors).length || validationErrors.formErrors.length) return

    if (!window.confirm('저장하시겠습니까?')) return

    const existingFileIds = new Set(formState.existingFiles.map((file: UploadFile) => file.id))
    const payload = buildPayload(formState)
    const files = {
      businessFile: formState.businessFile,
      storeImages: formState.storeImages,
      deleteImages: formState.deleteImages.filter((id: number) => existingFileIds.has(id)),
    }

    try {
      if (isEditMode && detail?.storeInfo.id) {
        await update(detail.storeInfo.id, payload, files)
      } else {
        await create(payload, files)
      }

      onAfterSave()
    } catch {
      return
    }
  }

  return (
    <>
      {(formErrors.length > 0 || actionError) && (
        <div className="form-helper error">
          {actionError && <div>{actionError}</div>}
          {formErrors.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}
      <div className="detail-wrap">
        <div className="detail-header">
          <div className="detail-actions" style={{ justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
            <button className="btn-form basic" type="button" onClick={handleSubmit} disabled={saving}>
              저장
            </button>
          </div>
        </div>

        <StoreDetailBasicInfo
          isOpen={storeInfoOpen}
          isEditMode={isEditMode}
          formState={formState}
          fieldErrors={fieldErrors}
          bpTree={bpTree}
          bpLoading={bpLoading}
          franchiseOptions={franchiseOptions}
          addressDetailRef={addressDetailRef}
          existingBusinessFile={existingBusinessFile}
          existingStoreImages={existingStoreImages}
          businessFilePreview={businessFilePreview}
          storeImagePreviews={storeImagePreviews}
          onToggleOpen={() => setStoreInfoOpen((prev: boolean) => !prev)}
          onStoreOwnerChange={handleStoreOwnerChange}
          onOfficeChange={handleOfficeChange}
          onFranchiseChange={handleFranchiseChange}
          onStoreNameChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, storeName: value }))}
          onOperationStatusChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, operationStatus: value }))}
          onSameAsOwnerChange={handleSameAsOwnerChange}
          onBusinessFileChange={handleBusinessFileChange}
          onRemoveBusinessFile={() => setFormState((prev: StoreFormState) => ({ ...prev, businessFile: null }))}
          onCeoNameChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, ceoName: value }))}
          onBusinessNumberChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, businessNumber: value }))}
          onStoreAddressDetailChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, storeAddressDetail: value }))}
          onCeoPhoneChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, ceoPhone: value }))}
          onStorePhoneChange={(value) => setFormState((prev: StoreFormState) => ({ ...prev, storePhone: value }))}
          onStoreImagesChange={handleStoreImagesChange}
          onRemoveNewImage={handleRemoveNewImage}
          onToggleDeleteImage={toggleDeleteImage}
          onAddressSearch={handleAddressSearch}
          getFileUrl={getFileUrl}
        />

        <StoreDetailOperatingHours
          isOpen={operatingOpen}
          formState={formState}
          weekdayKeys={weekdayKeys}
          toWeekdayLabel={toWeekdayLabel}
          onToggleOpen={() => setOperatingOpen((prev: boolean) => !prev)}
          onOperatingChange={handleOperatingChange}
          onWeekdayToggle={handleWeekdayToggle}
          onHoliday={onHoliday}
        />
      </div>
    </>
  )
}

// API 상세 데이터를 폼 상태로 매핑
const mapDetailToForm = (detail: StoreDetailResponse, prev: StoreFormState): StoreFormState => {
  const operating = { ...prev.operating }
  const weekDaySelections = { ...prev.weekDaySelections }
  let weekdayApplied = false

  detail.operating.forEach((item) => {
    const rawDayType = String(item.dayType).toUpperCase()
    const normalized = normalizeDayType(rawDayType)
    if (!normalized) return

    if (weekdayKeys.includes(rawDayType as WeekdayKey)) {
      weekDaySelections[rawDayType as WeekdayKey] = true
    }

    const weekDayTypes = (item as { weekDayTypes?: string[] }).weekDayTypes
    if (Array.isArray(weekDayTypes)) {
      weekDayTypes.forEach((day) => {
        const normalizedDay = String(day).toUpperCase()
        if (weekdayKeys.includes(normalizedDay as WeekdayKey)) {
          weekDaySelections[normalizedDay as WeekdayKey] = true
        }
      })
    }

    if (normalized === 'WEEKDAY' && weekdayApplied) return

    operating[normalized] = {
      ...operating[normalized],
      isOperating: item.isOperating,
      openTime: normalizeTime(item.openTime) ?? operating[normalized].openTime,
      closeTime: normalizeTime(item.closeTime) ?? operating[normalized].closeTime,
      breakTimeEnabled: item.breakTimeEnabled ?? Boolean(item.breakStartTime && item.breakEndTime),
      breakStartTime: normalizeTime(item.breakStartTime) ?? operating[normalized].breakStartTime,
      breakEndTime: normalizeTime(item.breakEndTime) ?? operating[normalized].breakEndTime,
    }

    if (normalized === 'WEEKDAY') {
      weekdayApplied = true
    }
  })

  return {
    ...prev,
    storeOwner: (detail.storeInfo.storeOwner as StoreFormState['storeOwner']) ?? prev.storeOwner,
    officeId: detail.storeInfo.officeId ? String(detail.storeInfo.officeId) : prev.officeId,
    franchiseId: detail.storeInfo.franchiseId ? String(detail.storeInfo.franchiseId) : prev.franchiseId,
    organizationId:
      detail.storeInfo.storeOwner === 'FRANCHISE'
        ? detail.storeInfo.franchiseId
          ? String(detail.storeInfo.franchiseId)
          : prev.organizationId
        : detail.storeInfo.officeId
          ? String(detail.storeInfo.officeId)
          : prev.organizationId,
    storeName: detail.storeInfo.storeName ?? prev.storeName,
    storeCode: detail.storeInfo.storeCode ?? prev.storeCode,
    operationStatus: (detail.storeInfo.operationStatus as StoreFormState['operationStatus']) ?? prev.operationStatus,
    operationStatusEditedDate: detail.storeInfo.statusUpdatedDate ?? prev.operationStatusEditedDate,
    businessNumber: detail.storeInfo.businessNumber ?? prev.businessNumber,
    ceoName: detail.storeInfo.ceoName ?? prev.ceoName,
    ceoPhone: detail.storeInfo.ceoPhone ?? prev.ceoPhone,
    storePhone: detail.storeInfo.storePhone ?? prev.storePhone,
    storeAddress: detail.storeInfo.storeAddress ?? prev.storeAddress,
    storeAddressDetail: detail.storeInfo.storeAddressDetail ?? prev.storeAddressDetail,
    operating,
    existingFiles: detail.files ?? [],
    weekDaySelections,
  }
}

// 폼 상태를 API payload로 변환
const buildPayload = (formState: StoreFormState) => {
  // 입력값을 LocalTime(HH:mm) 형식으로 맞춤
  const formatLocalTime = (value?: string | null) => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null

    const clamp = (num: number, min: number, max: number) => Math.min(max, Math.max(min, num))

    if (trimmed.includes(':')) {
      const [hourText = '0', minuteText = '0'] = trimmed.split(':')
      const hour = clamp(Number(hourText), 0, 23)
      const minute = clamp(Number(minuteText), 0, 59)
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    const digits = trimmed.replace(/\D/g, '')
    if (!digits) return null
    const hour = clamp(Number(digits.slice(0, 2)), 0, 23)
    const minute = clamp(Number(digits.slice(2, 4) || 0), 0, 59)
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  const weekdayOperating = formState.operating.WEEKDAY
  const operatingHours: OperatingHourInfo[] = []

  weekdayKeys.forEach((day) => {
    if (!formState.weekDaySelections[day]) return
    operatingHours.push({
      ...weekdayOperating,
      dayType: day,
    })
  })

  operatingHours.push({ ...formState.operating.SATURDAY, dayType: 'SATURDAY' })
  operatingHours.push({ ...formState.operating.SUNDAY, dayType: 'SUNDAY' })

  const operatingHoursPayload = operatingHours.map((item) => ({
    dayType: item.dayType,
    isOperating: item.isOperating,
    openTime: item.isOperating ? formatLocalTime(item.openTime) : null,
    closeTime: item.isOperating ? formatLocalTime(item.closeTime) : null,
    breakTimeEnabled: item.breakTimeEnabled,
    breakStartTime: item.breakTimeEnabled ? formatLocalTime(item.breakStartTime) : null,
    breakEndTime: item.breakTimeEnabled ? formatLocalTime(item.breakEndTime) : null,
  }))

  return {
    storeOwner: formState.storeOwner,
    organizationId: Number(formState.organizationId),
    operationStatus: formState.operationStatus,
    storeName: formState.storeName,
    businessNumber: formState.businessNumber,
    storeAddress: formState.storeAddress,
    storeAddressDetail: formState.storeAddressDetail || null,
    ceoName: formState.ceoName,
    ceoPhone: formState.ceoPhone,
    storePhone: formState.storePhone || null,
    operatingHours: operatingHoursPayload,
  }
}

// 필수 입력 및 시간 유효성 검증
const validateForm = (formState: StoreFormState) => {
  const fieldErrors: FieldErrors = {}
  const formErrors: string[] = []

  if (!formState.organizationId.trim()) fieldErrors.organizationId = '※ 본사/가맹점 선택은 필수입니다.'
  if (!formState.storeName.trim()) fieldErrors.storeName = '※ 점포명을 입력하세요.'
  if (!formState.businessNumber.trim()) fieldErrors.businessNumber = '※ 사업자등록번호를 입력하세요.'
  if (!formState.ceoName.trim()) fieldErrors.ceoName = '※ 대표자명을 입력하세요.'
  if (!formState.ceoPhone.trim()) fieldErrors.ceoPhone = '※ 대표자 휴대폰 번호를 입력하세요.'
  if (!formState.storeAddress.trim()) fieldErrors.storeAddress = '※ 점포 주소를 입력하세요.'

    ; (['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingDayType[]).forEach((dayType) => {
      const item = formState.operating[dayType]
      if (item.isOperating && !isTimeRangeValid(item.openTime, item.closeTime)) {
        formErrors.push(`※ ${dayTypeLabel(dayType)} 운영 시간을 확인하세요.`)
      }
      if (item.breakTimeEnabled && !isTimeRangeValid(item.breakStartTime, item.breakEndTime)) {
        formErrors.push(`※ ${dayTypeLabel(dayType)} 휴게 시간을 확인하세요.`)
      }
    })

  return { fieldErrors, formErrors }
}
