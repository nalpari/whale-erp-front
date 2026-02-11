'use client'

import { useId, type ReactNode } from 'react'

/**
 * RadioButtonGroup 옵션 타입
 */
export interface RadioOption<T extends string = string> {
  /** 옵션 값 */
  value: T
  /** 옵션 라벨 (표시 텍스트) */
  label: ReactNode
}

/**
 * RadioButtonGroup 컴포넌트 Props 타입
 * - radio-wrap, radio-btn 스타일을 사용하는 버튼형 라디오 그룹
 */
export interface RadioButtonGroupProps<T extends string = string> {
  /** 라디오 옵션 목록 */
  options: RadioOption<T>[]
  /** 현재 선택된 값 */
  value: T
  /** 값 변경 핸들러 */
  onChange: (value: T) => void
  /** 비활성화 여부 */
  disabled?: boolean
  /** 라벨 텍스트 (그룹 위에 표시) */
  label?: string
  /** 필수 입력 여부 */
  required?: boolean
  /** 컨테이너 추가 클래스 */
  className?: string
  /** 라디오 버튼 이름 (폼 전송용) */
  name?: string
}

/**
 * 버튼형 라디오 그룹 컴포넌트
 * - radio-wrap, radio-btn 스타일 사용
 * - act 클래스로 선택 상태 표현
 */
export default function RadioButtonGroup<T extends string = string>({
  options,
  value,
  onChange,
  disabled = false,
  label,
  required = false,
  className = '',
  name,
}: RadioButtonGroupProps<T>) {
  const groupId = useId()
  const groupName = name || groupId

  return (
    <div className={className}>
      {/* 라벨 영역 */}
      {label && (
        <label className="flex items-center gap-1 mb-2 text-sm font-medium text-gray-700">
          {label}
          {required && <span className="red">*</span>}
        </label>
      )}

      {/* 라디오 버튼 그룹 */}
      <div className="radio-wrap" role="radiogroup" aria-label={label}>
        {options.map((option) => {
          const isSelected = value === option.value
          const optionId = `${groupId}-${option.value}`

          return (
            <button
              key={option.value}
              type="button"
              id={optionId}
              role="radio"
              aria-checked={isSelected}
              className={`radio-btn${isSelected ? ' act' : ''}`}
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
            >
              {/* 숨겨진 실제 라디오 인풋 (폼 전송용) */}
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange(option.value)}
                disabled={disabled}
                className="sr-only"
                tabIndex={-1}
              />
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

RadioButtonGroup.displayName = 'RadioButtonGroup'
