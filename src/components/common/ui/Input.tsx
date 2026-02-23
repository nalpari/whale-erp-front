'use client'

import { forwardRef, useId, useMemo, type InputHTMLAttributes, type ReactNode, type ChangeEvent } from 'react'

/** Input 타입 유형 */
export type InputType = 'text' | 'number' | 'currency' | 'percent' | 'email' | 'password' | 'tel' | 'url' | 'cellphone'

/**
 * Input 컴포넌트 Props 타입
 * - HTML input의 기본 속성을 상속받아 확장
 * - required, error, helpText, onClear 등 ERP에서 자주 쓰는 기능 포함
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type' | 'onChange'> {
  /** 입력 타입 (text: 일반, number: 숫자만, currency: 금액, percent: 퍼센트) */
  type?: InputType
  /** 라벨 텍스트 (폼 필드 위에 표시) */
  label?: string
  /** 필수 입력 여부 - true면 라벨에 * 표시 */
  required?: boolean
  /** 에러 상태 여부 - true면 빨간 테두리 */
  error?: boolean
  /** 에러 메시지 또는 도움말 텍스트 */
  helpText?: string
  /** 설명 텍스트 (입력 필드 옆에 표시되는 보조 텍스트, 예: ID코드) */
  explain?: string
  /** 값 초기화 버튼 표시 여부 */
  showClear?: boolean
  /** 값 초기화 핸들러 */
  onClear?: () => void
  /** 입력 필드 좌측에 렌더링할 요소 (아이콘 등) */
  startAdornment?: ReactNode
  /** 입력 필드 우측에 렌더링할 요소 (버튼 등) */
  endAdornment?: ReactNode
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean
  /** 컨테이너 추가 클래스 */
  containerClassName?: string
  /** 값 변경 핸들러 - type에 따라 변환된 값 또는 원본 이벤트 전달 */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  /** 숫자 타입에서 실제 숫자 값 변경 핸들러 (currency, percent, number 타입용) */
  onValueChange?: (value: number | null) => void
}

/**
 * 숫자를 3자리마다 콤마가 찍힌 문자열로 변환
 */
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return ''
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value
  if (isNaN(numValue)) return ''
  return numValue.toLocaleString('ko-KR')
}

/**
 * 퍼센트 값 유효성 검사 (0 <= value <= 100)
 */
const isValidPercent = (value: number): boolean => {
  return value >= 0 && value <= 100
}

/**
 * 휴대폰 번호 포맷팅 (010-1234-1234 패턴)
 */
const formatCellphone = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return ''
  const numericValue = String(value).replace(/\D/g, '')
  if (numericValue.length <= 3) {
    return numericValue
  } else if (numericValue.length <= 7) {
    return `${numericValue.slice(0, 3)}-${numericValue.slice(3)}`
  } else {
    return `${numericValue.slice(0, 3)}-${numericValue.slice(3, 7)}-${numericValue.slice(7, 11)}`
  }
}

/**
 * 재사용 가능한 Input 컴포넌트
 * - 필수 입력 표시 (*), 에러 상태, 에러/도움말 메시지, 설명 텍스트
 * - 값 초기화 버튼, 좌/우측 adornment 지원
 * - 숫자, 금액, 퍼센트 입력 타입 지원
 * - pub 프로젝트의 MasterEdit 스타일 패턴을 참고하여 제작
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      required = false,
      error = false,
      helpText,
      explain,
      showClear = false,
      onClear,
      startAdornment,
      endAdornment,
      fullWidth = false,
      containerClassName = '',
      className = '',
      disabled,
      readOnly,
      value,
      onChange,
      onValueChange,
      ...rest
    },
    ref
  ) => {
    const inputId = useId()

    // currency, cellphone 타입일 때 표시용 값 - useMemo로 계산
    const displayValue = useMemo(() => {
      if (type === 'currency') {
        return formatCurrency(value as number | string)
      }
      if (type === 'cellphone') {
        return formatCellphone(value as string)
      }
      return ''
    }, [type, value])

    // 값이 있는지 확인 (clear 버튼 표시 여부 결정)
    const hasValue = type === 'currency' || type === 'cellphone'
      ? displayValue !== ''
      : value !== undefined && value !== null && value !== ''

    // 에러 상태일 때 테두리 스타일
    const inputWrapperClass = `input-icon-frame${error ? ' err' : ''}`

    // fullWidth일 때 block 클래스 적용
    const containerWidthClass = fullWidth ? 'block' : 'mx-500'

    // 타입에 따른 입력 처리
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      switch (type) {
        case 'number': {
          // 숫자만 허용 (빈 문자열도 허용)
          if (inputValue === '' || /^-?\d*$/.test(inputValue)) {
            onChange?.(e)
            const numValue = inputValue === '' ? null : parseInt(inputValue, 10)
            onValueChange?.(numValue)
          }
          break
        }
        case 'currency': {
          // 숫자만 허용, 콤마 제거 후 숫자로 변환
          const cleanValue = inputValue.replace(/[^\d]/g, '')
          if (cleanValue === '') {
            onValueChange?.(null)
            // 원본 이벤트의 값을 수정하여 전달
            const syntheticEvent = { ...e, target: { ...e.target, value: '' } } as ChangeEvent<HTMLInputElement>
            onChange?.(syntheticEvent)
          } else {
            const numValue = parseInt(cleanValue, 10)
            onValueChange?.(numValue)
            // 원본 숫자 값을 이벤트에 담아 전달
            const syntheticEvent = { ...e, target: { ...e.target, value: cleanValue } } as ChangeEvent<HTMLInputElement>
            onChange?.(syntheticEvent)
          }
          break
        }
        case 'percent': {
          // 숫자와 소수점만 허용
          if (inputValue === '' || /^(\d*\.?\d*)$/.test(inputValue)) {
            // 빈 값은 허용
            if (inputValue === '' || inputValue === '.') {
              onChange?.(e)
              onValueChange?.(null)
              break
            }
            const numValue = parseFloat(inputValue)
            // 0보다 크고 100보다 작은 값만 허용
            if (isNaN(numValue) || isValidPercent(numValue)) {
              onChange?.(e)
              onValueChange?.(isNaN(numValue) ? null : numValue)
            }
          }
          break
        }
        case 'cellphone': {
          // 숫자만 허용, 최대 11자리
          const cleanValue = inputValue.replace(/\D/g, '')
          if (cleanValue.length <= 11) {
            const syntheticEvent = { ...e, target: { ...e.target, value: cleanValue } } as ChangeEvent<HTMLInputElement>
            onChange?.(syntheticEvent)
          }
          break
        }
        default:
          onChange?.(e)
      }
    }

    // 표시할 값 결정
    const getDisplayValue = () => {
      if (type === 'currency' || type === 'cellphone') {
        return displayValue
      }
      return value
    }

    // 실제 input에 전달할 type 속성
    const getNativeInputType = () => {
      switch (type) {
        case 'number':
        case 'currency':
        case 'percent':
        case 'cellphone':
          return 'text' // 커스텀 검증을 위해 text 사용
        case 'email':
        case 'password':
        case 'tel':
        case 'url':
          return type // 네이티브 타입 그대로 사용
        default:
          return 'text'
      }
    }

    // 입력 모드 설정 (모바일 키패드 최적화)
    const getInputMode = () => {
      switch (type) {
        case 'number':
        case 'currency':
        case 'cellphone':
          return 'numeric'
        case 'percent':
          return 'decimal'
        default:
          return undefined
      }
    }

    return (
      <div className={`${containerClassName}`}>
        {/* 라벨 영역 */}
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1 mb-1 text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="red">*</span>}
          </label>
        )}

        {/* 입력 필드 래퍼 */}
        <div className="filed-flx">
          {/* 좌측 adornment */}
          {startAdornment}

          {/* 입력 필드 + clear 버튼 영역 */}
          <div className={containerWidthClass}>
            <div className={inputWrapperClass}>
              <input
                ref={ref}
                id={inputId}
                type={getNativeInputType()}
                inputMode={getInputMode()}
                className={`${className}`}
                disabled={disabled}
                readOnly={readOnly}
                value={getDisplayValue()}
                onChange={handleChange}
                aria-invalid={error}
                aria-describedby={helpText ? `${inputId}-help` : undefined}
                {...rest}
              />
              {showClear && hasValue && !disabled && !readOnly && (
                <button
                  type="button"
                  className="input-icon-btn del"
                  onClick={onClear}
                  aria-label="입력 값 초기화"
                />
              )}
            </div>
          </div>

          {/* 설명 텍스트 (ID코드 등) */}
          {explain && <span className="explain">{explain}</span>}

          {/* 우측 adornment */}
          {endAdornment}
        </div>

        {/* 에러/도움말 메시지 */}
        {helpText && (
          <div
            id={`${inputId}-help`}
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

Input.displayName = 'Input'

export default Input
