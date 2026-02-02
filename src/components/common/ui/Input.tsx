'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

/**
 * Input 컴포넌트 Props 타입
 * - HTML input의 기본 속성을 상속받아 확장
 * - required, error, helpText, onClear 등 ERP에서 자주 쓰는 기능 포함
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
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
}

/**
 * 재사용 가능한 Input 컴포넌트
 * - 필수 입력 표시 (*), 에러 상태, 에러/도움말 메시지, 설명 텍스트
 * - 값 초기화 버튼, 좌/우측 adornment 지원
 * - pub 프로젝트의 MasterEdit 스타일 패턴을 참고하여 제작
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
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
      ...rest
    },
    ref
  ) => {
    const inputId = useId()

    // 값이 있는지 확인 (clear 버튼 표시 여부 결정)
    const hasValue = value !== undefined && value !== null && value !== ''

    // 에러 상태일 때 테두리 스타일
    const inputWrapperClass = `input-icon-frame${error ? ' err' : ''}`

    // fullWidth일 때 block 클래스 적용
    const containerWidthClass = fullWidth ? 'block' : 'mx-500'

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
            {showClear ? (
              // clear 버튼이 있는 경우: input-icon-frame 래퍼 사용
              <div className={inputWrapperClass}>
                <input
                  ref={ref}
                  id={inputId}
                  className={`${className}`}
                  disabled={disabled}
                  readOnly={readOnly}
                  value={value}
                  aria-invalid={error}
                  aria-describedby={helpText ? `${inputId}-help` : undefined}
                  {...rest}
                />
                {hasValue && !disabled && !readOnly && (
                  <button
                    type="button"
                    className="input-icon-btn del"
                    onClick={onClear}
                    aria-label="입력 값 초기화"
                  />
                )}
              </div>
            ) : (
              // clear 버튼이 없는 경우: 기본 input-frame 스타일
              <input
                ref={ref}
                id={inputId}
                className={`input-frame${error ? ' border-red-500' : ''} ${className}`}
                disabled={disabled}
                readOnly={readOnly}
                value={value}
                aria-invalid={error}
                aria-describedby={helpText ? `${inputId}-help` : undefined}
                {...rest}
              />
            )}
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
