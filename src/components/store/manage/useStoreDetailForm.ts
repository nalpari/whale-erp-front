import { useMemo, useRef, useState } from 'react'
import type { StoreDetailResponse } from '@/types/store'
import type { BpHeadOfficeNode } from '@/hooks/useBp'
import type { OperatingDayType, OperatingFormState, StoreFormState, WeekdayKey } from '@/types/store'

// 다음 주소 검색 API 응답 일부 타입
interface DaumPostcodeData {
  zonecode?: string
  address?: string
  roadAddress?: string
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeData) => void }) => { open: () => void }
    }
  }
}

// 폼 초기화/매핑에 필요한 입력값
interface UseStoreDetailFormParams {
  detail?: StoreDetailResponse | null
  isEditMode: boolean
  bpTree: BpHeadOfficeNode[]
  buildInitialForm: (mode: 'create' | 'edit') => StoreFormState
  mapDetailToForm: (detail: StoreDetailResponse, prev: StoreFormState) => StoreFormState
}

// StoreDetail 폼 상태/핸들러를 모아주는 커스텀 훅
export const useStoreDetailForm = ({
  detail,
  isEditMode,
  bpTree,
  buildInitialForm,
  mapDetailToForm,
}: UseStoreDetailFormParams) => {
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
    const selectedOffice = bpTree.find((office) => String(office.id) === formState.officeId)
    return selectedOffice?.franchises ?? []
  }, [bpTree, formState.officeId])

  // 본사 선택 시 가맹점/조직Id 동기화
  const handleOfficeChange = (nextOfficeId: string) => {
    setFormState((prev: StoreFormState) => {
      const shouldClearFranchise =
        nextOfficeId &&
        prev.franchiseId &&
        !bpTree
          .find((office) => String(office.id) === nextOfficeId)
          ?.franchises.some((franchise) => String(franchise.id) === prev.franchiseId)

      const nextFranchiseId = shouldClearFranchise ? '' : prev.franchiseId
      const nextOrganizationId = prev.storeOwner === 'HEAD_OFFICE' ? nextOfficeId : prev.organizationId

      return {
        ...prev,
        officeId: nextOfficeId,
        franchiseId: nextFranchiseId,
        organizationId: nextOrganizationId,
      }
    })
  }

  // 가맹점 선택 시 조직Id 동기화
  const handleFranchiseChange = (nextFranchiseId: string) => {
    setFormState((prev) => ({
      ...prev,
      franchiseId: nextFranchiseId,
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
  const handleSameAsOwnerChange = (checked: boolean) => {
    if (checked) {
      sameAsOwnerSnapshot.current = {
        ceoName: formState.ceoName,
        businessNumber: formState.businessNumber,
        ceoPhone: formState.ceoPhone,
        storePhone: formState.storePhone,
      }
      setFormState((prev) => ({
        ...prev,
        sameAsOwner: true,
        ceoName: detail?.storeInfo.ceoName ?? prev.ceoName,
        businessNumber: detail?.storeInfo.businessNumber ?? prev.businessNumber,
        ceoPhone: detail?.storeInfo.ceoPhone ?? prev.ceoPhone,
        storePhone: detail?.storeInfo.storePhone ?? prev.storePhone,
      }))
      return
    }

    setFormState((prev) => ({
      ...prev,
      sameAsOwner: false,
      ...sameAsOwnerSnapshot.current,
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
