import { useMemo, useRef, useState } from 'react'
import type { FieldErrors, OperatingHourInfo, StoreDetailResponse, StoreHeaderRequest } from '@/types/store'
import type { DaumPostcodeData } from '@/components/common/ui/AddressSearch'
import type { BpHeadOfficeNode } from '@/types/bp'
import type { OperatingDayType, OperatingFormState, StoreFormState, WeekdayKey } from '@/types/store'
import { useCommonCodeCache } from '@/hooks/queries'

export const VALIDATE_MESSAGE: Record<string, string> = {
  A001: '※ 필수 입력 항목입니다.',
  A002: '※ 필수 선택 항목입니다.',
  A007: '※ 종료일은 시작일보다 과거일자로 설정할 수 없습니다.',
  A008: '※ 숫자만 허용합니다.',
  A009: '※ 한글만 허용합니다.',
}

export type StoreFormMode = 'create' | 'edit'

export const weekdayKeys: WeekdayKey[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

export const toWeekdayLabel = (dayType: WeekdayKey) => {
  if (dayType === 'MONDAY') return '월'
  if (dayType === 'TUESDAY') return '화'
  if (dayType === 'WEDNESDAY') return '수'
  if (dayType === 'THURSDAY') return '목'
  return '금'
}

const dayTypeLabel = (dayType: OperatingDayType) => {
  if (dayType === 'WEEKDAY') return '평일'
  if (dayType === 'SATURDAY') return '토요일'
  return '일요일'
}

const isTimeRangeValid = (start: string, end: string) => {
  if (!start || !end) return false
  return start < end
}

const normalizeDayType = (dayType: string): OperatingDayType | null => {
  const normalized = dayType.toUpperCase()
  if (normalized === 'WEEKDAY' || normalized === 'SATURDAY' || normalized === 'SUNDAY') {
    return normalized as OperatingDayType
  }
  if (weekdayKeys.includes(normalized as WeekdayKey)) return 'WEEKDAY'
  return null
}

const normalizeTime = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length < 5) return null
  return trimmed.slice(0, 5)
}

export const normalizeBusinessNumber = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/\D/g, '').slice(0, 10)
}

const formatBusinessNumber = (value: string) => {
  const digits = normalizeBusinessNumber(value)
  if (digits.length !== 10) return digits
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

export const normalizePhoneNumber = (value?: string | null) => {
  if (!value) return ''
  return value.replace(/\D/g, '').slice(0, 11)
}

const formatPhoneNumber = (value: string) => {
  const digits = normalizePhoneNumber(value)
  if (!digits) return ''

  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  if (digits.startsWith('02')) {
    if (digits.length === 9) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
    }
    if (digits.length >= 10) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }

  return digits
}

const stripHyphen = (value: string) => value.replace(/-/g, '')
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024
const BUSINESS_FILE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'hwp'])
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const PHONE_REGEX = /^(010-\d{4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/

const getFileExtension = (name: string) => {
  const trimmed = name.trim()
  const lastDot = trimmed.lastIndexOf('.')
  if (lastDot <= 0) return ''
  return trimmed.slice(lastDot + 1).toLowerCase()
}

const validateFileSize = (file: File) => file.size <= MAX_UPLOAD_SIZE

const buildDefaultOperating = (dayType: OperatingDayType, mode: StoreFormMode): OperatingFormState => {
  if (mode === 'create') {
    return {
      dayType,
      isOperating: true,
      openTime: '07:00',
      closeTime: '18:00',
      breakTimeEnabled: true,
      breakStartTime: '14:00',
      breakEndTime: '16:00',
    }
  }

  return {
    dayType,
    isOperating: false,
    openTime: '07:00',
    closeTime: '18:00',
    breakTimeEnabled: false,
    breakStartTime: '14:00',
    breakEndTime: '16:00',
  }
}

export const buildInitialForm = (mode: StoreFormMode): StoreFormState => ({
  storeOwner: 'HEAD_OFFICE',
  officeId: null,
  franchiseId: null,
  organizationId: null,
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

export const mapDetailToForm = (detail: StoreDetailResponse, prev: StoreFormState): StoreFormState => {
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
    officeId: detail.storeInfo.officeId ? Number(detail.storeInfo.officeId) : prev.officeId,
    franchiseId: detail.storeInfo.franchiseId ? Number(detail.storeInfo.franchiseId) : prev.franchiseId,
    organizationId:
      detail.storeInfo.storeOwner === 'FRANCHISE'
        ? detail.storeInfo.franchiseId
          ? Number(detail.storeInfo.franchiseId)
          : prev.organizationId
        : detail.storeInfo.officeId
          ? Number(detail.storeInfo.officeId)
          : prev.organizationId,
    storeName: detail.storeInfo.storeName ?? prev.storeName,
    storeCode: detail.storeInfo.storeCode ?? prev.storeCode,
    operationStatus: (detail.storeInfo.operationStatus as StoreFormState['operationStatus']) ?? prev.operationStatus,
    operationStatusEditedDate: detail.storeInfo.statusUpdatedDate ?? prev.operationStatusEditedDate,
    businessNumber: normalizeBusinessNumber(detail.storeInfo.businessNumber) || prev.businessNumber,
    ceoName: detail.storeInfo.ceoName ?? prev.ceoName,
    ceoPhone: normalizePhoneNumber(detail.storeInfo.ceoPhone) || prev.ceoPhone,
    storePhone: normalizePhoneNumber(detail.storeInfo.storePhone) || prev.storePhone,
    storeAddress: detail.storeInfo.storeAddress ?? prev.storeAddress,
    storeAddressDetail: detail.storeInfo.storeAddressDetail ?? prev.storeAddressDetail,
    operating,
    existingFiles: detail.files ?? [],
    weekDaySelections,
  }
}

export const buildPayload = (formState: StoreFormState): StoreHeaderRequest => {
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
    businessNumber: formatBusinessNumber(formState.businessNumber),
    storeAddress: formState.storeAddress,
    storeAddressDetail: formState.storeAddressDetail || null,
    ceoName: formState.ceoName,
    ceoPhone: formatPhoneNumber(formState.ceoPhone),
    storePhone: formState.storePhone ? formatPhoneNumber(formState.storePhone) : null,
    operatingHours: operatingHoursPayload,
  }
}

export const validateForm = (formState: StoreFormState) => {
  const fieldErrors: FieldErrors = {}
  const formErrors: string[] = []

  if (formState.organizationId === null) fieldErrors.organizationId = VALIDATE_MESSAGE.A002
  if (!formState.storeName.trim()) fieldErrors.storeName = VALIDATE_MESSAGE.A001
  if (!formState.businessNumber.trim()) fieldErrors.businessNumber = VALIDATE_MESSAGE.A001
  if (formState.businessNumber.trim()) {
    const digitsOnly = stripHyphen(formState.businessNumber)
    if (/\D/.test(digitsOnly)) {
      fieldErrors.businessNumber = VALIDATE_MESSAGE.A008
    } else if (digitsOnly.length !== 10) {
      fieldErrors.businessNumber = '※ 사업자등록번호는 10자리만 입력해주세요.'
    }
  }
  if (!formState.ceoName.trim()) fieldErrors.ceoName = VALIDATE_MESSAGE.A001
  if (!formState.ceoPhone.trim()) fieldErrors.ceoPhone = VALIDATE_MESSAGE.A001
  if (formState.ceoPhone.trim()) {
    const formatted = formatPhoneNumber(formState.ceoPhone)
    if (!PHONE_REGEX.test(formatted)) {
      fieldErrors.ceoPhone = '※ 전화번호 형식이 올바르지 않습니다'
    }
  }
  if (!formState.storeAddress.trim()) fieldErrors.storeAddress = VALIDATE_MESSAGE.A001
  if (formState.storePhone.trim()) {
    const formatted = formatPhoneNumber(formState.storePhone)
    if (!PHONE_REGEX.test(formatted)) {
      fieldErrors.storePhone = '※ 전화번호 형식이 올바르지 않습니다'
    }
  }

  if (formState.businessFile) {
    const extension = getFileExtension(formState.businessFile.name)
    if (!BUSINESS_FILE_EXTENSIONS.has(extension)) {
      fieldErrors.businessFile =
        '첨부(파일) 허용 확장자: pdf, doc, docx, xls, xlsx, ppt, pptx, zip, hwp'
    } else if (!validateFileSize(formState.businessFile)) {
      fieldErrors.businessFile = '첨부 파일 최대 크기는 10MB입니다.'
    }
  }

  if (formState.storeImages.length > 0) {
    const invalidExtension = formState.storeImages.some(
      (file) => !IMAGE_EXTENSIONS.has(getFileExtension(file.name))
    )
    if (invalidExtension) {
      fieldErrors.storeImages = '이미지 허용 확장자: jpg, jpeg, png, gif, webp'
    } else {
      const oversize = formState.storeImages.some((file) => !validateFileSize(file))
      if (oversize) {
        fieldErrors.storeImages = '이미지 최대 크기는 10MB입니다.'
      }
    }
  }

  ;(['WEEKDAY', 'SATURDAY', 'SUNDAY'] as OperatingDayType[]).forEach((dayType) => {
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

// 다음 주소 검색 API 응답 일부 타입
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void
        onclose?: (state: string) => void
        width?: string | number
        height?: string | number
      }) => {
        open: (options?: { left?: number; top?: number; popupTitle?: string }) => void
        embed: (element: HTMLElement) => void
      }
    }
  }
}

// 폼 초기화/매핑에 필요한 입력값
interface UseStoreDetailFormParams {
  detail?: StoreDetailResponse | null
  isEditMode: boolean
  bpTree: BpHeadOfficeNode[]
  getBpDetail: (id: number) => Promise<{
    bpoprType: string
    representativeName: string | null
    businessRegistartionNumber?: string
    businessRegistrationNumber?: string
    address1: string | null
    address2: string | null
    representativeMobilePhone: string | null
  }>
}

// StoreDetail 폼 상태/핸들러를 모아주는 커스텀 훅
export const useStoreDetailForm = ({
  detail,
  isEditMode,
  bpTree,
  getBpDetail,
}: UseStoreDetailFormParams) => {
  const { getHierarchyChildren, getChildren } = useCommonCodeCache()
  // 상세/신규 모드에 따라 초기값 설정
  const [formState, setFormState] = useState<StoreFormState>(() =>
    detail ? mapDetailToForm(detail, buildInitialForm('edit')) : buildInitialForm(isEditMode ? 'edit' : 'create'),
  )
  // 섹션 접힘 상태
  const [storeInfoOpen, setStoreInfoOpen] = useState(true)
  const [operatingOpen, setOperatingOpen] = useState(true)
  // "사업자 정보와 동일" 토글 복원용 스냅샷
  const sameAsOwnerSnapshot = useRef<Pick<StoreFormState, 'ceoName' | 'businessNumber' | 'ceoPhone' | 'storePhone'>>({
    ceoName: '',
    businessNumber: '',
    ceoPhone: '',
    storePhone: '',
  })
  // 상세 주소 입력 포커스 이동을 위한 ref
  const addressDetailRef = useRef<HTMLInputElement | null>(null)
  // 다음 주소 스크립트 중복 로딩 방지 플래그
  const daumScriptLoadingRef = useRef(false)

  // 본사 선택 값에 따라 가맹점 옵션 계산
  const franchiseOptions = useMemo(() => {
    if (!bpTree.length) return []
    if (!formState.officeId) {
      return bpTree.flatMap((office) => office.franchises)
    }
    const selectedOffice = bpTree.find((office) => office.id === formState.officeId)
    return selectedOffice?.franchises ?? []
  }, [bpTree, formState.officeId])

  // 본사 선택 시 가맹점/조직Id 동기화
  const handleOfficeChange = (nextOfficeId: number | null) => {
    setFormState((prev: StoreFormState) => {
      const shouldClearFranchise =
        nextOfficeId !== null &&
        prev.franchiseId !== null &&
        !bpTree
          .find((office) => office.id === nextOfficeId)
          ?.franchises.some((franchise) => franchise.id === prev.franchiseId)

      const nextFranchiseId = shouldClearFranchise ? null : prev.franchiseId
      const nextOrganizationId =
        prev.storeOwner === 'HEAD_OFFICE' ? nextOfficeId : prev.organizationId

      return {
        ...prev,
        officeId: nextOfficeId,
        franchiseId: nextFranchiseId,
        organizationId: nextOrganizationId,
      }
    })
  }

  // 가맹점 선택 시 조직Id 동기화
  const handleFranchiseChange = (nextFranchiseId: number | null) => {
    setFormState((prev) => ({
      ...prev,
      franchiseId: nextFranchiseId ?? null,
      organizationId: prev.storeOwner === 'FRANCHISE' ? nextFranchiseId : prev.organizationId,
    }))
  }

  // 다음 주소 검색 열기 + 결과 반영
  const handleAddressSearch = () => {
    if (typeof window === 'undefined') return

    const openPostcode = (DaumPostcode: NonNullable<Window['daum']>['Postcode']) => {
      const daumPostcode = new DaumPostcode({
        oncomplete: (data: DaumPostcodeData) => {
          const address = data.roadAddress || data.address || ''
          setFormState((prev) => ({
            ...prev,
            postalCode: data.zonecode ?? prev.postalCode,
            storeAddress: address,
          }))
          addressDetailRef.current?.focus()
        },
      })
      daumPostcode.open()
    }

    const PostcodeCtor = window.daum?.Postcode
    if (PostcodeCtor) {
      openPostcode(PostcodeCtor)
      return
    }

    if (daumScriptLoadingRef.current) return
    daumScriptLoadingRef.current = true

    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      daumScriptLoadingRef.current = false
      const LoadedPostcodeCtor = window.daum?.Postcode
      if (LoadedPostcodeCtor) {
        openPostcode(LoadedPostcodeCtor)
      }
    }
    script.onerror = () => {
      daumScriptLoadingRef.current = false
    }
    document.body.appendChild(script)
  }

  // 운영/휴게 시간 변경 처리
  const handleOperatingChange = (dayType: OperatingDayType, next: Partial<OperatingFormState>) => {
    setFormState((prev) => ({
      ...prev,
      operating: {
        ...prev.operating,
        [dayType]: {
          ...prev.operating[dayType],
          ...next,
        },
      },
    }))
  }

  // 사업자 정보 동일 토글 처리(복원 포함)
  const handleSameAsOwnerChange = async (checked: boolean, bpId: number | null) => {
    if (checked) {
      sameAsOwnerSnapshot.current = {
        ceoName: formState.ceoName,
        businessNumber: formState.businessNumber,
        ceoPhone: formState.ceoPhone,
        storePhone: formState.storePhone,
      }

      if (!bpId) {
        setFormState((prev) => ({
          ...prev,
          sameAsOwner: true,
        }))
        return
      }

      try {
        const bpDetail = await getBpDetail(bpId)
        const existingStatusChildren = getChildren('BPOPR')
        const statusChildren =
          existingStatusChildren.length > 0 ? existingStatusChildren : await getHierarchyChildren('BPOPR')
        const statusMatch = statusChildren.find((item) => item.code === bpDetail.bpoprType)
        const nextOperationStatus =
          statusMatch?.name === '운영' ? 'STOPR_001' : statusMatch ? 'STOPR_002' : null
        const nextBusinessNumber =
          normalizeBusinessNumber(bpDetail.businessRegistrationNumber)

        setFormState((prev) => ({
          ...prev,
          sameAsOwner: true,
          operationStatus: nextOperationStatus ?? prev.operationStatus,
          ceoName: bpDetail.representativeName ?? prev.ceoName,
          businessNumber: nextBusinessNumber || prev.businessNumber,
          storeAddress: bpDetail.address1 ?? prev.storeAddress,
          storeAddressDetail: bpDetail.address2 ?? prev.storeAddressDetail,
          ceoPhone: normalizePhoneNumber(bpDetail.representativeMobilePhone) || prev.ceoPhone,
          storePhone: normalizePhoneNumber(bpDetail.representativeMobilePhone) || prev.storePhone,
        }))
      } catch {
        setFormState((prev) => ({
          ...prev,
          sameAsOwner: true,
        }))
      }
      return
    }

    setFormState((prev) => ({
      ...prev,
      sameAsOwner: false,
    }))
  }

  // 평일 요일 선택 토글
  const handleWeekdayToggle = (day: WeekdayKey) => {
    setFormState((prev) => ({
      ...prev,
      weekDaySelections: {
        ...prev.weekDaySelections,
        [day]: !prev.weekDaySelections[day],
      },
    }))
  }

  // 점포 소유(본사/가맹점) 변경 시 조직Id 동기화
  const handleStoreOwnerChange = (owner: StoreFormState['storeOwner']) => {
    setFormState((prev) => ({
      ...prev,
      storeOwner: owner,
      organizationId: owner === 'HEAD_OFFICE' ? prev.officeId : prev.franchiseId,
    }))
  }

  return {
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
  }
}
