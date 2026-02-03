'use client'

import { forwardRef, useEffect, useId, useRef, type RefObject } from 'react'

/**
 * Daum 우편번호 서비스 응답 데이터 타입
 * @see https://postcode.map.daum.net/guide
 */
export interface DaumPostcodeData {
  /** 국가기초구역번호 (새 우편번호) */
  zonecode: string
  /** 기본 주소 */
  address: string
  /** 기본 영문 주소 */
  addressEnglish: string
  /** 검색된 기본 주소 타입: R(도로명), J(지번) */
  addressType: 'R' | 'J'
  /** 사용자가 선택한 주소 타입 */
  userSelectedType: 'R' | 'J'
  /** 도로명 주소 */
  roadAddress: string
  /** 영문 도로명 주소 */
  roadAddressEnglish: string
  /** 지번 주소 */
  jibunAddress: string
  /** 영문 지번 주소 */
  jibunAddressEnglish: string
  /** 건물명 */
  buildingName: string
  /** 공동주택 여부 */
  apartment: 'Y' | 'N'
  /** 도/시 이름 */
  sido: string
  /** 시/군/구 이름 */
  sigungu: string
  /** 법정동/법정리 이름 */
  bname: string
  /** 도로명 */
  roadname: string
  /** 건물관리번호 */
  buildingCode: string
  /** 법정동/법정리 코드 */
  bcode: string
}

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

/**
 * 주소 데이터 타입
 */
export interface AddressData {
  /** 우편번호 (내부 저장용) */
  zonecode?: string
  /** 기본 주소 (도로명 또는 지번) */
  address: string
  /** 상세 주소 */
  addressDetail: string
  /** 건물명 */
  buildingName?: string
  /** 도로명 주소 */
  roadAddress?: string
  /** 지번 주소 */
  jibunAddress?: string
}

/**
 * AddressSearch 컴포넌트 Props
 */
export interface AddressSearchProps {
  /** 라벨 텍스트 */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 에러 상태 */
  error?: boolean
  /** 에러 메시지 또는 도움말 */
  helpText?: string
  /** 현재 주소 데이터 */
  value: AddressData
  /** 주소 변경 핸들러 */
  onChange: (data: AddressData) => void
  /** 상세주소 input ref (주소 선택 후 포커스 이동용) */
  detailInputRef?: RefObject<HTMLInputElement | null>
  /** 비활성화 여부 */
  disabled?: boolean
  /** 기본 주소 placeholder */
  addressPlaceholder?: string
  /** 상세 주소 placeholder */
  detailPlaceholder?: string
  /** 컨테이너 추가 클래스 */
  containerClassName?: string
}

// Daum Postcode 스크립트 로드 상태
let isScriptLoaded = false
let isScriptLoading = false
const scriptLoadCallbacks: (() => void)[] = []

/**
 * Daum Postcode 스크립트 동적 로드
 */
const loadDaumPostcodeScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isScriptLoaded) {
      resolve()
      return
    }

    if (isScriptLoading) {
      scriptLoadCallbacks.push(resolve)
      return
    }

    isScriptLoading = true
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      isScriptLoaded = true
      isScriptLoading = false
      resolve()
      scriptLoadCallbacks.forEach((cb) => cb())
      scriptLoadCallbacks.length = 0
    }
    document.head.appendChild(script)
  })
}

/**
 * 주소 찾기 공통 컴포넌트
 * - Daum 우편번호 서비스를 이용한 주소 검색
 * - 우편번호, 기본주소, 상세주소 입력 지원
 * - 에러 상태 및 필수 입력 표시 지원
 * 
 * @see https://postcode.map.daum.net/guide
 */
const AddressSearch = forwardRef<HTMLInputElement, AddressSearchProps>(
  (
    {
      label,
      required = false,
      error = false,
      helpText,
      value,
      onChange,
      detailInputRef,
      disabled = false,
      addressPlaceholder = '주소를 선택하세요',
      detailPlaceholder = '상세 주소를 입력하세요',
      containerClassName = '',
    },
    ref
  ) => {
    const inputId = useId()
    const internalDetailRef = useRef<HTMLInputElement>(null)
    const detailRef = detailInputRef || internalDetailRef

    // 스크립트 미리 로드
    useEffect(() => {
      loadDaumPostcodeScript()
    }, [])

    // 주소 검색 팝업 열기
    const handleOpenPostcode = async () => {
      if (disabled) return

      await loadDaumPostcodeScript()

      const width = 500
      const height = 600

      if (!window.daum) return

      new window.daum.Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          // 도로명 주소 조합
          let fullAddress = data.address
          let extraAddress = ''

          if (data.addressType === 'R') {
            // 법정동명이 있을 경우 추가 (법정리는 제외)
            if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
              extraAddress += data.bname
            }
            // 건물명이 있고, 공동주택일 경우 추가
            if (data.buildingName !== '' && data.apartment === 'Y') {
              extraAddress += extraAddress !== '' ? ', ' + data.buildingName : data.buildingName
            }
            // 참고항목이 있을 경우 괄호로 추가
            if (extraAddress !== '') {
              fullAddress += ` (${extraAddress})`
            }
          }

          onChange({
            zonecode: data.zonecode,
            address: fullAddress,
            addressDetail: value.addressDetail || '',
            buildingName: data.buildingName,
            roadAddress: data.roadAddress,
            jibunAddress: data.jibunAddress,
          })

          // 상세주소 입력 필드로 포커스 이동
          setTimeout(() => {
            detailRef.current?.focus()
          }, 100)
        },
        width: '100%',
        height: '100%',
      }).open({
        left: Math.round((window.screen.width - width) / 2),
        top: Math.round((window.screen.height - height) / 2),
        popupTitle: '주소 검색',
      })
    }

    // 상세주소 변경 핸들러
    const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...value,
        addressDetail: e.target.value,
      })
    }

    // 상세주소 초기화
    const handleClearDetail = () => {
      onChange({
        ...value,
        addressDetail: '',
      })
      detailRef.current?.focus()
    }

    return (
      <div className={containerClassName}>
        {/* 라벨 */}
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 mb-1 text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="red">*</span>}
          </label>
        )}

        {/* 주소 찾기 버튼 */}
        <div className="filed-btn mb10">
          <button
            type="button"
            className="btn-form outline s"
            onClick={handleOpenPostcode}
            disabled={disabled}
          >
            주소 찾기
          </button>
        </div>

        {/* 주소 입력 필드들 */}
        <div className="filed-flx">
          {/* 기본 주소 (disabled) */}
          <div className="block">
            <input
              ref={ref}
              id={inputId}
              type="text"
              className="input-frame"
              value={value.address}
              placeholder={addressPlaceholder}
              disabled
              aria-invalid={error}
            />
          </div>

          {/* 상세 주소 (editable) */}
          <div className="block">
            <div className={`input-icon-frame${error && !value.address ? ' err' : ''}`}>
              <input
                ref={detailRef}
                type="text"
                value={value.addressDetail}
                onChange={handleDetailChange}
                placeholder={detailPlaceholder}
                disabled={disabled}
              />
              {value.addressDetail && !disabled && (
                <button
                  type="button"
                  className="input-icon-btn del"
                  onClick={handleClearDetail}
                  aria-label="상세주소 초기화"
                />
              )}
            </div>
          </div>
        </div>

        {/* 에러/도움말 메시지 */}
        {helpText && (
          <div
            className={`${error ? 'warning-txt' : 'form-helper'} mt5`}
            role={error ? 'alert' : undefined}
          >
            {error && '* '}
            {helpText}
          </div>
        )}
      </div>
    )
  }
)

AddressSearch.displayName = 'AddressSearch'

export default AddressSearch
